Since all documentation pages are statically prerendered during build, Ver
### 1. Project Overview & Understanding: SIRA
SIRA (Student Intelligent Recommendation Assistant) is an AI-powered
academic advisory platform designed to recommend university courses and
degree pathways based on student transcripts, career interests, and
academic records.
#### Architecture & Stack
• Frontend: Next.js 16.1.3 (Turbopack, React 19, Tailwind CSS, Radix UI)
powered by Bun runtime. Uses Clerk for user authentication and session
management. Pre-renders documentation (/docs/*) from root markdown files
via unified / remark.
• Backend: FastAPI (Python 3.11) with SQLAlchemy ORM, Pydantic v2 schemas,
and dependency injection.
• AI & RAG Engine:
    • Vector DB: Pinecone (hybrid search / index: sira-academic-programs).
    • LLM & Embeddings: Mistral AI (mistral-embed for vector embeddings,
    mistral-large-latest for recommendation generation and conversation
    streaming).
    • Framework: LlamaIndex for RAG orchestration and retrieval.
• Database: PostgreSQL (stores user profiles, academic records,
conversations, chat messages, and program recommendations).
──────
### 2. Local Execution Status (Tested & Verified on Podman)
Your local SIRA stack has been configured, built, and is currently running
and tested on your machine with rootless Podman:
#### Fixes Applied to Codebase:

1. Dockerfile:
    • Replaced Docker BuildKit cache bind mount (--mount=type=bind) with
    standard COPY requirements.txt . to ensure compatibility with rootless
    Podman.
2. Dockerfile:
    • Removed missing bun.lock reference (only package.json was present).
    • Added ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and ENV
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY because Next.js 16 prerenders
    authentication middleware/pages during build time and requires Clerk's
    publishable key.
3. docker-compose.yml:
    • Added SELinux :z volume flags (./backend:/app:z, ./frontend:/app:z)
    to allow rootless Podman container processes to access bind mounts
    under Fedora/RHEL SELinux Enforcing mode.
    • Forwarded NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY to the frontend build
    context.
#### Verified Running Services:

CONTAINER ID  IMAGE                           COMMAND
STATUS                   PORTS                   NAMES
fd4eccf61603  docker.io/library/postgres:17   postgres              Up 5
minutes (healthy)   0.0.0.0:5432->5432/tcp  sira_db
03ac4c5e8ade  localhost/sira_backend:latest  uvicorn app.main:...  Up 5
minutes             0.0.0.0:8000->8000/tcp  sira_backend
c3c6566571e0  localhost/sira_frontend:latest bun run start         Up 5
minutes             0.0.0.0:3000->3000/tcp  sira_frontend
• Backend Docs Endpoint: http://localhost:8000/docs → HTTP/1.1 200 OK
• Frontend App: http://localhost:3000 → HTTP/1.1 200 OK
──────
### 3. Architecture Feasibility: Homelab (Backend + DB) + Vercel (Frontend)
│ Important
│ Yes, this hybrid architecture is not only possible—it is the optimal
│ deployment strategy for your specific homelab hardware.

#### Why This Split is Ideal for Your Homelab:

1. Conserves Constrained RAM (4GB Intel Pentium Server):
    • Next.js SSR + Turbopack builds consume ~500MB–1GB RAM during builds
    and ~200MB–300MB node runtime RAM.
    • Offloading the Next.js frontend to Vercel costs 0 MB of your homelab
    RAM and leverages Vercel's Edge CDN for global asset caching.
    • FastAPI + Uvicorn (configured with 1 worker) is lightweight: only
    ~120MB–180MB RAM.
2. Adheres to Your Homelab Studio Rules:
    • Following Section 9 of your guide, the backend connects directly to
    your existing global-postgres (PostgreSQL 18) on the shared-infra
    network without spinning up an extra database container.
    • Traefik v3 handles routing and TLS termination, exposed securely to
    the internet via Cloudflare Tunnel.

──────
### 4. Step-by-Step Implementation Guide

┌────────────────────────────────────────────────┐
│                Public Internet                 │
│                                        │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │                                    │ │
│ │            User Browser            │ │
│ │                                    │ │
│ └────────────────────────────────────┘ │
│                                        │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │                                    │ │
│ │ Vercel CDN Edge (Next.js Frontend) │ │
│ │                                    │ │
│ │          sira.mousdik.me           │ │
│ │                                    │ │
│ └────────────────────────────────────┘ │
│                                        │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │                                    │ │
│ │      Cloudflare Edge / Tunnel      │ │
│ │                                    │ │
│ └────────────────────────────────────┘ │
│                                        │
└────────────────────────────────────────┘
┌────────────────────────────────────┐
┌─┼────────────────────────────────────┼─┐
│ │    HomelabdServer (homeserver)     │ │
│ │                                    │ │
│ └────────────────────────────────────┘ │
│                                        │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │                                    │ │
│ │      Traefik v3 Reverse Proxy      │ │
│ │                                    │ │
│ └────────────────────────────────────┘ │
│                                        │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │                                    │ │
│ │       sira-backend (FastAPI)       │ │
│ │                                    │ │
│ │        api.sira.mousdik.me         │ │
│ │                                    │ │
│ └────────────────────────────────────┘ │
│                                        │
│                                        │
│ ┌────────────────────────────────────┐ │
        - DATABASE_URL=postgresql+
psycopg2://sira_user:YOUR_STRONG_SIRA_PASSWORD@global-postgres:5432/sira_db
        - ENVIRONMENT=production
    volumes:
        - ./uploads:/app/uploads
    networks:
        - traefik
        - shared-infra
    labels:
        - "traefik.enable=true"
        - "traefik.docker.network=traefik"
        - "traefik.http.routers.sira-api.rule=Host(`api.sira.mousdik.me`)"
        - "traefik.http.routers.sira-api.entrypoints=websecure"
        - "traefik.http.routers.sira-api.tls=true"
        - "traefik.http.services.sira-api.loadbalancer.server.port=8000"
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1

networks:
    traefik:
    external: true
    shared-infra:
    external: true

#### Step 3: Configure Backend .env

In /opt/homelab/apps/sira/.env:

APP_NAME="SIRA API"
ENVIRONMENT=production

# Database
DATABASE_URL=postgresql+
psycopg2://sira_user:YOUR_STRONG_SIRA_PASSWORD@global-postgres:5432/sira_db

# CORS: Add your Vercel URL and custom domain
CORS_ORIGINS=["https://sira.mousdik.me","https://sira.vercel.app",
"http://localhost:3000"]

# Clerk Authentication
CLERK_SECRET_KEY=sk_live_...
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_JWKS_URL=https://api.clerk.com/v1/jwks

# AI APIs
PINECONE_API_KEY=...
PINECONE_INDEX_NAME=sira-academic-programs
MISTRAL_API_KEY=...

#### Step 4: Expose via Cloudflare Tunnel

In your Cloudflare Zero Trust Dashboard (or local cloudflared config):

• Public Hostname: api.sira.mousdik.me (or sira-api.mousdik.me)
• Service: HTTP → traefik:80 (or http://10.0.0.2:80 / internal IP)
• HTTP Settings:
    • Request body limit: Default 100MB is plenty for transcripts.
    • Chunked transfer encoding / HTTP Streaming: Cloudflare supports SSE
    out of the box for the recommendation stream.


#### Step 5: Deploy Frontend to Vercel

1. Push your repository to GitHub.
2. In Vercel, click Add New Project → Select your SIRA repository.
3. Configure Project Settings:
    • Framework Preset: Next.js
    • Root Directory: frontend
    • Build Command: bun run build (or default next build)
    • Install Command: bun install (or npm install)
4. Set Environment Variables in Vercel:
NEXT_PUBLIC_API_BASE_URL=https://api.sira.mousdik.me
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

5. Deploy. Once live, assign your custom domain (e.g., sira.mousdik.me) in
Vercel Project Settings → Domains.
──────
### 5. Important Production Considerations

1. Documentation Build on Vercel:
    • The markdown loader markdown.ts:13-25 reads from ../docs/.
    • In Next.js App Router, all 32 doc pages are statically prerendered
    during build time (✓ Generating static pages (32/32)).
    • Ensure Vercel clones the whole repository so the build step has
    access to ../docs. If Vercel is scoped to frontend/, copy the docs/
    folder into frontend/ or set Root Directory to . and specify --cwd
    frontend.
2. Server-Sent Events (SSE) Streaming:
    • SIRA streams chat recommendations. Cloudflare and Traefik support
    streaming responses seamlessly without timeout issues as long as the
    connection stays active. Ensure your Uvicorn backend runs with --
    workers 1 or --workers 2 to fit well within your 4GB homelab RAM
    ceiling.
