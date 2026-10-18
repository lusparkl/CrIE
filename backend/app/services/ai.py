import json
import re
from abc import ABC, abstractmethod
from collections import Counter

from openai import AsyncOpenAI
from pydantic import ValidationError

from ..config import get_settings
from ..models import Prompt
from ..schemas import AICriterion, AIEvaluation, AIMistake
from .evaluation_prompts import build_evaluation_messages


SEVERITY_ALIASES = {
    "minor": "low",
    "mild": "low",
    "moderate": "medium",
    "major": "high",
    "serious": "high",
    "severe": "high",
    "critical": "high",
}


def parse_evaluation_response(content: str) -> AIEvaluation:
    """Validate core scoring while isolating malformed mistake annotations."""
    payload = json.loads(content)
    raw_mistakes = payload.get("mistakes", [])
    valid_mistakes: list[AIMistake] = []

    if isinstance(raw_mistakes, list):
        for raw_mistake in raw_mistakes:
            if not isinstance(raw_mistake, dict):
                continue
            normalized = dict(raw_mistake)
            severity = normalized.get("severity")
            if isinstance(severity, str):
                severity = severity.strip().lower()
                normalized["severity"] = SEVERITY_ALIASES.get(severity, severity)
            category = normalized.get("category")
            if isinstance(category, str):
                normalized["category"] = category.strip().lower().replace("-", "_").replace(" ", "_")
            try:
                valid_mistakes.append(AIMistake.model_validate(normalized))
            except ValidationError:
                continue

    payload["mistakes"] = valid_mistakes
    return AIEvaluation.model_validate(payload)


def _overlaps(start: int, end: int, spans: list[tuple[int, int]]) -> bool:
    return any(start < span_end and end > span_start for span_start, span_end in spans)


def _text_occurrences(essay: str, text: str) -> list[tuple[int, int]]:
    """Find exact spans first, with a whitespace/case-tolerant fallback."""
    exact = [(match.start(), match.end()) for match in re.finditer(re.escape(text), essay)]
    if exact:
        return exact

    words = re.split(r"\s+", text.strip())
    if not words or not words[0]:
        return []
    flexible_pattern = r"\s+".join(re.escape(word) for word in words)
    return [(match.start(), match.end()) for match in re.finditer(flexible_pattern, essay, re.IGNORECASE)]


def repair_mistake_ranges(essay: str, mistakes: list[AIMistake]) -> list[AIMistake]:
    """Return only valid, non-overlapping highlights, repairing model offsets when possible.

    Language models are reliable at quoting a problematic phrase but not at counting
    character offsets. Exact ranges are retained first. Invalid ranges are relocated
    to the closest matching phrase; a highlight that cannot be mapped safely is
    omitted without discarding the rest of the evaluation.
    """
    resolved: list[AIMistake] = []
    occupied: list[tuple[int, int]] = []
    pending: list[AIMistake] = []

    for mistake in sorted(mistakes, key=lambda item: (item.start, item.end)):
        range_is_exact = mistake.end <= len(essay) and essay[mistake.start:mistake.end] == mistake.text
        if range_is_exact and not _overlaps(mistake.start, mistake.end, occupied):
            resolved.append(mistake)
            occupied.append((mistake.start, mistake.end))
        else:
            pending.append(mistake)

    for mistake in pending:
        candidates = [
            span
            for span in _text_occurrences(essay, mistake.text)
            if not _overlaps(span[0], span[1], occupied)
        ]
        if not candidates:
            continue
        start, end = min(candidates, key=lambda span: (abs(span[0] - mistake.start), span[0]))
        resolved.append(mistake.model_copy(update={"text": essay[start:end], "start": start, "end": end}))
        occupied.append((start, end))

    return sorted(resolved, key=lambda item: (item.start, item.end))


class EvaluationService(ABC):
    mode: str

    @abstractmethod
    async def evaluate(self, prompt: Prompt, essay: str) -> AIEvaluation:
        raise NotImplementedError


