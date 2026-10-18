from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


MISTAKE_CATEGORIES = {
    "article_usage", "subject_verb_agreement", "verb_tense", "preposition",
    "sentence_fragment", "run_on_sentence", "punctuation", "singular_plural", "word_order",
    "repetitive_vocabulary", "incorrect_word_choice", "informal_language", "collocation",
    "spelling", "limited_vocabulary", "weak_paragraph_structure", "unclear_reference",
    "poor_linking", "excessive_linking_words", "weak_topic_sentence", "incomplete_task_response",
    "weak_idea_development", "irrelevant_information", "weak_example", "missing_overview",
    "inaccurate_data_description",
}


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    is_demo: bool
    model_config = ConfigDict(from_attributes=True)


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class PromptOut(BaseModel):
    id: int
    task_type: str
    title: str
    instructions: str
    category: str
    topic: str
    visualization_type: str | None
    data: Any | None = None


class EssayCreate(BaseModel):
    prompt_id: int
    essay_text: str = Field(min_length=1, max_length=30000)
    started_at: datetime
    submitted_at: datetime | None = None
    duration_seconds: int = Field(ge=0, le=24 * 60 * 60)


class AIMistake(BaseModel):
    text: str
    start: int = Field(ge=0)
    end: int = Field(ge=0)
    category: str
    severity: Literal["low", "medium", "high"]
    explanation: str
    suggestion: str

    @field_validator("category")
    @classmethod
    def known_category(cls, value: str) -> str:
        if value not in MISTAKE_CATEGORIES:
            raise ValueError(f"Unknown mistake category: {value}")
        return value

    @model_validator(mode="after")
    def valid_range(self):
        if self.end <= self.start:
            raise ValueError("Mistake end must be after start")
        return self


class AICriterion(BaseModel):
    band: float = Field(ge=0, le=9)
    explanation: str
    recommendation: str


class AIEvaluation(BaseModel):
    estimated_overall_band: float = Field(ge=0, le=9)
    criteria: dict[str, AICriterion]
    strengths: list[str]
    improvements: list[str]
    mistakes: list[AIMistake]


class CriterionOut(BaseModel):
    criterion: str
    band: float
    explanation: str
    recommendation: str


class MistakeOut(AIMistake):
    id: int


class EssayListItem(BaseModel):
    id: int
    prompt_id: int
    submitted_at: datetime
    task_type: str
    topic: str
    title: str
    overall_band: float | None
    word_count: int
    duration_seconds: int
    status: str
    is_revision: bool
    revision_of_id: int | None


class EssayDetail(EssayListItem):
    prompt: PromptOut
    essay_text: str
    started_at: datetime
    evaluation_mode: str | None
    evaluation_error: str | None
    criteria: list[CriterionOut] = []
    strengths: list[str] = []
    improvements: list[str] = []
    mistakes: list[MistakeOut] = []


class TrendPoint(BaseModel):
    id: int
    date: datetime
    task_type: str
    overall: float
    task: float
    coherence: float
    lexical: float
    grammar: float


class RecurringWeakness(BaseModel):
    category: str
    occurrences: int
    essay_count: int
    recent_essay_total: int
    recent_percentage: float
    trend: Literal["improving", "stable", "needs attention"]
    recurring: bool


class WeaknessExample(BaseModel):
    id: int
    submission_id: int
    submitted_at: datetime
    task_type: str
    topic: str
    title: str
    text: str
    context_before: str
    context_after: str
    severity: Literal["low", "medium", "high"]
    explanation: str
    suggestion: str


class WeaknessDetail(BaseModel):
    category: str
    occurrences: int
    essay_count: int
    tip: str
    examples: list[WeaknessExample]


class GeneralTip(BaseModel):
    title: str
    guidance: str
    evidence: str


class DashboardResponse(BaseModel):
    completed_essays: int
    average_band: float | None
    task1_average: float | None
    task2_average: float | None
    strongest_criterion: str | None
    weakest_criterion: str | None
    trend: list[TrendPoint]
    weaknesses: list[RecurringWeakness]
    general_tips: list[GeneralTip]
    recent_essays: list[EssayListItem]
