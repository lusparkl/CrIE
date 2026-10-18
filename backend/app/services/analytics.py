from collections import Counter, defaultdict

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..config import get_settings
from ..models import DetectedMistake, EssayEvaluation, EssaySubmission
from ..schemas import DashboardResponse, GeneralTip, RecurringWeakness, TrendPoint, WeaknessDetail, WeaknessExample


CRITERION_LABELS = {
    "task_response": "Task Response",
    "task_achievement": "Task Achievement",
    "coherence_cohesion": "Coherence & Cohesion",
    "lexical_resource": "Lexical Resource",
    "grammar": "Grammatical Range & Accuracy",
}

CRITERION_TIPS = {
    "task_response": "Before writing, turn every part of the question into a checklist. After drafting, verify that your position is explicit and every body paragraph directly advances it.",
    "task_achievement": "Plan a one-sentence overview before describing details. Use it to name the two or three largest trends, contrasts, or stages without adding data that is not shown.",
    "coherence_cohesion": "Give each paragraph one job: a clear opening claim followed by evidence or explanation. Remove connectors where the relationship is already obvious.",
    "lexical_resource": "Prioritise precise, natural word combinations over unusual vocabulary. Keep a short list of repeated words and replace them only where the meaning remains exact.",
    "grammar": "Reserve a final accuracy pass for sentence boundaries, subject–verb agreement, articles, and noun forms. Check one error family at a time instead of rereading generally.",
}

CATEGORY_TIPS = {
    "article_usage": "On your final pass, inspect every singular countable noun. Decide whether it needs a/an, the, or a plural form, and use “the” only when the reader can identify the specific noun.",
    "subject_verb_agreement": "Underline the true subject of each clause, ignore phrases between the subject and verb, then check whether the verb form is singular or plural.",
    "verb_tense": "Set the main time frame for each paragraph before drafting, then check every verb against that time frame and any dates in the task.",
    "preposition": "Record the whole phrase—not only the preposition—when you correct an error. Practise combinations such as “increase in,” “responsible for,” and “compared with” as complete chunks.",
    "sentence_fragment": "Check that every sentence has a finite verb and a complete main clause. Attach dependent clauses beginning with words like “although” or “because” to a complete idea.",
    "run_on_sentence": "When a sentence contains several complete ideas, separate them with a full stop or semicolon. Do not rely on a comma alone to join independent clauses.",
    "punctuation": "Read each sentence aloud and mark the boundary of every complete idea. Use commas for internal structure, but full stops for separate claims.",
    "singular_plural": "Check quantity words and determiners first, then make the noun and any related pronouns agree in number.",
    "word_order": "Build the core clause in subject–verb–object order first. Add adverbs and qualifying phrases only after the main relationship is clear.",
    "spelling": "Build a personal spelling list from these repeated errors. Practise each word in a full sentence, then search for those exact words during your final review.",
    "repetitive_vocabulary": "Highlight repeated content words after drafting. Keep necessary key terms, but replace avoidable repetition with a precise synonym or a pronoun where the reference is clear.",
    "incorrect_word_choice": "Check the meaning and grammar pattern of the whole phrase. Prefer a familiar accurate word over a more advanced word whose collocation is uncertain.",
    "informal_language": "Replace conversational words with precise neutral alternatives, while avoiding unnecessarily complicated language.",
    "collocation": "Learn the corrected expression as a complete word partnership. Reuse it in two new sentences so the combination becomes automatic.",
    "limited_vocabulary": "Prepare a small topic vocabulary bank before writing, organised by meaning and common collocations rather than isolated synonyms.",
    "weak_paragraph_structure": "Give every paragraph one controlling idea, state it early, and ensure each following sentence explains, supports, or exemplifies that idea.",
    "unclear_reference": "For every pronoun such as “this,” “it,” or “they,” identify the exact noun it refers to. Repeat the noun when the reference could be ambiguous.",
    "poor_linking": "Choose linking language based on the real relationship—contrast, cause, result, or example—and omit it when sentence order already makes the connection clear.",
    "excessive_linking_words": "Remove connectors that do not add meaning. Strong paragraph structure and clear sentence order should carry most of the flow.",
    "weak_topic_sentence": "Open each body paragraph with the specific claim it will prove, not a broad statement that could introduce several different ideas.",
    "incomplete_task_response": "Underline every instruction in the task and convert it into a planning question. Confirm that the final response answers each question explicitly.",
    "weak_idea_development": "After every main claim, add a why/how explanation and one concrete consequence or example before moving to the next idea.",
    "irrelevant_information": "Test every sentence against the paragraph’s main claim and the task. Remove details that do not help answer either one.",
    "weak_example": "Use examples to prove the preceding claim: make the situation specific, explain the result, and connect it back to your argument.",
    "missing_overview": "Write the overview before the detail paragraphs and identify the most important trends, contrasts, or stages without listing every number.",
    "inaccurate_data_description": "Cross-check every number, unit, year, and comparison against the source visual before submitting.",
}


