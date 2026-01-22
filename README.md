# SIRA (Système Intelligent de Recommandation Académique)

SIRA is a Retrieval-Augmented Generation (RAG) academic advisor that delivers personalized university and career path recommendations. The stack follows the 2026 "Modern Stack": Next.js 16 (App Router), FastAPI, LlamaIndex + Mistral AI, and Pinecone for vector search.

## 🚀 Development Status

**Current Phase**: Phase 3 Complete ✅  
**Next**: Phase 4 - AI Recommendation Engine

### Completed Phases

✅ **Phase 0**: Project Setup & Environment Configuration  
✅ **Phase 1**: Authentication & User Management (Clerk)  
✅ **Phase 2**: Profile Management System (Multi-step wizard)  
✅ **Phase 3**: Knowledge Base & Data Ingestion (RAG infrastructure)

See [docs/PHASE3_SUMMARY.md](docs/PHASE3_SUMMARY.md) for detailed Phase 3 completion report.

## Repository Layout

```
SIRA/
├── frontend/          # Next.js 16 App Router (Clerk, TanStack Form, Zustand, Radix UI)
├── backend/           # FastAPI (Clean architecture, Clerk JWT, SQLAlchemy)
│   ├── alembic/      # Database migrations
│   └── app/
│       ├── api/      # API routes
│       ├── core/     # Config, security, vector DB
│       ├── models/   # SQLAlchemy models
│       ├── schemas/  # Pydantic schemas
│       └── services/ # Business logic
├── scripts/           # Data ingestion & testing utilities
├── data/              # Sample academic program data
├── docs/              # Documentation
└── .planning/         # Development plan & milestones
```

## High-Level Architecture

```
Frontend → Clerk Auth → FastAPI → LlamaIndex (Mistral) → Pinecone → PostgreSQL
```

**Tech Stack**:
- **Frontend**: Next.js 16, React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: FastAPI, Python, SQLAlchemy, PostgreSQL
- **AI/RAG**: LlamaIndex, Mistral AI (embeddings + LLM), Pinecone vector DB
- **Auth**: Clerk (JWT-based)
- **State**: Zustand, TanStack Form
- **DevOps**: Docker, Docker Compose

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for frontend)
- Python 3.11+ (for backend)
- API Keys:
  - [Clerk](https://clerk.com/) (Authentication)
  - [Pinecone](https://www.pinecone.io/) (Vector database)
  - [Mistral AI](https://console.mistral.ai/) (Embeddings & LLM)

### Quick Start

1. **Clone & Configure**:
   ```bash
   git clone https://github.com/yourusername/SIRA.git
   cd SIRA
   cp .env.example .env
   # Edit .env and add your API keys
   ```

2. **Start Services**:
   ```bash
   docker-compose up -d
   ```

3. **Run Phase 3 Setup** (if not already done):
   ```bash
   ./scripts/setup_phase3.sh
   ```

4. **Verify Setup**:
   ```bash
   docker-compose exec backend python /app/../scripts/verify_phase3.py
   ```

5. **Access Applications**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Local Development (Bun + uv)

**Frontend**:
```bash
cd frontend
bun install
bun dev
```

**Backend**:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
uv pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 📊 Phase 3: Knowledge Base

Phase 3 implements the RAG infrastructure with:
- ✅ Pinecone vector database integration
- ✅ Mistral AI embeddings (1024 dimensions)
- ✅ LlamaIndex document processing
- ✅ PostgreSQL document tracking
- ✅ Data ingestion pipeline
- ✅ 10 sample Moroccan university programs

### Ingest Sample Data

```bash
docker-compose exec backend python /app/../scripts/ingest_data.py --sample
```

### Test Semantic Search

```bash
docker-compose exec backend python /app/../scripts/test_search.py
```

See [docs/phase3_knowledge_base.md](docs/phase3_knowledge_base.md) for complete Phase 3 documentation.

## Development Guidelines

- **Server Components**: Use for data fetching; Client Components only for interactivity
- **Type Safety**: TypeScript interfaces must mirror Pydantic schemas
- **Security**: Enforce Clerk JWT on every backend endpoint; never trust user IDs from request body
- **Code Quality**: Small, focused modules; document complex AI logic with docstrings/JSDoc
- **Git**: Feature branches, meaningful commits, PR reviews before merge
