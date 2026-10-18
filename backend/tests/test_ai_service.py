import json

from app.schemas import AIMistake
from app.services.ai import parse_evaluation_response, repair_mistake_ranges


def mistake(text: str, start: int, end: int, category: str = "incorrect_word_choice") -> AIMistake:
    return AIMistake(
        text=text,
        start=start,
        end=end,
        category=category,
        severity="medium",
        explanation="Explanation",
        suggestion="Suggestion",
    )


def test_repair_mistake_ranges_keeps_exact_ranges():
    essay = "This sentence has an error."
    result = repair_mistake_ranges(essay, [mistake("an error", 18, 26)])

    assert [(item.text, item.start, item.end) for item in result] == [("an error", 18, 26)]


def test_repair_mistake_ranges_relocates_bad_offsets_to_nearest_match():
    essay = "This phrase is fine. Later, this phrase is not."
    result = repair_mistake_ranges(essay, [mistake("this phrase", 30, 41)])

    assert [(item.text, item.start, item.end) for item in result] == [("this phrase", 28, 39)]


def test_repair_mistake_ranges_handles_whitespace_and_case_differences():
    essay = "The sentence has\nuneven spacing."
    result = repair_mistake_ranges(essay, [mistake("the sentence has uneven spacing", 90, 120)])

    assert [(item.text, item.start, item.end) for item in result] == [
        ("The sentence has\nuneven spacing", 0, 31)
    ]


def test_repair_mistake_ranges_drops_only_unresolvable_or_overlapping_items():
    essay = "A repeated phrase appears once."
    result = repair_mistake_ranges(
        essay,
        [
            mistake("repeated phrase", 2, 17),
            mistake("repeated phrase", 200, 215, "repetitive_vocabulary"),
            mistake("words not in the essay", 50, 72),
        ],
    )

    assert [(item.text, item.start, item.end) for item in result] == [("repeated phrase", 2, 17)]


def test_parse_evaluation_response_normalizes_and_isolates_bad_annotations():
    payload = {
        "estimated_overall_band": 6.5,
        "criteria": {
            "task_response": {"band": 6.5, "explanation": "Clear position", "recommendation": "Add evidence"},
            "coherence_cohesion": {"band": 6.5, "explanation": "Logical", "recommendation": "Improve links"},
            "lexical_resource": {"band": 6.0, "explanation": "Adequate", "recommendation": "Use precise words"},
            "grammar": {"band": 6.0, "explanation": "Some range", "recommendation": "Check agreement"},
        },
        "strengths": ["Relevant response"],
        "improvements": ["Develop examples"],
        "mistakes": [
            {
                "text": "a error",
                "start": 0,
                "end": 7,
                "category": "article-usage",
                "severity": "minor",
                "explanation": "Use an before a vowel sound",
                "suggestion": "an error",
            },
            {
                "text": "bad annotation",
                "start": 10,
                "end": 24,
                "category": "invented_category",
                "severity": "medium",
                "explanation": "Invalid category",
                "suggestion": "Replacement",
            },
        ],
    }

    result = parse_evaluation_response(json.dumps(payload))

    assert len(result.mistakes) == 1
    assert result.mistakes[0].category == "article_usage"
    assert result.mistakes[0].severity == "low"