class OpenAIEvaluationService(EvaluationService):
    mode = "ai"

    def __init__(self) -> None:
        settings = get_settings()
        kwargs = {"api_key": settings.openai_api_key}
        if settings.openai_base_url:
            kwargs["base_url"] = settings.openai_base_url
        self.client = AsyncOpenAI(**kwargs)
        self.model = settings.openai_model

    async def evaluate(self, prompt: Prompt, essay: str) -> AIEvaluation:
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=build_evaluation_messages(prompt, essay),
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        content = response.choices[0].message.content
        if not content:
            raise ValueError("The evaluator returned an empty response")
        result = parse_evaluation_response(content)
        required = {"task_achievement" if prompt.task_type == "task1" else "task_response", "coherence_cohesion", "lexical_resource", "grammar"}
        if set(result.criteria) != required:
            raise ValueError("The evaluator returned an invalid set of criteria")
        result.mistakes = repair_mistake_ranges(essay, result.mistakes)
        return result


class MockEvaluationService(EvaluationService):
    """Deterministic local evaluator for product testing; not a claim of real scoring."""

    mode = "demo"

    PATTERNS = [
        (r"\bthe peoples\b", "singular_plural", "People is already a plural noun in this context.", "the people"),
        (r"\bpeople is\b", "subject_verb_agreement", "The plural subject ‘people’ needs a plural verb.", "people are"),
        (r"\bthis (?:save|show|make|give|cause)\b", "subject_verb_agreement", "A singular subject needs the third-person singular verb form.", None),
        (r"\b(?:kids|a lot of|stuff)\b", "informal_language", "This wording is too informal or imprecise for an academic response.", "Use a precise academic alternative"),
        (r"\b(?:informations|advices|researches)\b", "singular_plural", "This noun is normally uncountable in this meaning.", "Use the uncountable form"),
        (r"\b(?:alot|goverment|enviroment|benefical)\b", "spelling", "This word is misspelled.", "Check the standard spelling"),
        (r"\bmore easier\b", "incorrect_word_choice", "Do not use both ‘more’ and the comparative ending together.", "easier"),
    ]

    def _mistakes(self, prompt: Prompt, essay: str) -> list[AIMistake]:
        found: list[AIMistake] = []
        occupied: list[tuple[int, int]] = []
        for pattern, category, explanation, suggestion in self.PATTERNS:
            for match in re.finditer(pattern, essay, re.IGNORECASE):
                replacement = suggestion
                if category == "subject_verb_agreement" and replacement is None:
                    replacement = re.sub(r"\b(save|show|make|give|cause)\b", lambda m: m.group(1) + "s", match.group(0), flags=re.I)
                found.append(AIMistake(text=match.group(0), start=match.start(), end=match.end(), category=category, severity="medium", explanation=explanation, suggestion=replacement or "Revise this phrase"))
                occupied.append((match.start(), match.end()))

        words = [(m.group(0).lower(), m.start(), m.end()) for m in re.finditer(r"\b[A-Za-z]{5,}\b", essay)]
        stop = {"which", "their", "there", "these", "those", "because", "should", "would", "could", "about", "people", "however", "overall"}
        counts = Counter(word for word, _, _ in words if word not in stop)
        repeated = next(((word, count) for word, count in counts.most_common() if count >= 5), None)
        if repeated:
            word = repeated[0]
            matches = [(s, e) for w, s, e in words if w == word]
            start, end = matches[-1]
            if not any(start < e and end > s for s, e in occupied):
                found.append(AIMistake(text=essay[start:end], start=start, end=end, category="repetitive_vocabulary", severity="low", explanation=f"‘{word}’ appears frequently; controlled variation would improve lexical range.", suggestion="Use a precise synonym where the meaning allows"))
                occupied.append((start, end))

        paragraphs = [p.strip() for p in essay.split("\n") if p.strip()]
        if len(paragraphs) < 3 and len(essay.split()) > 80:
            first_end = min(len(essay), len(paragraphs[0]) if paragraphs else 1)
            if not any(0 < end and first_end > start for start, end in occupied):
                found.append(AIMistake(text=essay[:first_end], start=0, end=first_end, category="weak_paragraph_structure", severity="medium", explanation="The response needs clearer paragraph divisions for its main ideas.", suggestion="Separate the introduction, main ideas and conclusion into focused paragraphs"))
                occupied.append((0, first_end))

        if prompt.task_type == "task1" and not re.search(r"\b(overall|in general|it is clear)\b", essay, re.I):
            end = min(len(essay), max(1, essay.find(".") + 1))
            if not any(0 < span_end and end > span_start for span_start, span_end in occupied):
                found.append(AIMistake(text=essay[:end], start=0, end=end, category="missing_overview", severity="high", explanation="Academic Task 1 requires a clear overview of the main trends or stages.", suggestion="Add a separate overview identifying the most important features"))
        return sorted(found, key=lambda item: item.start)[:12]

    async def evaluate(self, prompt: Prompt, essay: str) -> AIEvaluation:
        mistakes = self._mistakes(prompt, essay)
        word_count = len(re.findall(r"\b[\w’'-]+\b", essay))
        target = 150 if prompt.task_type == "task1" else 250
        length_factor = min(1.0, word_count / target)
        paragraph_count = len([p for p in essay.split("\n") if p.strip()])
        base = 4.5 + 2.0 * length_factor
        task_band = base - (0.5 if word_count < target * 0.7 else 0)
        coherence = base + (0.5 if paragraph_count >= 4 else -0.5)
        lexical = base - (0.5 if any(m.category in {"limited_vocabulary", "repetitive_vocabulary", "incorrect_word_choice"} for m in mistakes) else 0)
        grammar = base - min(1.0, len([m for m in mistakes if m.category in {"singular_plural", "subject_verb_agreement", "spelling"}]) * 0.5)

        def band(value: float) -> float:
            return max(3.0, min(8.0, round(value * 2) / 2))

        task_key = "task_achievement" if prompt.task_type == "task1" else "task_response"
        criteria = {
            task_key: AICriterion(band=band(task_band), explanation="The response addresses the task and presents a discernible main message, though the depth and precision vary.", recommendation="State the central features or position clearly, then support every main point with specific evidence."),
            "coherence_cohesion": AICriterion(band=band(coherence), explanation="The response has a generally logical sequence, with paragraphing and linking that are mostly easy to follow.", recommendation="Give each paragraph one clear purpose and use linking phrases only where the relationship is not already obvious."),
            "lexical_resource": AICriterion(band=band(lexical), explanation="Vocabulary communicates the main ideas, with some scope for greater precision and controlled variation.", recommendation="Replace broad repeated terms with topic-specific language, while prioritising accuracy over unusual vocabulary."),
            "grammar": AICriterion(band=band(grammar), explanation="Sentence forms show some range, although local errors can reduce precision.", recommendation="Reserve two minutes to check subject–verb agreement, noun forms and sentence boundaries."),
        }
        overall = band(sum(item.band for item in criteria.values()) / 4)
        improvements = ["Develop each main idea with a specific explanation or comparison.", "Proofread the final response for small grammar and word-form errors."]
        if word_count < target:
            improvements.insert(0, f"Aim for at least {target} words so the response is fully developed.")
        return AIEvaluation(
            estimated_overall_band=overall,
            criteria=criteria,
            strengths=["The response stays relevant to the assigned topic.", "The central message is identifiable and the writing is generally easy to follow."],
            improvements=improvements,
            mistakes=mistakes,
        )


def get_evaluation_service() -> EvaluationService:
    return OpenAIEvaluationService() if get_settings().openai_api_key else MockEvaluationService()
