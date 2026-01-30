# SIRA Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Next.js 16 Frontend (React + TypeScript)          │   │
│  │  - Server Components (Data Fetching)                      │   │
│  │  - Client Components (Interactivity - Radix UI)           │   │
│  │  - TanStack Form (Multi-step Profile Wizard)              │   │
│  │  - Zustand (Global State Management)                      │   │
│  │  - Chart.js (Visualization)                               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │  Clerk Auth       │
                    │  (JWT Verification)
                    └─────────┬─────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                     API GATEWAY / PROXY                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Next.js Middleware (proxy.ts)                            │   │
│  │  - Route forwarding                                       │   │
│  │  - Request/Response transformation                        │   │
│  │  - CORS handling                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND API LAYER                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              FastAPI (Python)                             │   │
│  │                                                           │   │
│  │  Controllers (API Routes)                                │   │
│  │  ├─ /auth - User authentication                          │   │
│  │  ├─ /profiles - Profile management                       │   │
│  │  ├─ /recommendations - AI recommendations                │   │
│  │  ├─ /admin - Administrative endpoints                    │   │
│  │  └─ /health - Health checks                              │   │
│  │                                                           │   │
│  │  Middleware                                              │   │
│  │  ├─ JWT verification                                     │   │
│  │  ├─ Rate limiting                                        │   │
│  │  ├─ Logging & monitoring                                 │   │
│  │  └─ Error handling                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                    │             │             │
        ┌───────────┴─────┬───────┴────┐    ┌──┴──────────┐
        │                 │            │    │             │
┌───────▼──────┐  ┌──────▼─────┐  ┌──▼───▼──┐  ┌────────▼────────┐
│   DATABASE   │  │   CACHE    │  │ AI/ML   │  │  EXTERNAL APIs  │
│              │  │            │  │ LAYER   │  │                 │
│ PostgreSQL   │  │   Redis    │  │         │  │ - Mistral AI    │
│ + JSONB      │  │ (Optional) │  │ LlamaIdx│  │ - Pinecone      │
│              │  │            │  │ + RAG   │  │ - Clerk Auth    │
└──────────────┘  └────────────┘  └─────────┘  └─────────────────┘
```

## Component Architecture

### Frontend Architecture

```
Next.js 16 App Router
├── (auth)
│   ├── sign-in/
│   ├── sign-up/
│   └── callback/
├── dashboard/
│   ├── profiles/
│   │   ├── [id]/edit
│   │   └── new
│   ├── recommendations/
│   │   ├── [id]
│   │   └── history
│   └── layout.tsx
├── admin/
│   ├── dashboard
│   ├── profiles
│   ├── recommendations
│   └── sessions
├── layout.tsx
├── page.tsx
└── error.tsx

Components
├── ui/ (Shadcn/Radix)
├── profile/ (Profile form steps)
├── recommendation/ (Recommendation display)
├── admin/ (Admin components)
└── common/ (Shared components)

Hooks
├── use-conversation-stream (SSE)
├── use-recommendation-stream (SSE)
└── use-mobile

Stores (Zustand)
├── profile-wizard-store (Form state)
└── auth-store (Auth state)

Services
├── profile-api.ts
├── recommendation-api.ts
└── admin-api.ts
```

### Backend Architecture

```
FastAPI Application
├── api/
│   ├── routes/
│   │   ├── auth.py
│   │   ├── profiles.py
│   │   ├── recommendations.py
│   │   ├── admin.py
│   │   ├── upload.py
│   │   └── health.py
│   └── deps.py (Dependency injection)
├── core/
│   ├── config.py
│   ├── security.py
│   └── constants.py
├── models/ (SQLAlchemy ORM)
│   ├── user.py
│   ├── profile.py
│   ├── recommendation.py
│   └── document.py
├── schemas/ (Pydantic)
│   ├── user.py
│   ├── profile.py
│   └── recommendation.py
├── services/
│   ├── profile_service.py
│   ├── recommendation_service.py
│   ├── llm_service.py
│   ├── rag_service.py
│   ├── feedback_service.py
│   └── logging_service.py
├── repositories/
│   ├── user_repo.py
│   ├── profile_repo.py
│   └── recommendation_repo.py
├── utils/
│   ├── validation.py
│   ├── sanitization.py
│   └── monitoring.py
├── middleware/
│   ├── logging_middleware.py
│   ├── rate_limiting.py
│   └── error_handler.py
├── db.py (Database connection)
└── main.py (Application entry point)
```

## Data Flow Diagrams

### Profile Creation Flow

```
User Input (Frontend)
    ↓
Multi-step Form (TanStack Form)
    ↓
Zustand Store Update (Draft Save)
    ↓
Validation (Zod + Backend)
    ↓
POST /api/profiles (FastAPI)
    ↓
Authentication Middleware (JWT)
    ↓
ProfileService (Validation + Save)
    ↓
SQLAlchemy ORM (PostgreSQL)
    ↓
Response (Profile ID + Status)
    ↓
UI Update (React State)
```

### Recommendation Generation Flow

```
User Requests Recommendation
    ↓
GET /api/recommendations/generate (StreamingResponse)
    ↓
RecommendationService
    ├─ Load Profile from DB
    ├─ Extract Keywords (Field, GPA, Interests, Budget)
    └─ Generate Query String
    ↓
RAG Service
    ├─ Generate Query Embedding (Mistral)
    ├─ Semantic Search (Pinecone)
    └─ Metadata Filtering (GPA, Budget)
    ↓
