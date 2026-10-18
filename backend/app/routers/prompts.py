import json
import random

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models import Prompt, User
from ..schemas import PromptOut


router = APIRouter(prefix="/prompts", tags=["prompts"], dependencies=[Depends(get_current_user)])


def serialize(prompt: Prompt) -> PromptOut:
    return PromptOut(
        id=prompt.id,
        task_type=prompt.task_type,
        title=prompt.title,
        instructions=prompt.instructions,
        category=prompt.category,
        topic=prompt.topic,
        visualization_type=prompt.visualization_type,
        data=json.loads(prompt.data_json) if prompt.data_json else None,
    )


@router.get("", response_model=list[PromptOut])
def list_prompts(task_type: str | None = Query(default=None, pattern="^task[12]$"), db: Session = Depends(get_db)) -> list[PromptOut]:
    query = select(Prompt).order_by(Prompt.task_type, Prompt.topic, Prompt.title)
    if task_type:
        query = query.where(Prompt.task_type == task_type)
    return [serialize(prompt) for prompt in db.scalars(query).all()]


@router.get("/random", response_model=PromptOut)
def random_prompt(task_type: str = Query(pattern="^task[12]$"), db: Session = Depends(get_db)) -> PromptOut:
    prompts = db.scalars(select(Prompt).where(Prompt.task_type == task_type)).all()
    if not prompts:
        raise HTTPException(status_code=404, detail="No prompts are available")
    return serialize(random.choice(prompts))


@router.get("/{prompt_id}", response_model=PromptOut)
def get_prompt(prompt_id: int, db: Session = Depends(get_db)) -> PromptOut:
    prompt = db.get(Prompt, prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return serialize(prompt)

