# SIRA Platform Documentation

**Version:** 1.0.0  
**Last Updated:** January 30, 2026  
**Status:** Production Ready

---

## 🔍 Quick Search

Press **`Ctrl+K`** (or **`⌘K`** on Mac) to search all documentation instantly!

See [Documentation Search Guide](./USING_DOC_SEARCH.md) for details.

---

## Welcome to SIRA

**SIRA** (Système Intelligent de Recommandation Académique) is an AI-powered academic advisory platform that helps students discover personalized university programs and career paths through advanced RAG (Retrieval-Augmented Generation) technology.

### What is SIRA?

SIRA combines cutting-edge AI technology with comprehensive academic data to provide:
- **Personalized Recommendations**: Tailored university program suggestions based on your unique profile
- **Real-time AI Advisor**: Interactive chat interface for instant academic guidance
- **Smart Matching**: Advanced algorithms that consider your grades, interests, budget, and career goals
- **Comprehensive Database**: Extensive catalog of university programs from Morocco and international institutions

---

## Documentation Overview

This documentation is organized by audience and use case:

### 📘 For Students & End Users

| Document | Description | Use When |
|----------|-------------|----------|
| **[Getting Started Guide](./USER_GUIDE.md)** | Quick start for new users | First time using SIRA |
| **[User Manual](./USER_GUIDE.md#detailed-features)** | Complete feature reference | Learning all capabilities |
| **[FAQ](./USER_GUIDE.md#faq)** | Common questions & answers | Troubleshooting issues |

### 👨‍💻 For Developers

| Document | Description | Use When |
|----------|-------------|----------|
| **[Architecture Overview](./ARCHITECTURE.md)** | System design & components | Understanding system structure |
| **[API Reference](./API_REFERENCE.md)** | Complete API documentation | Integrating with SIRA |
| **[Developer Guide](./DEVELOPER_GUIDE.md)** | Coding standards & practices | Contributing to codebase |
| **[Database Schema](./DATABASE.md)** | Data models & relationships | Working with database |
| **[Technology Stack](./TECH_STACK.md)** | Technologies & tools used | Understanding tech choices |

### 🚀 For DevOps & Operations

| Document | Description | Use When |
|----------|-------------|----------|
| **[Deployment Guide](./DEPLOYMENT.md)** | Production deployment | Deploying to production |
| **[Operations Manual](./OPERATIONS.md)** | Running & maintaining SIRA | Day-to-day operations |
| **[Monitoring Guide](./MONITORING.md)** | System health & performance | Setting up monitoring |
| **[Security Guide](./SECURITY.md)** | Security implementation | Security audit & hardening |
| **[Incident Runbooks](./INCIDENT_RUNBOOKS.md)** | Emergency procedures | Handling production incidents |
| **[Troubleshooting](./TROUBLESHOOTING.md)** | Problem resolution | Debugging issues |

### 📊 For Project Managers

| Document | Description | Use When |
|----------|-------------|----------|
| **[Project Status](./PROJECT_STATUS.md)** | Current development status | Tracking progress |
| **[Testing Strategy](./TESTING.md)** | Test coverage & quality | Assessing quality |
| **[Release Notes](./RELEASE_NOTES.md)** | Version history | Tracking changes |

---

## Quick Links

### Common Tasks

- **Search Documentation** → Press `Ctrl+K` (or `⌘K` on Mac) from anywhere
- **Install & Run SIRA Locally** → [Developer Guide - Setup](./DEVELOPER_GUIDE.md#setup)
- **Deploy to Production** → [Deployment Guide](./DEPLOYMENT.md)
- **Create API Integration** → [API Reference](./API_REFERENCE.md)
- **Report a Bug** → [GitHub Issues](https://github.com/yourorg/sira/issues)
- **Get Help** → [Support Channels](#support)

### Key Resources

- **OpenAPI/Swagger Docs**: http://localhost:8000/docs (when running)
- **Admin Dashboard**: http://localhost:3000/admin (requires admin role)
- **Health Checks**: http://localhost:8000/health
- **Metrics**: http://localhost:9090 (Prometheus)
- **Monitoring**: http://localhost:3001 (Grafana)

---

## System Architecture

### High-Level Overview

```
┌────────────────────────────────────────────────────────┐
│                    Client Layer                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Next.js 16 Frontend (React + TypeScript)        │  │
│  │  • Server Components  • Client Components        │  │
│  │  • Zustand State     • Chart.js Visualizations  │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────────┬─────────────────────────────────┘
                       │ HTTPS/JWT Auth (Clerk)
┌──────────────────────▼─────────────────────────────────┐
│                   API Gateway                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Nginx Reverse Proxy                             │  │
│  │  • SSL/TLS Termination  • Rate Limiting          │  │
│  │  • Load Balancing       • Request Routing        │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────────┬─────────────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────────────┐
│                 Backend API Layer                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │  FastAPI (Python 3.11+)                          │  │
│  │  • REST API Endpoints  • Authentication          │  │
│  │  • SSE Streaming       • Business Logic          │  │
│  │  • Rate Limiting       • Input Validation        │  │
│  └──────────────────────────────────────────────────┘  │
└─────────┬──────────────┬──────────────┬───────────────┘
          │              │              │
┌─────────▼────┐  ┌─────▼──────┐  ┌───▼──────────────┐
│ PostgreSQL   │  │  Pinecone  │  │  Mistral AI      │
│ Database     │  │  Vector DB │  │  LLM Service     │
│ • User Data  │  │  • Programs│  │  • Embeddings    │
│ • Profiles   │  │  • Semantic│  │  • Generation    │
│ • Feedback   │  │    Search  │  │  • Streaming     │
└──────────────┘  └────────────┘  └──────────────────┘
```

### Technology Stack

**Frontend:**
- Next.js 16 with React 19 & TypeScript
- Tailwind CSS + Shadcn/ui Components
- Zustand State Management
- Chart.js Visualizations
- Clerk Authentication

**Backend:**
- FastAPI (Python 3.11+)
- SQLModel ORM + PostgreSQL 15+
- LlamaIndex RAG Framework
- Pinecone Vector Database
- Mistral AI LLM

**Infrastructure:**
- Docker & Docker Compose
- Nginx Reverse Proxy
- Prometheus + Grafana Monitoring
- Redis Caching (optional)

---

## Key Features

### ✨ For Students

- **Multi-Profile Management**: Create separate profiles for different academic paths
- **AI-Powered Recommendations**: Get personalized program suggestions based on your profile
- **Real-time Chat Interface**: Ask questions and get instant advice from the AI advisor
- **Visual Insights**: Match scores, timelines, and comparison charts
- **Feedback System**: Rate recommendations and help improve the system
- **Mobile-Responsive**: Access from any device

### 🔧 For Developers

- **RESTful API**: Well-documented endpoints with OpenAPI/Swagger
- **Server-Sent Events**: Real-time streaming for recommendations and chat
- **Type Safety**: Full TypeScript/Python type hints
- **Comprehensive Tests**: 100+ unit and integration tests
- **Docker Support**: One-command local development setup
- **Hot Reload**: Fast development iteration

### 🛡️ For Operations

- **Production-Ready**: Comprehensive deployment automation
- **Monitoring**: Prometheus metrics + Grafana dashboards
- **Security**: SSL/TLS, rate limiting, input validation, JWT authentication
- **Logging**: Structured logging with ELK stack support
- **Health Checks**: Multiple endpoint health monitoring
- **Incident Runbooks**: Pre-written emergency procedures

---

## Project Status

### Current Version: 1.0.0

**Release Date:** January 30, 2026  
**Status:** ✅ Production Ready

**Key Metrics:**
- **Phases Completed:** 8/8 (100%)
- **Tests Passing:** 100/110 (91%)
- **Code Coverage:** 52%
- **Security Audit:** ✅ Passed
- **Performance:** ✅ Optimized
- **Documentation:** ✅ Complete (6,000+ lines)

### Recent Achievements

- ✅ Phase 8 Complete: Testing & deployment preparation
- ✅ 100+ tests passing with 91% success rate
- ✅ Comprehensive security hardening
- ✅ Production deployment automation
- ✅ Monitoring and alerting configured
- ✅ Complete documentation suite

### What's Next

**Phase 8.6 - Production Deployment** (Ready to Execute)
- Infrastructure provisioning
- Production environment setup
- Database migration
- SSL/TLS configuration
- Smoke testing
- Go-live monitoring

See [Project Status](./PROJECT_STATUS.md) for detailed roadmap.

---

## Development Workflow

### For New Developers

1. **Setup**: Follow [Developer Guide - Setup](./DEVELOPER_GUIDE.md#setup)
2. **Architecture**: Read [Architecture Overview](./ARCHITECTURE.md)
3. **Standards**: Review [Developer Guide - Coding Standards](./DEVELOPER_GUIDE.md#coding-standards)
4. **First PR**: Check [Contributing Guidelines](./DEVELOPER_GUIDE.md#contributing)

### For Existing Developers

```bash
# Start development environment
docker-compose up -d

# Run tests
cd backend && pytest
cd frontend && bun test

# Check code quality
cd backend && black . && isort . && flake8
cd frontend && bun run lint

# Create feature branch
git checkout -b feature/your-feature-name
```

---

## Support & Community

### Getting Help

**For Users:**
- 📧 Email: support@sira.platform
- 💬 Live Chat: Available in-app
- 📖 FAQ: [User Guide FAQ](./USER_GUIDE.md#faq)

**For Developers:**
- 🐛 Bug Reports: [GitHub Issues](https://github.com/yourorg/sira/issues)
- 💡 Feature Requests: [GitHub Discussions](https://github.com/yourorg/sira/discussions)
- 📚 Documentation: This repository
- 💬 Developer Chat: [Discord/Slack]

### Contributing

We welcome contributions! Please read:
- [Developer Guide](./DEVELOPER_GUIDE.md)
- [Contributing Guidelines](./DEVELOPER_GUIDE.md#contributing)
- [Code of Conduct](./CODE_OF_CONDUCT.md)

### Security

Found a security vulnerability?
- **DO NOT** open a public issue
- Email: security@sira.platform
- See [Security Policy](./SECURITY.md#reporting-vulnerabilities)

---

## License

[Your License Here - e.g., MIT, Apache 2.0]

---

## Acknowledgments

**Built With:**
- [Next.js](https://nextjs.org/) - React Framework
- [FastAPI](https://fastapi.tiangolo.com/) - Python Web Framework
- [LlamaIndex](https://www.llamaindex.ai/) - RAG Framework
- [Mistral AI](https://mistral.ai/) - Language Models
- [Pinecone](https://www.pinecone.io/) - Vector Database
- [Clerk](https://clerk.com/) - Authentication

**Special Thanks:**
- All contributors and testers
- The open-source community
- Academic institutions providing program data

---

**Last Updated:** January 30, 2026  
**Documentation Version:** 1.0.0  
**Contact:** docs@sira.platform
  Conversational AI architecture
  - Server-Sent Events (SSE) implementation
  - Real-time streaming
  - Frontend-backend integration
  - Error handling and recovery

---

## Implementation Directory

### Phase Documentation

Development was completed in phases, with comprehensive documentation for each:

**Phase 3: Knowledge Base & RAG**
- **[PHASE3_SUMMARY.md](implementation/PHASE3_SUMMARY.md)** - Complete Phase 3 overview
- **[phase3_knowledge_base.md](implementation/phase3_knowledge_base.md)** - RAG infrastructure details
- **[QUICKREF_PHASE3.md](implementation/QUICKREF_PHASE3.md)** - Quick reference guide

**Phase 5: Conversational AI**
- **[phase-5-implementation-summary.md](implementation/phase-5-implementation-summary.md)** - Chat interface implementation

**Phase 7: Feedback & Analytics**
- **[phase7_implementation_summary.md](implementation/phase7_implementation_summary.md)** - Complete Phase 7 overview
- **[phase7_frontend_implementation.md](implementation/phase7_frontend_implementation.md)** - Frontend implementation
- **[QUICKREF_PHASE7.md](implementation/QUICKREF_PHASE7.md)** - Quick reference guide

---

## Archive Directory

Historical documentation, refactoring notes, bug fixes, and migration guides. Useful for understanding the evolution of the codebase.

**Refactoring & Migrations**
- **[API_REFACTORING_COMPLETE.md](archive/API_REFACTORING_COMPLETE.md)** - OOP architecture refactoring
- **[API_MIGRATION_GUIDE.md](archive/API_MIGRATION_GUIDE.md)** - API migration procedures
- **[database_schema_refactoring_summary.md](archive/database_schema_refactoring_summary.md)** - Database refactoring
- **[data-inconsistency-analysis.md](archive/data-inconsistency-analysis.md)** - Data consistency analysis
- **[zustand-implementation.md](archive/zustand-implementation.md)** - State management implementation

**Streaming & SSE**
- **[SSE-Authentication-Security.md](archive/SSE-Authentication-Security.md)** - SSE security implementation
- **[SSE-Migration-fetch-event-source.md](archive/SSE-Migration-fetch-event-source.md)** - SSE migration guide
- **[streaming-fixes-implementation.md](archive/streaming-fixes-implementation.md)** - Streaming fixes
- **[STREAMING_QUICKREF.md](archive/STREAMING_QUICKREF.md)** - Streaming quick reference

**Bug Fixes & Features**
- **[BUGFIX_OPTIONAL_PROFILE_STREAMING.md](archive/BUGFIX_OPTIONAL_PROFILE_STREAMING.md)** - Profile streaming bug fix
- **[FEATURE_STREAMING_UI_IMPROVEMENTS.md](archive/FEATURE_STREAMING_UI_IMPROVEMENTS.md)** - UI improvements

**Infrastructure**
- **[task-2-3-file-upload-service.md](archive/task-2-3-file-upload-service.md)** - File upload implementation
- **[pinecone-troubleshooting.md](archive/pinecone-troubleshooting.md)** - Vector DB troubleshooting

---

## Common Tasks

### Getting Started

1. **For developers**: Start with [DEPLOYMENT_GUIDE.md](guides/DEPLOYMENT_GUIDE.md)
2. **For API integration**: See [API_REFERENCE.md](guides/API_REFERENCE.md)
3. **For end users**: Read [USER_GUIDE.md](guides/USER_GUIDE.md)

### Understanding the System

1. Read Phase 3 documentation to understand RAG infrastructure
2. Review [conversation_system_implementation.md](technical/conversation_system_implementation.md) for chat architecture
3. Check [backend-security-hardening.md](technical/backend-security-hardening.md) for security features

### Troubleshooting

1. Check [DEPLOYMENT_GUIDE.md](guides/DEPLOYMENT_GUIDE.md) troubleshooting section
2. Review archived troubleshooting guides in [archive/](archive/)
3. Check test suite in [testing-implementation.md](technical/testing-implementation.md)

---

## Technology Stack

**Frontend**
- Next.js 16 with App Router
- React 19
- TypeScript
- Tailwind CSS
- Radix UI + Shadcn/UI
- Zustand (state management)
- TanStack Form (forms)

**Backend**
- FastAPI (Python 3.11+)
- SQLAlchemy + PostgreSQL
- Pydantic v2 (validation)
- Alembic (migrations)

**AI/RAG**
- LlamaIndex (orchestration)
- Mistral AI (LLM)
- Pinecone (vector database)

**Infrastructure**
- Docker + Docker Compose
- Nginx (reverse proxy)
- Clerk (authentication)

---

## Contributing to Documentation

### Documentation Standards

- Use Markdown for all documentation
- Include table of contents for documents over 100 lines
- Add last updated date at the top
- No emojis in production documentation
- Use code blocks with language specification
- Include practical examples where applicable

### File Naming Conventions

- **Guides**: `UPPERCASE_GUIDE.md` (e.g., `USER_GUIDE.md`)
- **Technical**: `lowercase-with-hyphens.md` (e.g., `backend-security-hardening.md`)
- **Implementation**: `phaseN_description.md` or `PHASEN_SUMMARY.md`
- **Archive**: Original names preserved for historical reference

### Adding New Documentation

1. Determine appropriate directory (guides/, technical/, implementation/)
2. Follow naming conventions
3. Include standard headers (title, date, table of contents)
4. Update this README.md with new document reference
5. Cross-link related documentation

---

## Version History

### 1.0.0 (January 29, 2026)
- Complete documentation reorganization
- Removed emojis from production docs
- Created logical folder structure
- Added comprehensive guides for users, developers, and operations
- 76 tests with >80% coverage
- Production-ready deployment procedures

---

## Support & Contact

**Documentation Issues**: Open an issue on GitHub  
**Technical Support**: support@sira-academic.com  
**Project Repository**: https://github.com/yourusername/sira

---

**Last Updated**: January 29, 2026  
**Maintained by**: SIRA Development Team
