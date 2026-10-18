from collections.abc import Generator
from pathlib import Path

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import get_settings


settings = get_settings()
if settings.database_url.startswith("sqlite:///./"):
    relative = settings.database_url.removeprefix("sqlite:///./")
    Path(relative).parent.mkdir(parents=True, exist_ok=True)

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def ensure_revision_columns() -> None:
    """Add revision metadata to existing databases without replacing stored essays."""
    columns = {column["name"] for column in inspect(engine).get_columns("essay_submissions")}
    added_revision_support = False
    with engine.begin() as connection:
        if "counts_toward_statistics" not in columns:
            default = "1" if engine.dialect.name == "sqlite" else "TRUE"
            connection.execute(text(f"ALTER TABLE essay_submissions ADD COLUMN counts_toward_statistics BOOLEAN NOT NULL DEFAULT {default}"))
            added_revision_support = True
        if "revision_of_id" not in columns:
            connection.execute(text("ALTER TABLE essay_submissions ADD COLUMN revision_of_id INTEGER REFERENCES essay_submissions(id)"))
            added_revision_support = True

        if added_revision_support:
            rows = connection.execute(text("""
                SELECT id, user_id, prompt_id
                FROM essay_submissions
                WHERE status = 'completed'
                ORDER BY user_id, prompt_id, submitted_at, id
            """)).mappings()
            official_by_prompt: dict[tuple[int, int], int] = {}
            for row in rows:
                key = (row["user_id"], row["prompt_id"])
                official_id = official_by_prompt.setdefault(key, row["id"])
                if row["id"] != official_id:
                    connection.execute(
                        text("UPDATE essay_submissions SET counts_toward_statistics = :counts, revision_of_id = :official_id WHERE id = :id"),
                        {"counts": False, "official_id": official_id, "id": row["id"]},
                    )


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