def tip_for_category(category: str) -> str:
    return CATEGORY_TIPS.get(category, "Review each occurrence across your essays, identify the repeated decision behind it, and add one focused check for that pattern to your final revision routine.")


def _average(values: list[float]) -> float | None:
    return round(sum(values) / len(values), 1) if values else None


def _list_item(submission: EssaySubmission) -> dict:
    return {
        "id": submission.id,
        "prompt_id": submission.prompt_id,
        "submitted_at": submission.submitted_at,
        "task_type": submission.prompt.task_type,
        "topic": submission.prompt.topic,
        "title": submission.prompt.title,
        "overall_band": submission.evaluation.overall_band if submission.evaluation else None,
        "word_count": submission.word_count,
        "duration_seconds": submission.duration_seconds,
        "status": submission.status,
        "is_revision": not submission.counts_toward_statistics,
        "revision_of_id": submission.revision_of_id,
    }


def weakness_stats(submissions: list[EssaySubmission]) -> list[RecurringWeakness]:
    completed = [s for s in submissions if s.status == "completed" and s.counts_toward_statistics]
    recent = completed[:7]
    total_counts: Counter[str] = Counter()
    essay_counts: Counter[str] = Counter()
    recent_counts: Counter[str] = Counter()
    for submission in completed:
        categories = {m.category for m in submission.mistakes}
        total_counts.update(m.category for m in submission.mistakes)
        essay_counts.update(categories)
    for submission in recent:
        recent_counts.update({m.category for m in submission.mistakes})

    chronological = list(reversed(completed[:10]))
    midpoint = max(1, len(chronological) // 2)
    earlier, later = chronological[:midpoint], chronological[midpoint:]
    results: list[RecurringWeakness] = []
    for category, occurrences in total_counts.most_common():
        earlier_rate = sum(category in {m.category for m in s.mistakes} for s in earlier) / max(1, len(earlier))
        later_rate = sum(category in {m.category for m in s.mistakes} for s in later) / max(1, len(later))
        if later_rate < earlier_rate - 0.15:
            trend = "improving"
        elif later_rate > earlier_rate + 0.15:
            trend = "needs attention"
        else:
            trend = "stable"
        results.append(RecurringWeakness(
            category=category,
            occurrences=occurrences,
            essay_count=essay_counts[category],
            recent_essay_total=len(recent),
            recent_percentage=round(100 * recent_counts[category] / max(1, len(recent))),
            trend=trend,
            recurring=essay_counts[category] >= get_settings().recurring_essay_threshold,
        ))
    return sorted(results, key=lambda item: (not item.recurring, -item.essay_count, -item.occurrences))


def weakness_detail_for_user(db: Session, user_id: int, category: str) -> WeaknessDetail | None:
    mistakes = db.scalars(
        select(DetectedMistake)
        .join(DetectedMistake.submission)
        .where(
            DetectedMistake.user_id == user_id,
            DetectedMistake.category == category,
            EssaySubmission.status == "completed",
            EssaySubmission.counts_toward_statistics.is_(True),
        )
        .options(selectinload(DetectedMistake.submission).selectinload(EssaySubmission.prompt))
        .order_by(EssaySubmission.submitted_at.desc(), DetectedMistake.start)
    ).all()
    if not mistakes:
        return None

    examples: list[WeaknessExample] = []
    for mistake in mistakes:
        submission = mistake.submission
        context_start = max(0, mistake.start - 70)
        context_end = min(len(submission.essay_text), mistake.end + 70)
        examples.append(WeaknessExample(
            id=mistake.id,
            submission_id=submission.id,
            submitted_at=submission.submitted_at,
            task_type=submission.prompt.task_type,
            topic=submission.prompt.topic,
            title=submission.prompt.title,
            text=mistake.text,
            context_before=submission.essay_text[context_start:mistake.start],
            context_after=submission.essay_text[mistake.end:context_end],
            severity=mistake.severity,
            explanation=mistake.explanation,
            suggestion=mistake.suggestion,
        ))

    return WeaknessDetail(
        category=category,
        occurrences=len(mistakes),
        essay_count=len({mistake.submission_id for mistake in mistakes}),
        tip=tip_for_category(category),
        examples=examples,
    )


def general_tips_for_record(
    completed: list[EssaySubmission],
    averaged: dict[str, float],
    weaknesses: list[RecurringWeakness],
) -> list[GeneralTip]:
    if not completed:
        return []

    tips: list[GeneralTip] = []
    if averaged:
        weakest_key = min(averaged, key=averaged.get)
        tips.append(GeneralTip(
            title=f"Prioritise {CRITERION_LABELS[weakest_key]}",
            guidance=CRITERION_TIPS[weakest_key],
            evidence=f"This is your lowest criterion average across {len(completed)} completed essay{'s' if len(completed) != 1 else ''}: {averaged[weakest_key]:.1f}.",
        ))

    recurring = next((item for item in weaknesses if item.recurring), weaknesses[0] if weaknesses else None)
    if recurring:
        label = recurring.category.replace("_", " ").title()
        tips.append(GeneralTip(
            title=f"Break the {label} pattern",
            guidance=tip_for_category(recurring.category),
            evidence=f"Detected {recurring.occurrences} time{'s' if recurring.occurrences != 1 else ''} across {recurring.essay_count} essay{'s' if recurring.essay_count != 1 else ''}.",
        ))

    chronological = list(reversed(completed))
    if len(chronological) >= 4:
        midpoint = len(chronological) // 2
        earlier_average = sum(item.evaluation.overall_band for item in chronological[:midpoint]) / midpoint
        later_items = chronological[midpoint:]
        later_average = sum(item.evaluation.overall_band for item in later_items) / len(later_items)
        change = later_average - earlier_average
        if change >= 0.25:
            title = "Protect your upward trend"
            guidance = "Keep the planning and review habits that are working. In the next essays, target one recurring weakness at a time rather than changing your whole approach."
        elif change <= -0.25:
            title = "Stabilise before adding complexity"
            guidance = "Use a repeatable plan and leave time for a focused final review. Aim for consistent control before experimenting with more complex vocabulary or sentence structures."
        else:
            title = "Create a deliberate revision loop"
            guidance = "Choose one recurring pattern before each practice, apply its checklist while writing, and verify it after drafting. Compare that same pattern over the next three essays."
        tips.append(GeneralTip(
            title=title,
            guidance=guidance,
            evidence=f"Your recent-half average is {later_average:.1f}, compared with {earlier_average:.1f} in the earlier half of your record.",
        ))
    elif weaknesses:
        labels = [item.category.replace("_", " ").title() for item in weaknesses[:3]]
        tips.append(GeneralTip(
            title="Use a focused final-review checklist",
            guidance=f"Review one pattern at a time after drafting: {', then '.join(labels)}. A targeted pass is more reliable than rereading generally.",
            evidence=f"Built from the most frequent patterns across all {len(completed)} completed essay{'s' if len(completed) != 1 else ''}.",
        ))

    return tips[:3]


def dashboard_for_user(db: Session, user_id: int) -> DashboardResponse:
    submissions = db.scalars(
        select(EssaySubmission)
        .where(EssaySubmission.user_id == user_id)
        .options(
            selectinload(EssaySubmission.prompt),
            selectinload(EssaySubmission.mistakes),
            selectinload(EssaySubmission.evaluation).selectinload(EssayEvaluation.criteria),
        )
        .order_by(EssaySubmission.submitted_at.desc())
    ).all()
    completed = [s for s in submissions if s.status == "completed" and s.evaluation and s.counts_toward_statistics]
    bands = [s.evaluation.overall_band for s in completed]
    task1 = [s.evaluation.overall_band for s in completed if s.prompt.task_type == "task1"]
    task2 = [s.evaluation.overall_band for s in completed if s.prompt.task_type == "task2"]
    criterion_values: dict[str, list[float]] = defaultdict(list)
    trend: list[TrendPoint] = []
    for submission in reversed(completed):
        scores = {score.criterion: score.band for score in submission.evaluation.criteria}
        task_key = "task_achievement" if submission.prompt.task_type == "task1" else "task_response"
        for key, value in scores.items():
            criterion_values[key].append(value)
        trend.append(TrendPoint(
            id=submission.id,
            date=submission.submitted_at,
            task_type=submission.prompt.task_type,
            overall=submission.evaluation.overall_band,
            task=scores.get(task_key, 0),
            coherence=scores.get("coherence_cohesion", 0),
            lexical=scores.get("lexical_resource", 0),
            grammar=scores.get("grammar", 0),
        ))
    averaged = {key: sum(values) / len(values) for key, values in criterion_values.items() if values}
    strongest = CRITERION_LABELS[max(averaged, key=averaged.get)] if averaged else None
    weakest = CRITERION_LABELS[min(averaged, key=averaged.get)] if averaged else None
    weaknesses = weakness_stats(list(submissions))
    return DashboardResponse(
        completed_essays=len(completed),
        average_band=_average(bands),
        task1_average=_average(task1),
        task2_average=_average(task2),
        strongest_criterion=strongest,
        weakest_criterion=weakest,
        trend=trend,
        weaknesses=weaknesses,
        general_tips=general_tips_for_record(completed, averaged, weaknesses),
        recent_essays=[_list_item(s) for s in completed[:5]],
    )
