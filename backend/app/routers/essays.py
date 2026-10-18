import json
import re
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..dependencies import get_current_user
from ..models import CriterionScore, DetectedMistake, EssayEvaluation, EssaySubmission, Prompt, User
from ..schemas import CriterionOut, EssayCreate, EssayDetail, EssayListItem, MistakeOut
from ..services.ai import get_evaluation_service
from .prompts import serialize as serialize_prompt


router = APIRouter(prefix="/essays", tags=["essays"])


def load_submission(db: Session, submission_id: int, user_id: int) -> EssaySubmission | None:
    return db.scalar(
        select(EssaySubmission)
        .where(EssaySubmission.id == submission_id, EssaySubmission.user_id == user_id)
        .options(
            selectinload(EssaySubmission.prompt),
            selectinload(EssaySubmission.mistakes),
            selectinload(EssaySubmission.evaluation).selectinload(EssayEvaluation.criteria),
        )
    )


def to_list_item(item: EssaySubmission) -> EssayListItem:
    return EssayListItem(
        id=item.id,
        prompt_id=item.prompt_id,
        submitted_at=item.submitted_at,
        task_type=item.prompt.task_type,
        topic=item.prompt.topic,
        title=item.prompt.title,
        overall_band=item.evaluation.overall_band if item.evaluation else None,
        word_count=item.word_count,
        duration_seconds=item.duration_seconds,
        status=item.status,
        is_revision=not item.counts_toward_statistics,
        revision_of_id=item.revision_of_id,
    )


def to_detail(item: EssaySubmission) -> EssayDetail:
    evaluation = item.evaluation
    return EssayDetail(
        **to_list_item(item).model_dump(),
        prompt=serialize_prompt(item.prompt),
        essay_text=item.essay_text,
        started_at=item.started_at,
        evaluation_mode=item.evaluation_mode,
        evaluation_error=item.evaluation_error,
        criteria=[CriterionOut(criterion=c.criterion, band=c.band, explanation=c.explanation, recommendation=c.recommendation) for c in (evaluation.criteria if evaluation else [])],
        strengths=json.loads(evaluation.strengths_json) if evaluation else [],
        improvements=json.loads(evaluation.improvements_json) if evaluation else [],
        mistakes=[MistakeOut(id=m.id, text=m.text, start=m.start, end=m.end, category=m.category, severity=m.severity, explanation=m.explanation, suggestion=m.suggestion) for m in item.mistakes],
    )


@router.post("", response_model=EssayDetail, status_code=status.HTTP_201_CREATED)
async def create_essay(payload: EssayCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> EssayDetail:
    prompt = db.get(Prompt, payload.prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    official = db.scalar(
        select(EssaySubmission)
        .where(
            EssaySubmission.user_id == user.id,
            EssaySubmission.prompt_id == prompt.id,
            EssaySubmission.status == "completed",
            EssaySubmission.counts_toward_statistics.is_(True),
        )
        .order_by(EssaySubmission.submitted_at, EssaySubmission.id)
    )
    submitted_at = payload.submitted_at or datetime.now(timezone.utc)
    submission = EssaySubmission(
        user_id=user.id,
        prompt_id=prompt.id,
        essay_text=payload.essay_text,
        word_count=len(re.findall(r"\b[\w’'-]+\b", payload.essay_text)),
        started_at=payload.started_at,
        submitted_at=submitted_at,
        duration_seconds=payload.duration_seconds,
        status="pending",
        counts_toward_statistics=official is None,
        revision_of_id=official.id if official else None,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    service = get_evaluation_service()
    try:
        result = await service.evaluate(prompt, payload.essay_text)
        evaluation = EssayEvaluation(
            submission_id=submission.id,
            overall_band=result.estimated_overall_band,
            strengths_json=json.dumps(result.strengths),
            improvements_json=json.dumps(result.improvements),
        )
        db.add(evaluation)
        db.flush()
        for criterion, score in result.criteria.items():
            db.add(CriterionScore(evaluation_id=evaluation.id, criterion=criterion, band=score.band, explanation=score.explanation, recommendation=score.recommendation))
        for mistake in result.mistakes:
            db.add(DetectedMistake(submission_id=submission.id, user_id=user.id, **mistake.model_dump()))
        submission.status = "completed"
        submission.evaluation_mode = service.mode
        db.commit()
    except Exception as exc:
        db.rollback()
        failed = db.get(EssaySubmission, submission.id)
        if failed:
            failed.status = "failed"
            failed.evaluation_mode = service.mode
            failed.evaluation_error = "Analysis could not be completed. Your essay is saved; please try again later."
            db.commit()
        raise HTTPException(status_code=502, detail="Your essay was saved, but analysis could not be completed") from exc
    loaded = load_submission(db, submission.id, user.id)
    return to_detail(loaded)


@router.get("", response_model=list[EssayListItem])
def list_essays(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[EssayListItem]:
    items = db.scalars(
        select(EssaySubmission)
        .where(EssaySubmission.user_id == user.id)
        .options(selectinload(EssaySubmission.prompt), selectinload(EssaySubmission.evaluation))
        .order_by(EssaySubmission.submitted_at.desc())
    ).all()
    return [to_list_item(item) for item in items]


@router.get("/officials", response_model=list[EssayListItem])
def list_official_essays(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[EssayListItem]:
    items = db.scalars(
        select(EssaySubmission)
        .where(
            EssaySubmission.user_id == user.id,
            EssaySubmission.status == "completed",
            EssaySubmission.counts_toward_statistics.is_(True),
        )
        .options(selectinload(EssaySubmission.prompt), selectinload(EssaySubmission.evaluation))
        .order_by(EssaySubmission.submitted_at.desc())
    ).all()
    return [to_list_item(item) for item in items]


@router.get("/official", response_model=EssayDetail)
def get_official_essay(prompt_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> EssayDetail:
    item = db.scalar(
        select(EssaySubmission)
        .where(
            EssaySubmission.user_id == user.id,
            EssaySubmission.prompt_id == prompt_id,
            EssaySubmission.status == "completed",
            EssaySubmission.counts_toward_statistics.is_(True),
        )
        .options(
            selectinload(EssaySubmission.prompt),
            selectinload(EssaySubmission.mistakes),
            selectinload(EssaySubmission.evaluation).selectinload(EssayEvaluation.criteria),
        )
        .order_by(EssaySubmission.submitted_at, EssaySubmission.id)
    )
    if not item:
        raise HTTPException(status_code=404, detail="No official attempt exists for this prompt")
    return to_detail(item)


@router.get("/{submission_id}", response_model=EssayDetail)
def get_essay(submission_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> EssayDetail:
    item = load_submission(db, submission_id, user.id)
    if not item:
        raise HTTPException(status_code=404, detail="Essay not found")
    return to_detail(item)
