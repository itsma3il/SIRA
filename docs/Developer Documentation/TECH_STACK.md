# SIRA Technology Stack

## Overview

SIRA uses a modern, production-ready technology stack focused on reliability, scalability, and developer experience. This document details each technology, its purpose, and integration points.

---

## Frontend Stack

### Core Framework

**Next.js 16**
- **Type:** React meta-framework with server-side capabilities
- **Version:** 16.0.0+
- **Purpose:** Production-grade React application with SSR, static generation, and API routes
- **Key Features:**
  - App Router (file-based routing)
  - Server Components (data fetching)
  - Client Components (interactivity)
  - Built-in optimization (images, fonts, scripts)
  - Fast Refresh for development
- **Installation:** `bun add next@latest`
- **Configuration:** `next.config.ts`
- **Docs:** https://nextjs.org/docs

**React 19**
- **Type:** UI library
- **Version:** 19.0.0+
- **Purpose:** Component-based UI building
- **Key Features:**
  - Server Components support
  - Improved hooks
  - Enhanced form handling
- **Installation:** Installed with Next.js

### TypeScript

**Version:** 5.3+
- **Purpose:** Type-safe JavaScript
- **Configuration:** `tsconfig.json`
- **Benefits:**
  - Early error detection
  - Better IDE support
  - Self-documenting code
  - Refactoring confidence

### Styling

**Tailwind CSS 3**
- **Type:** Utility-first CSS framework
- **Version:** 3.3.0+
- **Purpose:** Rapid UI development with predefined utilities
- **Configuration:** `tailwind.config.ts`, `globals.css`
- **Advantages:**
  - Rapid development
  - Consistent design system
  - Minimal CSS output (tree-shaking)
  - Great DX with IDE plugins

**PostCSS**
- **Purpose:** CSS transformation and optimization
- **Configuration:** `postcss.config.mjs`

### UI Components

**Shadcn/ui + Radix UI**
- **Type:** Headless component library
- **Version:** Latest
- **Purpose:** Accessible, unstyled components
- **Components Used:**
  - Button, Input, Select
  - Dialog, Sheet (modals)
  - Tabs, Accordion
  - Card, Badge
  - Toast, Skeleton
  - Form, Textarea
- **Installation:** Copy-paste or CLI integration
- **Documentation:** https://ui.shadcn.com

**Radix UI**
- **Type:** Primitives for accessible components
- **Version:** Latest
- **Purpose:** Accessibility foundations for Shadcn
- **Key Primitives:**
  - Dialog
  - Popover
  - Tooltip
  - Select
  - Tabs

### State Management

**Zustand**
- **Type:** Lightweight state management
- **Version:** 4.4.0+
- **Purpose:** Global application state
- **Stores Created:**
  - `profile-wizard-store.ts` - Multi-step form state
  - `auth-store.ts` - Authentication state
- **Advantages:**
  - Minimal boilerplate
  - TypeScript support
  - Middleware support
  - Easy to test
- **Installation:** `bun add zustand`

### Form Management

**React Hook Form**
- **Type:** Performant form library
- **Version:** 7.48.0+
- **Purpose:** Form state and validation
- **Features:**
  - Minimal re-renders
  - Uncontrolled components
  - Easy integration with validation schemas
  - TypeScript support
- **Installation:** `bun add react-hook-form`

**TanStack Form** (Alternative/Complementary)
- **Type:** Headless form library
- **Purpose:** Advanced form state management
- **Used for:** Multi-step profile wizard
- **Installation:** `bun add @tanstack/react-form`

**Zod**
- **Type:** TypeScript-first schema validation
- **Version:** 3.22.0+
- **Purpose:** Schema validation for forms and APIs
- **File:** `lib/profile-form-schema.ts`
- **Installation:** `bun add zod`

### Data Visualization

**Chart.js**
- **Type:** JavaScript charting library
- **Version:** 4.4.0+
- **Purpose:** Interactive charts and graphs
- **Used For:**
  - Match score gauges
  - Comparison charts
  - Analytics dashboard
- **Installation:** `bun add chart.js react-chartjs-2`

**react-chartjs-2**
- **Type:** React wrapper for Chart.js
- **Purpose:** Chart.js integration with React
- **Installation:** `bun add react-chartjs-2`

### HTTP Client

**Fetch API**
- **Type:** Native browser API
- **Purpose:** API communication
- **Advantages:**
  - No external dependencies
  - Modern, promise-based
  - Built-in Request/Response streaming