LLM Service (Mistral AI)
    ├─ System Prompt (Academic Advisor)
    ├─ User Prompt (Profile + Retrieved Programs)
    └─ Stream Response
    ↓
Response Streaming (SSE)
    ├─ Chunk 1: Analysis
    ├─ Chunk 2: Recommendations
    └─ Chunk n: Conclusion
    ↓
Frontend Hook (use-recommendation-stream)
    ├─ Parse SSE
    ├─ Update UI Progressively
    └─ Display Formatted Output
    ↓
Save Recommendation (After Generation)
    ├─ PostgreSQL Storage
    └─ Feedback Ready
```

### Admin Dashboard Analytics Flow

```
Feedback Submission
    ↓
FeedbackService
    ├─ Save Feedback (Rating, Comments)
    ├─ Calculate Metrics (Avg Rating, Distribution)
    └─ Identify Low-Rated Items
    ↓
GET /api/admin/feedback/trends
    ↓
Frontend Charts (Chart.js)
    ├─ Rating Distribution (Bar)
    ├─ Trends Over Time (Line)
    └─ Top Programs (Pie)
    ↓
Admin Dashboard Display
```

## Technology Stack Integration

### Database Layer
- **ORM:** SQLAlchemy (via SQLModel)
- **Database:** PostgreSQL 15+
- **Features:** JSONB columns for flexible schema
- **Migrations:** Alembic
- **Connection Pool:** SQLAlchemy connection pooling

### API Layer
- **Framework:** FastAPI
- **Server:** Uvicorn
- **Validation:** Pydantic v2
- **Async:** asyncio/aiohttp
- **Streaming:** Server-Sent Events (SSE)

### AI/ML Layer
- **Embeddings:** Mistral AI Embeddings
- **Vector DB:** Pinecone
- **LLM Framework:** LlamaIndex
- **LLM Provider:** Mistral AI (multi-language)
- **RAG:** Hybrid search (semantic + keyword)

### Frontend Layer
- **Framework:** Next.js 16
- **Runtime:** React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS + CSS Modules
- **Components:** Shadcn UI + Radix UI
- **State:** Zustand
- **Forms:** TanStack Form + React Hook Form
- **Charts:** Chart.js + react-chartjs-2
- **HTTP:** fetch API

### Authentication
- **Provider:** Clerk
- **Token:** JWT
- **Frontend:** @clerk/nextjs
- **Backend:** Token verification middleware

### DevOps
- **Containerization:** Docker + Docker Compose
- **Orchestration:** Docker Compose (local) / Kubernetes (production-ready)
- **CI/CD:** GitHub Actions (optional)
- **Monitoring:** Prometheus + Grafana (optional)
- **Logging:** Python logging + structured JSON logs

## Security Architecture

### Authentication Flow

```
User Login (Frontend)
    ↓
Clerk Authentication UI
    ↓
JWT Token Generation (Clerk)
    ↓
Token Storage (Browser SessionStorage/Cookie)
    ↓
API Request with JWT in Authorization Header
    ↓
FastAPI Middleware (JWT Verification)
    ├─ Validate signature
    ├─ Check expiration
    └─ Extract user_id
    ↓
Request Handler (Authenticated User Context)
```

### Authorization Strategy

- **Frontend Routes:** Clerk middleware protection
- **API Endpoints:** JWT token required in Authorization header
- **Resource Access:** User can only access own data (checked in service layer)
- **Admin Routes:** Role-based access control (admin flag in Clerk metadata)

## Deployment Architecture

### Local Development

```
Docker Compose
├── PostgreSQL Service
│   └── Data Volume
├── Backend Service (FastAPI + uvicorn)
│   ├── Code Hot-reload
│   └── Pinecone Connection
├── Frontend Service (Next.js Dev Server)
│   └── Next.js Hot-reload
└── PgAdmin (Optional)
```

### Production Deployment

```
Cloud Provider (AWS/DigitalOcean/GCP)
├── Load Balancer / API Gateway
├── Backend Services (Scaled)
│   ├── Container 1
│   ├── Container 2
│   └── Container n
├── Database
│   └── Managed PostgreSQL (RDS/Aiven)
├── Cache Layer (Optional Redis)
├── Vector Database
│   └── Pinecone (Managed)
├── Frontend CDN
│   └── Vercel/Netlify
└── Monitoring
    ├── Error Tracking (Sentry)
    ├── Logs (CloudWatch/ELK)
    └── Metrics (Prometheus/Datadog)
```

## Performance Characteristics

### Expected Response Times
- User login: < 2 seconds (Clerk)
- Profile creation: < 1 second
- Profile list: < 500ms
- Recommendation generation: 5-15 seconds (streaming)
- Recommendation history: < 1 second
- Admin dashboard: < 2 seconds

### Scalability
- **Frontend:** CDN-based static deployment (infinitely scalable)
- **Backend:** Horizontally scalable via container orchestration
- **Database:** PostgreSQL connection pooling + read replicas
- **Vector DB:** Pinecone managed scaling
- **Cache:** Optional Redis for session/query caching

## Error Handling Strategy

### Frontend
- Try-catch blocks in components
- Error boundaries for React errors
- User-friendly error messages
- Error logging to backend

### Backend
- Exception handlers for all routes
- Structured error responses (code + message)
- Error logging with context
- Graceful degradation for external API failures

---

**Document Version:** 1.0.0  
**Last Updated:** January 30, 2026
