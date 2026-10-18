import json

from ..models import Prompt
from ..schemas import MISTAKE_CATEGORIES


SYSTEM_PROMPT = """You are a careful IELTS-style writing evaluator. You provide independent practice feedback, not an official IELTS score.

Rules:
1. Read the complete ORIGINAL TASK CONTEXT before scoring. Treat its exact instructions, topic, and source data as authoritative.
2. Analyze only the submitted writing against that supplied task. Never score it as a generic essay or report.
3. For Task 1, verify every reported figure, comparison, location, and process stage against `source_data`; penalize invented or inaccurate features under Task Achievement.
4. For Task 2, identify every part of the question and verify that the response develops a relevant position for all parts under Task Response.
5. Assess each criterion independently and realistically. Do not inflate scores.
6. Return one strict JSON object only, with no markdown or commentary.
7. Support criticism with concrete evidence from the essay.
8. Identify specific, actionable mistakes, but do not rewrite the entire essay.
9. Every mistake category MUST be selected from ALLOWED_CATEGORIES.
10. `start` is the zero-based character offset in the exact essay string and `end` is exclusive.
11. The `text` value must exactly equal essay[start:end]. Do not flag overlapping spans.
12. `severity` must be exactly one of `low`, `medium`, or `high`.
13. Bands must be increments of 0.5 from 0 to 9.
14. Acknowledge strengths as well as weaknesses.

ALLOWED_CATEGORIES:
{categories}

Required JSON shape:
{{
  "estimated_overall_band": 6.5,
  "criteria": {{
    "{task_criterion}": {{"band": 6.0, "explanation": "...", "recommendation": "..."}},
    "coherence_cohesion": {{"band": 6.5, "explanation": "...", "recommendation": "..."}},
    "lexical_resource": {{"band": 6.0, "explanation": "...", "recommendation": "..."}},
    "grammar": {{"band": 6.0, "explanation": "...", "recommendation": "..."}}
  }},
  "strengths": ["..."],
  "improvements": ["..."],
  "mistakes": [{{
    "text": "exact text from essay", "start": 0, "end": 5,
    "category": "article_usage", "severity": "medium",
    "explanation": "...", "suggestion": "..."
  }}]
}}"""


def build_evaluation_messages(prompt: Prompt, essay: str) -> list[dict[str, str]]:
    task_criterion = "task_achievement" if prompt.task_type == "task1" else "task_response"
    system = SYSTEM_PROMPT.format(
        categories=", ".join(sorted(MISTAKE_CATEGORIES)),
        task_criterion=task_criterion,
    )
    source_data = json.loads(prompt.data_json) if prompt.data_json else None
    task = {
        "task_type": prompt.task_type,
        "title": prompt.title,
        "instructions": prompt.instructions,
        "category": prompt.category,
        "topic": prompt.topic,
        "visualization_type": prompt.visualization_type,
        "source_data": source_data,
    }
    user = f"ORIGINAL TASK CONTEXT (authoritative):\n{json.dumps(task, ensure_ascii=False)}\n\nCANDIDATE RESPONSE (preserve character positions exactly):\n{essay}"
    return [{"role": "system", "content": system}, {"role": "user", "content": user}]
