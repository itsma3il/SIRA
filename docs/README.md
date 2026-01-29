# SIRA Documentation

**Version**: 1.0.0  
**Last Updated**: January 29, 2026

Welcome to the SIRA documentation. This directory contains all technical and user-facing documentation for the Système Intelligent de Recommandation Académique (SIRA) platform.

---

## Documentation Structure

```
docs/
├── guides/              # User-facing guides and references
├── technical/           # Technical architecture and implementation
├── implementation/      # Phase-by-phase implementation records
└── archive/            # Historical documentation and refactoring notes
```

---

## Quick Navigation

### For End Users

**[User Guide](guides/USER_GUIDE.md)**  
Complete guide for students using SIRA to find university programs. Covers profile creation, recommendations, chat interface, and FAQs.

### For Developers

**[API Reference](guides/API_REFERENCE.md)**  
Comprehensive API endpoint documentation with request/response schemas, authentication requirements, and usage examples.

**[Deployment Guide](guides/DEPLOYMENT_GUIDE.md)**  
Production deployment procedures, environment configuration, Docker setup, monitoring, and troubleshooting.

**[Backend Security](technical/backend-security-hardening.md)**  
Security hardening implementation including rate limiting, input validation, security headers, and best practices.

**[Testing Guide](technical/testing-implementation.md)**  
Test suite documentation, coverage reports, and testing best practices. Includes 76 unit and integration tests.

**[Conversation System](technical/conversation_system_implementation.md)**  
Architecture of the conversational AI system using Server-Sent Events (SSE) for real-time streaming responses.

---

## Guides Directory

### User Documentation

- **[USER_GUIDE.md](guides/USER_GUIDE.md)**  
  End-user documentation for students
  - Getting started
  - Profile creation and management
  - Understanding recommendations
  - Using the chat interface
  - FAQ and support

### API & Development

- **[API_REFERENCE.md](guides/API_REFERENCE.md)**  
  Complete API endpoint reference
  - Authentication flow
  - All endpoints with examples
  - Request/response schemas
  - Rate limiting and error handling

- **[DEPLOYMENT_GUIDE.md](guides/DEPLOYMENT_GUIDE.md)**  
  Production deployment documentation
  - Prerequisites and requirements
  - Environment configuration
  - Docker deployment
  - Monitoring and logging
  - Security best practices
  - Troubleshooting

---

## Technical Directory

### Architecture & Implementation

- **[backend-security-hardening.md](technical/backend-security-hardening.md)**  
  Security implementation details
  - Rate limiting middleware
  - Security headers
  - Input validation and sanitization
  - Error handling
  - Attack vector mitigation

- **[testing-implementation.md](technical/testing-implementation.md)**  
  Test suite documentation
  - Test infrastructure (pytest, fixtures)
  - Unit tests (62 tests)
  - Integration tests (14 tests)
  - Coverage configuration
  - Running tests

- **[conversation_system_implementation.md](technical/conversation_system_implementation.md)**  
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
