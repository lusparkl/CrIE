from sqlalchemy import func, select

from app.models import Prompt
from app.seed import seed_prompts


def test_prompt_library_has_required_seed_counts(client, auth_headers):
    task1 = client.get("/api/prompts?task_type=task1", headers=auth_headers)
    task2 = client.get("/api/prompts?task_type=task2", headers=auth_headers)
    assert task1.status_code == 200
    assert task2.status_code == 200
    assert len(task1.json()) >= 20
    assert len(task2.json()) >= 35
    assert task1.json()[0]["data"] is not None


def test_random_prompt_is_correct_task(client, auth_headers):
    response = client.get("/api/prompts/random?task_type=task1", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["task_type"] == "task1"


def test_prompt_seeding_is_additive_and_idempotent(db_session):
    original_ids = {title: prompt_id for prompt_id, title in db_session.execute(select(Prompt.id, Prompt.title)).all()}
    original_count = db_session.scalar(select(func.count()).select_from(Prompt))

    seed_prompts(db_session)

    assert db_session.scalar(select(func.count()).select_from(Prompt)) == original_count
    assert {title: prompt_id for prompt_id, title in db_session.execute(select(Prompt.id, Prompt.title)).all()} == original_ids
