# FinRAG

FinRAG is a production-style financial retrieval-augmented QA system for SEC filings, earnings reports, and investor documents.

It ingests filings, extracts and chunks financial sections, embeds and indexes them in Qdrant, retrieves relevant evidence for a user query, reranks the results, and generates grounded answers with citations.

## Architecture

```text
                          +----------------------+
                          |      Next.js UI      |
                          |  dashboard / ask /   |
                          | documents / upload   |
                          +----------+-----------+
                                     |
                                     | HTTP / JSON
                                     v
                          +----------------------+
                          |     FastAPI API      |
                          | documents / qa /     |
                          | health / reindex     |
                          +----------+-----------+
                                     |
                +--------------------+--------------------+
                |                                         |
                v                                         v
      +----------------------+                 +----------------------+
      | SQLite metadata DB   |                 | Local file storage   |
      | documents, chunks    |                 | uploaded filings     |
      +----------------------+                 +----------------------+
                |                                         |
                +--------------------+--------------------+
                                     |
                                     v
                          +----------------------+
                          | Ingestion pipeline    |
                          | PDF/text extraction   |
                          | section detection     |
                          | chunking + indexing   |
                          +----------+-----------+
                                     |
                         +-----------+------------+
                         |                        |
                         v                        v
              +-------------------+     +----------------------+
              | Embedding provider |     | Reranker provider    |
              | abstraction        |     | abstraction          |
              +-------------------+     +----------------------+
                         |                        |
                         +-----------+------------+
                                     |
                                     v
                          +----------------------+
                          |   Qdrant vector DB   |
                          | chunk vectors +      |
                          | retrieval metadata   |
                          +----------------------+
```

## Tech Stack

- Frontend: Next.js 16, TypeScript, App Router, Tailwind
- Backend: FastAPI, SQLAlchemy, Pydantic Settings
- Local metadata DB: SQLite
- Vector store: Qdrant via `qdrant-client`
- Embeddings: provider abstraction with a local hash provider for local/demo use
- Reranking: provider abstraction with a local overlap reranker
- Containers: Docker + Docker Compose
- CI: GitHub Actions

## What Works

- Real document upload from the UI into the backend
- PDF and text ingestion
- Financial section detection for filings
- Overlapping chunking with metadata
- Background ingestion and indexing
- Embedding generation through a provider abstraction
- Vector indexing in Qdrant
- Query embedding, retrieval, reranking, and grounded QA
- Citation-linked Ask AI UI with source panel highlighting
- Seed demo data for Apple and Tesla

## Repository Layout

```text
.
├── app/                     # Next.js App Router pages
├── components/              # shared UI and product components
├── lib/                     # frontend API/env utilities
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI routers and dependencies
│   │   ├── core/            # config, logging, database, errors
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # request/response models
│   │   └── services/        # ingestion, indexing, retrieval, storage
│   ├── scripts/             # demo data seeding scripts
│   └── tests/               # backend tests
├── demo-data/filings/       # Apple/Tesla demo filings
├── Dockerfile               # frontend image
├── backend/Dockerfile       # backend image
└── docker-compose.yml       # local full-stack orchestration
```

## Environment Setup

### Frontend

Copy the root env file:

```bash
cp .env.example .env.local
```

Important values:

- `NEXT_PUBLIC_APP_URL`: public URL of the frontend
- `NEXT_PUBLIC_API_URL`: browser-visible backend URL
- `API_BASE_URL`: server-side backend URL used by Next.js route rendering

### Backend

Copy the backend env file:

```bash
cd backend
cp .env.example .env
```

Important values:

- `FINRAG_DATABASE_URL`: SQLite or Postgres connection string
- `FINRAG_UPLOAD_DIR`: stored source files
- `FINRAG_QDRANT_LOCAL_PATH`: local Qdrant storage path
- `FINRAG_QDRANT_URL`: remote Qdrant endpoint if using Qdrant Cloud
- `FINRAG_EMBEDDING_PROVIDER`: embedding backend selector
- `FINRAG_RERANK_PROVIDER`: reranker selector

Both frontend and backend validate environment configuration at startup/runtime. Invalid values fail loudly instead of silently degrading.

## Local Setup

### 1. Frontend

```bash
npm install
npm run dev
```

### 2. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 3. Open the app

- Frontend: `http://localhost:3000`
- Backend docs: `http://localhost:8000/docs`

## Docker Setup

Run the full stack with Docker Compose:

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

Compose uses:

- local SQLite under the backend container volume
- local Qdrant storage in the backend volume
- production-style frontend image built from Next.js standalone output

## Seed Demo Data

Once the backend is running, seed Apple and Tesla demo filings:

```bash
cd backend
source .venv/bin/activate
python scripts/seed_demo_data.py
```

This uploads:

- `demo-data/filings/apple-2024-10k.txt`
- `demo-data/filings/tesla-2024-10k.txt`

The documents will ingest, chunk, embed, and index automatically in the background.

## Core API

### Health

```bash
curl http://localhost:8000/health
```

### Upload document

```bash
curl -X POST http://localhost:8000/documents/upload \
  -F "file=@/absolute/path/to/filing.pdf" \
  -F "company=Apple" \
  -F "filing_type=10-K" \
  -F "filing_date=2024-11-01"
```

### List documents

```bash
curl http://localhost:8000/documents
```

### Reindex document

```bash
curl -X POST http://localhost:8000/documents/<document-id>/reindex
```

### Ask QA

```bash
curl -X POST http://localhost:8000/qa/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Why does the filing discuss customer concentration risk?",
    "top_k": 5,
    "company": "Apple"
  }'
```

Response fields:

- `answer`
- `citations`
- `retrieved_chunks`
- `confidence`
- `explanation`

## Product UX

- `/documents`: upload, status tracking, chunk counts
- `/ask`: grounded Ask AI experience with source highlighting
- `/dashboard`: live backend connection state
- `/compare`: comparison shell for later enhancements

## Production-Grade Additions

- Dockerized frontend and backend
- Docker Compose local orchestration
- GitHub Actions CI for frontend and backend
- Backend structured JSON logging
- Frontend route error boundaries
- Route loading skeletons
- Environment validation
- Seed demo data workflow

## CI

GitHub Actions runs:

- frontend `npm ci`
- frontend lint
- frontend build
- backend dependency install
- backend pytest suite
- Docker image builds for both services

CI config lives at [.github/workflows/ci.yml](/Users/owner/work/personal-project/FinRAG/.github/workflows/ci.yml).

## Verification Commands

Frontend:

```bash
npm run lint
npm run build
```

Backend:

```bash
cd backend
source .venv/bin/activate
pytest
```

## Notes

- Local development uses SQLite and embedded local Qdrant storage for simplicity.
- The current embedding provider is intentionally modular; swapping to a hosted embedding model only requires adding another provider implementation and selecting it through config.
- The QA system follows a strict evidence-only rule. If retrieved context is weak, it declines instead of hallucinating.
