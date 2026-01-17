# SIRA (Système Intelligent de Recommandation Académique)

SIRA is a Retrieval-Augmented Generation (RAG) academic advisor that delivers personalized university and career path recommendations. The stack follows the 2026 "Modern Stack": Next.js 16 (App Router), FastAPI with SQLModel, LlamaIndex + Mistral, and Pinecone for vector search.

## Repository Layout (work in progress)

- frontend/ — Next.js 16 App Router app (Clerk auth, TanStack Form, Zustand, Radix UI, Chart.js)
- backend/ — FastAPI + SQLModel service (clean architecture, Clerk JWT verification)
- scripts/ — data ingestion utilities for Pinecone
- docs/ — supplementary documentation
- .planning/ — planning artifacts (kept out of builds)

## High-Level Architecture

Frontend → Clerk Auth → FastAPI → LlamaIndex (Mistral) → Pinecone → PostgreSQL

## Getting Started

Phase 0 setup is in progress. Pending steps:

- Add environment variables to `.env.local`/`.env` using `.env.example` (to be provided).
- Install dependencies for both frontend and backend.
- Run `docker-compose up` (compose file forthcoming) for dev stack.

## Development Guidelines

- Use Server Components for data fetching; Client Components only for interactivity.
- Keep API schemas aligned: TypeScript interfaces mirror Pydantic/SQLModel schemas.
- Enforce Clerk JWT on every backend endpoint; never trust user IDs from the body.
- Prefer small, focused modules; document complex AI logic with docstrings/JSDoc.
