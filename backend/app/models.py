from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint, true
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    submissions: Mapped[list[EssaySubmission]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Prompt(Base):
    __tablename__ = "prompts"

    id: Mapped[int] = mapped_column(primary_key=True)
    task_type: Mapped[str] = mapped_column(String(10), index=True)
    title: Mapped[str] = mapped_column(String(180))
    instructions: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(60))
    topic: Mapped[str] = mapped_column(String(60), index=True)
    visualization_type: Mapped[str | None] = mapped_column(String(30), nullable=True)
    data_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    submissions: Mapped[list[EssaySubmission]] = relationship(back_populates="prompt")


class EssaySubmission(Base):
    __tablename__ = "essay_submissions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    prompt_id: Mapped[int] = mapped_column(ForeignKey("prompts.id"), index=True)
    essay_text: Mapped[str] = mapped_column(Text)
    word_count: Mapped[int] = mapped_column(Integer)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)
    duration_seconds: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    evaluation_mode: Mapped[str | None] = mapped_column(String(20), nullable=True)
    evaluation_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    counts_toward_statistics: Mapped[bool] = mapped_column(Boolean, default=True, server_default=true())
    revision_of_id: Mapped[int | None] = mapped_column(ForeignKey("essay_submissions.id"), nullable=True)

    user: Mapped[User] = relationship(back_populates="submissions")
    prompt: Mapped[Prompt] = relationship(back_populates="submissions")
    evaluation: Mapped[EssayEvaluation | None] = relationship(back_populates="submission", cascade="all, delete-orphan", uselist=False)
    mistakes: Mapped[list[DetectedMistake]] = relationship(back_populates="submission", cascade="all, delete-orphan")


class EssayEvaluation(Base):
    __tablename__ = "essay_evaluations"

    id: Mapped[int] = mapped_column(primary_key=True)
    submission_id: Mapped[int] = mapped_column(ForeignKey("essay_submissions.id"), unique=True)
    overall_band: Mapped[float] = mapped_column(Float)
    strengths_json: Mapped[str] = mapped_column(Text, default="[]")
    improvements_json: Mapped[str] = mapped_column(Text, default="[]")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    submission: Mapped[EssaySubmission] = relationship(back_populates="evaluation")
    criteria: Mapped[list[CriterionScore]] = relationship(back_populates="evaluation", cascade="all, delete-orphan")


class CriterionScore(Base):
    __tablename__ = "criterion_scores"
    __table_args__ = (UniqueConstraint("evaluation_id", "criterion", name="uq_evaluation_criterion"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    evaluation_id: Mapped[int] = mapped_column(ForeignKey("essay_evaluations.id"), index=True)
    criterion: Mapped[str] = mapped_column(String(50))
    band: Mapped[float] = mapped_column(Float)
    explanation: Mapped[str] = mapped_column(Text)
    recommendation: Mapped[str] = mapped_column(Text)

    evaluation: Mapped[EssayEvaluation] = relationship(back_populates="criteria")


class DetectedMistake(Base):
    __tablename__ = "detected_mistakes"

    id: Mapped[int] = mapped_column(primary_key=True)
    submission_id: Mapped[int] = mapped_column(ForeignKey("essay_submissions.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    category: Mapped[str] = mapped_column(String(60), index=True)
    text: Mapped[str] = mapped_column(Text)
    start: Mapped[int] = mapped_column(Integer)
    end: Mapped[int] = mapped_column(Integer)
    severity: Mapped[str] = mapped_column(String(20))
    explanation: Mapped[str] = mapped_column(Text)
    suggestion: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)

    submission: Mapped[EssaySubmission] = relationship(back_populates="mistakes")