- **Location:** Wrapped in `lib/api/` services

### Streaming

**Server-Sent Events (SSE)**
- **Type:** Real-time communication protocol
- **Purpose:** Streaming recommendations and chat
- **Hooks:**
  - `use-recommendation-stream.ts` - Handles recommendation streams
  - `use-conversation-stream.ts` - Handles chat streams
- **Advantages:**
  - One-way communication (backend → frontend)
  - Automatic reconnection
  - HTTP-based (no WebSocket setup)

### Authentication

**Clerk**
- **Type:** Third-party authentication platform
- **Version:** Latest
- **Purpose:** User registration, login, and session management
- **Package:** `@clerk/nextjs`
- **Features:**
  - Multi-factor authentication
  - Social login
  - JWT tokens
  - User metadata
- **Configuration:** Environment variables
- **Documentation:** https://clerk.com/docs

### Development Tools

**ESLint**
- **Type:** JavaScript/TypeScript linter
- **Purpose:** Code quality and consistency
- **Configuration:** `eslint.config.mjs`
- **Plugins:** TypeScript, React, Next.js
- **Installation:** `bun add -D eslint`

**Prettier**
- **Type:** Code formatter
- **Purpose:** Consistent code formatting
- **Configuration:** Integrated in `eslint.config.mjs`

**TypeScript**
- **Compiler:** Built-in with Next.js
- **Configuration:** `tsconfig.json`

### Package Manager

**Bun**
- **Type:** JavaScript runtime and package manager
- **Version:** 1.0.0+
- **Purpose:** Fast package management and script execution
- **Advantages:**
  - 10x faster than npm
  - All-in-one toolchain
  - TypeScript support
  - Shell scripting
- **Lock File:** `bun.lockb`

### Environment Configuration

**Environment Variables**
- **Files:**
  - `.env.local` - Local development
  - `.env.production` - Production
- **Key Variables:**
  - `NEXT_PUBLIC_API_BASE_URL` - Backend API URL
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
  - `CLERK_SECRET_KEY` - Clerk secret key

---

## Backend Stack

### Core Framework

**FastAPI**
- **Type:** Modern Python web framework
- **Version:** 0.104.0+
- **Purpose:** RESTful API development
- **Key Features:**
  - Automatic API documentation (OpenAPI/Swagger)
  - Async/await support
  - Dependency injection
  - Data validation (Pydantic)
  - Great performance
- **Installation:** `uv add fastapi`
- **Docs:** https://fastapi.tiangolo.com

**Uvicorn**
- **Type:** ASGI web server
- **Version:** 0.24.0+
- **Purpose:** Run FastAPI application
- **Configuration:** uvicorn command with reload for development
- **Installation:** `uv add uvicorn`

### Database

**PostgreSQL 15+**
- **Type:** Relational database
- **Purpose:** Persistent data storage
- **Key Features:**
  - ACID compliance
  - JSONB support (for flexible schemas)
  - Full-text search
  - Advanced indexing
  - Connection pooling
- **Client:** `psycopg2-binary`

**SQLAlchemy 2.0**
- **Type:** Python ORM
- **Version:** 2.0.23+
- **Purpose:** Database abstraction and ORM
- **Configuration:** `app/db.py`
- **Models:** `app/models/`
- **Features:**
  - Type hints support
  - Relationship declarations
  - Query building
  - Migration support
- **Installation:** `uv add sqlalchemy`

**SQLModel**
- **Type:** Combines SQLAlchemy + Pydantic
- **Version:** 0.0.14+
- **Purpose:** Single model definition for DB + validation
- **Advantages:**
  - DRY principle
  - Type safety
  - Automatic documentation
- **Installation:** `uv add sqlmodel`

**Alembic**
- **Type:** Database migration tool
- **Version:** 1.13.0+
- **Purpose:** Version control for database schema
- **Configuration:** `alembic.ini`, `alembic/`
- **Migrations:** `alembic/versions/`
- **Installation:** `uv add alembic`

### Data Validation

**Pydantic v2**
- **Type:** Data validation library
- **Version:** 2.5.0+
- **Purpose:** Request/response schema validation
- **Schemas:** `app/schemas/`
- **Features:**
  - Type validation
  - Custom validators
  - Serialization
  - JSON schema generation
- **Installation:** Included with FastAPI

**Python-multipart**
- **Type:** Multipart form data parser
- **Purpose:** File upload handling
- **Installation:** `uv add python-multipart`

### Configuration

