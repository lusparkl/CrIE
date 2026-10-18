import json

from app.models import Prompt
from app.services.evaluation_prompts import build_evaluation_messages


def test_evaluator_receives_complete_original_task_context():
    source_data = {
        "steps": [
            {"title": "Collection", "description": "Raw material is collected"},
            {"title": "Treatment", "description": "The material is cleaned"},
        ]
    }
    prompt = Prompt(
        task_type="task1",
        title="Test process",
        instructions="Describe every main stage in the process.",
        category="process",
        topic="environment",
        visualization_type="process",
        data_json=json.dumps(source_data),
    )

    messages = build_evaluation_messages(prompt, "The process starts with collection.")
    context_json = messages[1]["content"].split("\n", 1)[1].split("\n\nCANDIDATE RESPONSE", 1)[0]
    context = json.loads(context_json)

    assert context == {
        "task_type": "task1",
        "title": "Test process",
        "instructions": "Describe every main stage in the process.",
        "category": "process",
        "topic": "environment",
        "visualization_type": "process",
        "source_data": source_data,
    }
    assert "verify every reported figure, comparison, location, and process stage" in messages[0]["content"]
    assert messages[1]["content"].endswith("The process starts with collection.")
