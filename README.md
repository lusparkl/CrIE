# CrIE — Cracking IELTS Essays

CrIE (Cracking IELTS Essays) is a complete IELTS-style Writing practice MVP. Learners can write timed Academic Task 1 reports and Task 2 essays, receive criterion-by-criterion estimated feedback, inspect problems highlighted in their original response, and—most importantly—see which mistake categories recur across multiple essays.

> CrIE is an independent practice tool. It is not affiliated with or endorsed by IELTS, the British Council, IDP, or Cambridge University Press & Assessment. Every band displayed by the product is an estimate, not an official IELTS score.

## What works

- JWT registration, login, logout, and user-scoped data
- 35 original Task 2 questions across five common question types and recently reported topic families
- 20 original Academic Task 1 prompts with line, bar, table, pie, detailed process, and comparative map visuals
- Exam-style 20/40 minute writing workspace, local draft recovery, and live word counts
- A validated, structured evaluator with four independent criteria and the complete original task context, including Task 1 source data
- Inline, clickable feedback mapped to a fixed 26-category mistake taxonomy
- Persistent essays, criterion scores, and detected mistakes
- Recurring weakness detection based on appearances in 3 or more distinct essays
- Actual user-data charts, recent history, Task 1/Task 2 averages, and trend labels
- Deterministic demo evaluation when no AI key is configured
- Seeded demo profile with historical submissions

## Screenshots

Add product screenshots here after deploying the app:

- `docs/screenshots/dashboard.png`
- `docs/screenshots/writing-workspace.png`
- `docs/screenshots/feedback.png`

## Architecture

```text
Browser (Next.js + TypeScript + Tailwind + Recharts)
                      │ JSON / JWT
                      ▼
FastAPI routers ── authentication / prompts / essays / dashboard
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
SQLAlchemy + SQLite       EvaluationService interface
                                      │
                           ┌──────────┴──────────┐
                           ▼                     ▼
                  deterministic demo     OpenAI-compatible API
```

The backend stores `User`, `Prompt`, `EssaySubmission`, `EssayEvaluation`, `CriterionScore`, and `DetectedMistake` records. Database access is ordinary SQLAlchemy 2.x, and the database is selected by `DATABASE_URL`, so replacing SQLite with PostgreSQL does not change the domain or route layers.

AI instructions live in `backend/app/services/evaluation_prompts.py`; provider access lives in `backend/app/services/ai.py`. Both the real and demo evaluators return the same Pydantic-validated schema. Task 1 source data is included in the evaluation context.

## Requirements

- Node.js 20 or newer
- Python 3.11 or newer
- npm

## First-time setup

From the repository root:

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env.local

python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt

cd frontend
npm install
```

Change `JWT_SECRET` in `.env` for any shared or deployed environment. No secret should be placed in `frontend/.env.local`.

## Run locally

Use two terminals from the repository root.

Backend:

```bash
source .venv/bin/activate
cd backend
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). API documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs).

## Database initialization and seed data

On backend startup, SQLAlchemy creates missing tables and idempotently inserts the prompt library and demo profile. No separate command is needed for local initialization. The default database is `backend/data/essaytrace.db` when the server is launched from `backend`.

Demo credentials:

```text
Email:    demo@crie.app
Password: Demo123!
```

The demo user is marked with `is_demo=true` and kept distinct from registered users. It contains four historical essays. New demo-account submissions are still real persisted records in the local database.

To reset local data, stop the backend and remove only `backend/data/essaytrace.db`; it is recreated on the next startup. Do not do this if you need the local writing history.

## AI evaluation

The app starts in clearly labelled demo evaluation mode when `OPENAI_API_KEY` is empty. Demo mode is deterministic, finds a useful subset of concrete writing issues, calculates all four criterion estimates, and persists exactly the same records as the remote evaluator. It exists for local product testing, not as a substitute for a full language model.

To enable an OpenAI-compatible provider, set:

```dotenv
OPENAI_API_KEY=your-key
OPENAI_MODEL=gpt-4.1-mini
# Optional for a compatible third-party endpoint:
OPENAI_BASE_URL=https://provider.example/v1
```

Restart the backend. The evaluator requests strict JSON and Pydantic rejects unknown mistake categories, invalid band ranges, missing criteria, and incorrect character offsets. If analysis fails, the submission remains saved with a failed status and a safe user-facing message.

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `sqlite:///./data/essaytrace.db` | SQLAlchemy connection URL |
| `JWT_SECRET` | local-only fallback | JWT signing secret; change outside local use |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` | Token lifetime (7 days) |
| `OPENAI_API_KEY` | empty | Enables remote AI evaluation |
| `OPENAI_MODEL` | `gpt-4.1-mini` | Compatible model identifier |
| `OPENAI_BASE_URL` | empty | Optional compatible API base URL |
| `FRONTEND_ORIGIN` | `http://localhost:3000` | Allowed browser origin |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api` | Browser-visible API URL |

## Verification

Backend tests cover registration/login, seeded prompt retrieval, essay creation, evaluation persistence, and recurring mistake aggregation:

```bash
source .venv/bin/activate
cd backend
pytest
```

Frontend checks:

```bash
cd frontend
npm run typecheck
npm run build
```

For a manual product check, follow this flow:

```text
Register → Dashboard → Practice → choose Task 1 or Task 2
→ write and submit → inspect highlighted feedback
→ reopen from History → confirm Dashboard updates
```

Submitting the same concrete error in three separate essays promotes that category to a recurring weakness. The threshold is configured by `recurring_essay_threshold` in `backend/app/config.py`.

## Production notes

The MVP intentionally avoids OAuth, background job infrastructure, subscriptions, and microservices. Before a public deployment, add a migration tool such as Alembic, run evaluation through a job queue, rotate the JWT secret, use PostgreSQL, and apply provider-appropriate rate limits and observability.
