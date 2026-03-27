# FinRAG

FinRAG is a portfolio-grade financial retrieval-augmented QA system for SEC filings, earnings reports, and investor documents.

This repository is being built in phases. Phase 2 establishes a production-ready FastAPI backend with document persistence, local file storage, structured logging, tests, and a live frontend connection for backend health and document inventory.

## Stack Through Phase 2

- Next.js 16
- TypeScript
- App Router
- Tailwind CSS
- shadcn-style component primitives
- FastAPI
- SQLAlchemy
- SQLite for local development

## Getting Started

1. Install frontend dependencies:

```bash
npm install
```

2. Install backend dependencies:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

3. Start the backend:

```bash
cd backend
cp .env.example .env
uvicorn app.main:app --reload
```

4. Start the frontend:

```bash
npm run dev
```

5. Open `http://localhost:3000`

## Available Routes

- `/` landing page
- `/dashboard` product overview shell
- `/documents` document library shell
- `/ingestion` ingestion control plane shell
- `/ask` retrieval and answer experience shell
- `/compare` period comparison shell

## Backend API

- `GET /health`
- `POST /documents/upload`
- `GET /documents`
- `GET /documents/{id}`
- `DELETE /documents/{id}`

Sample upload request:

```bash
curl -X POST http://localhost:8000/documents/upload \
  -F "file=@/absolute/path/to/nvidia-10k.txt" \
  -F "company=NVIDIA" \
  -F "filing_type=10-K" \
  -F "filing_date=2025-02-21"
```

The frontend connects to the backend via `NEXT_PUBLIC_API_URL`, which defaults to `http://localhost:8000` in the root [.env.example](/Users/owner/work/personal-project/FinRAG/.env.example).

## Notes

- Documents are persisted in SQLite during local development.
- Uploaded files are stored locally under `backend/data/uploads` through an abstract storage interface.
- The dashboard and document library now connect to the live backend when it is running.
- Auth, ingestion, embeddings, Qdrant indexing, and grounded answer generation arrive in later phases.
