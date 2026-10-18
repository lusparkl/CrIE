from datetime import datetime, timezone

from sqlalchemy import func, select

from app.models import CriterionScore, DetectedMistake, EssayEvaluation, EssaySubmission


ESSAY = """Technology brings a lot of useful changes to education, but the peoples are often distracted by it.

Firstly, online resources give learners quick access to information. This save time and allows students in remote areas to attend lessons. Teachers can also share a lot of current examples.

However, a lot of screen time may reduce concentration. Printed books remain useful because they do not contain notifications. Schools should therefore use a lot of care when choosing digital materials.

In conclusion, technology should support teachers and books rather than replace them completely. This balanced approach offers access without losing the benefits of focused study."""


def submit(client, headers, prompt_id=1):
    now = datetime.now(timezone.utc).isoformat()
    return client.post("/api/essays", headers=headers, json={"prompt_id": prompt_id, "essay_text": ESSAY, "started_at": now, "submitted_at": now, "duration_seconds": 1200})


def test_essay_creation_and_evaluation_persistence(client, auth_headers, db_session):
    response = submit(client, auth_headers)
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["status"] == "completed"
    assert body["evaluation_mode"] == "demo"
    assert len(body["criteria"]) == 4
    assert body["overall_band"] is not None
    assert any(item["category"] == "singular_plural" for item in body["mistakes"])
    ordered = sorted(body["mistakes"], key=lambda item: (item["start"], item["end"]))
    assert all(current["start"] >= previous["end"] for previous, current in zip(ordered, ordered[1:]))

    submission_id = body["id"]
    assert db_session.scalar(select(func.count()).select_from(EssaySubmission).where(EssaySubmission.id == submission_id)) == 1
    assert db_session.scalar(select(func.count()).select_from(EssayEvaluation).where(EssayEvaluation.submission_id == submission_id)) == 1
    assert db_session.scalar(select(func.count()).select_from(CriterionScore)) == 4
    assert db_session.scalar(select(func.count()).select_from(DetectedMistake)) >= 1

    reopened = client.get(f"/api/essays/{submission_id}", headers=auth_headers)
    assert reopened.status_code == 200
    assert reopened.json()["essay_text"] == ESSAY


def test_recurring_mistake_aggregation(client, auth_headers):
    for prompt_id in (1, 2, 3):
        response = submit(client, auth_headers, prompt_id=prompt_id)
        assert response.status_code == 201, response.text

    dashboard = client.get("/api/dashboard", headers=auth_headers)
    assert dashboard.status_code == 200, dashboard.text
    body = dashboard.json()
    assert body["completed_essays"] == 3
    weakness = next(item for item in body["weaknesses"] if item["category"] == "singular_plural")
    assert weakness["essay_count"] == 3
    assert weakness["recurring"] is True
    assert weakness["recent_percentage"] == 100
    assert body["general_tips"]
    assert "3 completed essays" in body["general_tips"][0]["evidence"]

    detail = client.get("/api/dashboard/weaknesses/singular_plural", headers=auth_headers)
    assert detail.status_code == 200, detail.text
    detail_body = detail.json()
    assert detail_body["occurrences"] == 3
    assert detail_body["essay_count"] == 3
    assert len(detail_body["examples"]) == 3
    assert detail_body["examples"][0]["submission_id"]
    assert detail_body["examples"][0]["explanation"]
    assert detail_body["examples"][0]["suggestion"]
    assert detail_body["tip"]


def test_repeat_prompt_is_saved_as_revision_and_excluded_from_statistics(client, auth_headers, db_session):
    official = submit(client, auth_headers, prompt_id=1)
    assert official.status_code == 201, official.text
    official_body = official.json()
    assert official_body["is_revision"] is False
    assert official_body["revision_of_id"] is None

    revision = submit(client, auth_headers, prompt_id=1)
    assert revision.status_code == 201, revision.text
    revision_body = revision.json()
    assert revision_body["is_revision"] is True
    assert revision_body["revision_of_id"] == official_body["id"]

    dashboard = client.get("/api/dashboard", headers=auth_headers)
    assert dashboard.status_code == 200, dashboard.text
    assert dashboard.json()["completed_essays"] == 1
    assert [item["id"] for item in dashboard.json()["recent_essays"]] == [official_body["id"]]

    history = client.get("/api/essays", headers=auth_headers)
    assert history.status_code == 200, history.text
    assert len(history.json()) == 2

    official_lookup = client.get("/api/essays/official?prompt_id=1", headers=auth_headers)
    assert official_lookup.status_code == 200, official_lookup.text
    assert official_lookup.json()["id"] == official_body["id"]

    stored_revision = db_session.get(EssaySubmission, revision_body["id"])
    assert stored_revision is not None
    assert stored_revision.counts_toward_statistics is False