**Pydantic Settings**
- **Type:** Environment configuration management
- **Purpose:** Load and validate environment variables
- **File:** `app/core/config.py`
- **Features:**
  - Type-safe configuration
  - Environment variable loading
  - .env file support

**python-dotenv**
- **Type:** Environment variable loader
- **Purpose:** Load `.env` files
- **Installation:** `uv add python-dotenv`

### Security

**PyJWT**
- **Type:** JWT token library
- **Purpose:** JWT token validation
- **Used for:** Clerk JWT verification
- **Installation:** Installed via dependencies

**python-jose**
- **Type:** JWT/JWE handling
- **Purpose:** Secure token operations
- **Installation:** `uv add python-jose`

**cryptography**
- **Type:** Cryptographic library
- **Purpose:** Encryption and hashing
- **Installation:** `uv add cryptography`

### Async & Concurrency

**asyncio**
- **Type:** Built-in Python async library
- **Purpose:** Asynchronous programming
- **Used for:** Async database queries, async HTTP calls

**aiohttp**
- **Type:** Async HTTP client
- **Purpose:** Non-blocking API calls
- **Installation:** `uv add aiohttp`

### AI/ML Layer

**LlamaIndex**
- **Type:** Data indexing and RAG framework
- **Version:** Latest
- **Purpose:** Retrieval-Augmented Generation pipeline
- **Components:**
  - Query engines
  - Retrievers
  - Prompt helpers
  - Response synthesizers
- **Installation:** `uv add llama-index`

**Pinecone Client**
- **Type:** Vector database client
- **Version:** Latest
- **Purpose:** Vector similarity search
- **Features:**
  - Semantic search
  - Metadata filtering
  - Namespace isolation
  - Serverless indexing
- **Installation:** `uv add pinecone-client`

**Mistral AI SDK**
- **Type:** LLM provider SDK
- **Version:** Latest
- **Purpose:** Access to Mistral AI models
- **Models:**
  - `mistral-large` - For complex reasoning
  - `mistral-medium` - Balanced performance/cost
  - `mistral-small` - For simple tasks
  - `mistral-embed` - For embeddings
- **Installation:** `uv add mistralai`

### Testing

**pytest**
- **Type:** Testing framework
- **Version:** 8.3.0+
- **Purpose:** Unit and integration testing
- **Configuration:** `backend/pyproject.toml`
- **Installation:** `uv add pytest`

**pytest-asyncio**
- **Type:** Pytest plugin for async tests
- **Purpose:** Test async FastAPI endpoints
- **Installation:** `uv add pytest-asyncio`

**pytest-cov**
- **Type:** Coverage plugin for pytest
- **Purpose:** Code coverage reporting
- **Installation:** `uv add pytest-cov`

### Utilities

**requests**
- **Type:** HTTP client library
- **Purpose:** Synchronous HTTP requests
- **Installation:** `uv add requests`

**python-dateutil**
- **Type:** Date/time utilities
- **Purpose:** Parse and manipulate dates
- **Installation:** `uv add python-dateutil`

**pytz**
- **Type:** Timezone library
- **Purpose:** Timezone handling
- **Installation:** `uv add pytz`

**json-encoder-plus**
- **Type:** JSON serialization utilities
- **Purpose:** Handle complex types in JSON
- **Installation:** Optional dependency

### Development Tools

**Black**
- **Type:** Code formatter
- **Purpose:** Consistent code style
- **Installation:** `uv add black`

**isort**
- **Type:** Import sorter
- **Purpose:** Organize imports
- **Installation:** `uv add isort`

**flake8**
- **Type:** Linter
- **Purpose:** PEP 8 compliance
- **Installation:** `uv add flake8`

**mypy**
- **Type:** Static type checker
- **Purpose:** Type annotation checking
- **Installation:** `uv add mypy`

**ruff**
- **Type:** Fast Python linter
- **Purpose:** Code quality
- **Installation:** `uv add ruff`

### Package Management

**uv**
- **Type:** Python package manager (Rust-based)
- **Purpose:** Fast dependency management
- **Lock File:** `requirements.txt` + virtual env
- **Advantages:**
  - 100x faster than pip
  - Instant installs
  - Deterministic builds
  - Drop-in pip replacement

---

## Infrastructure & DevOps

### Containerization

**Docker**
- **Version:** 20.10+
- **Purpose:** Container images for reproducible deployments
- **Files:**
  - `backend/Dockerfile` - FastAPI image
  - `backend/Dockerfile.prod` - Production optimized
  - `frontend/Dockerfile` - Next.js image
- **Features:**
  - Multi-stage builds
  - Hot-reload development
  - Optimized production builds

**Docker Compose**
- **Version:** 2.0+
- **File:** `docker-compose.yml`
- **Purpose:** Local development orchestration
- **Services:**
  - PostgreSQL 15
  - FastAPI backend
  - Next.js frontend
  - PgAdmin (optional)

### Production Deployment Options

**AWS**
- **ECS:** Container orchestration
- **RDS:** Managed PostgreSQL
- **ECR:** Container registry
- **CloudFront:** CDN for frontend
- **ALB:** Load balancing

**DigitalOcean**
- **App Platform:** Easy deployment
- **Managed PostgreSQL:** Database hosting
- **Spaces:** Object storage

**Google Cloud Platform**
- **Cloud Run:** Serverless containers
- **Cloud SQL:** Managed PostgreSQL
- **Cloud CDN:** Content delivery

**Vercel** (Frontend)
- **Next.js Deployment:** Built-in optimization
- **Edge Functions:** Serverless functions
- **Analytics:** Built-in monitoring

### CI/CD

**GitHub Actions** (Optional)
- **Purpose:** Automated testing and deployment
- **Workflows:**
  - Test on push
  - Deploy on release

---

## External Services

### Authentication

**Clerk**
- **Type:** Auth platform
- **Features:**
  - User management
  - JWT tokens
  - Multi-factor auth
  - Social login
- **Pricing:** Free tier for development

### Vector Database

**Pinecone**
- **Type:** Managed vector database
- **Purpose:** Semantic search for RAG
- **Features:**
  - Serverless scaling
  - Metadata filtering
  - Real-time indexing
- **Pricing:** Free tier with limits

### LLM Provider

**Mistral AI**
- **Type:** Language model API
- **Models:**
  - `mistral-large` - Most capable
  - `mistral-medium` - Balanced
  - `mistral-small` - Fast/cheap
  - `mistral-embed` - Embeddings
- **Pricing:** Pay-per-token

---

## Development Stack

### Code Editor

**Visual Studio Code**
- **Extensions:**
  - Python
  - Pylance
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - Docker
  - REST Client
  - Thunder Client

### Version Control

**Git**
- **Hosting:** GitHub
- **Workflow:** Feature branches, pull requests

### Documentation

**Markdown**
- **Tool:** Any text editor
- **Viewing:** GitHub, VS Code
- **Hosting:** This documentation folder

---

## Dependency Management Strategy

### Frontend Dependencies

```json
{
  "core": ["next", "react", "react-dom"],
  "styling": ["tailwindcss", "postcss"],
  "ui": ["@radix-ui/*", "@shadcn/ui"],
  "state": ["zustand"],
  "forms": ["react-hook-form", "@tanstack/react-form", "zod"],
  "data": ["chart.js", "react-chartjs-2"],
  "auth": ["@clerk/nextjs"],
  "dev": ["typescript", "eslint", "prettier"]
}
```

### Backend Dependencies

```
core:
  - fastapi
  - uvicorn

database:
  - sqlalchemy
  - sqlmodel
  - alembic
  - psycopg2-binary

ai:
  - llama-index
  - pinecone-client
  - mistralai

validation:
  - pydantic
  - python-multipart

async:
  - aiohttp
  - asyncio

security:
  - python-jose
  - cryptography

testing:
  - pytest
  - pytest-asyncio
  - pytest-cov

dev:
  - black
  - isort
  - flake8
  - mypy
  - ruff
```

---

## Version Compatibility Matrix

| Component | Version | Compatibility |
|-----------|---------|---|
| Node.js | 18.17+ | Required for Next.js 16 |
| Python | 3.11+ | FastAPI, modern async support |
| PostgreSQL | 15+ | JSONB support required |
| Next.js | 16.0.0+ | Latest features |
| React | 19.0.0+ | Server Components |
| TypeScript | 5.3+ | Type safety |
| FastAPI | 0.104.0+ | Latest features |
| SQLAlchemy | 2.0+ | SQLModel compatibility |

---

## Performance Benchmarks

### Response Times (Target)
- API endpoint: < 500ms
- Database query: < 100ms
- RAG recommendation: 5-15 seconds
- Frontend page load: < 2 seconds

### Scalability Targets
- Concurrent users: 1000+
- Requests per second: 100+
- Database connections: 20-50 per instance

---

**Technology Stack Version:** 1.0.0  
**Last Updated:** January 30, 2026  
**Status:** Production Ready
