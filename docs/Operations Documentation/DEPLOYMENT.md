# SIRA Deployment Guide

**Complete Deployment Handbook for SIRA Platform**

This guide covers deploying SIRA from development through production, including environment setup, Docker configuration, security hardening, monitoring, and troubleshooting.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Docker Deployment](#docker-deployment)
- [Database Setup](#database-setup)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Environment-Specific Configurations](#environment-specific-configurations)
- [Security Hardening](#security-hardening)
- [Monitoring & Logging](#monitoring--logging)
- [Backup & Recovery](#backup--recovery)
- [Troubleshooting](#troubleshooting)
- [Rollback Procedures](#rollback-procedures)

---

## Prerequisites

### System Requirements

**Minimum (Development):**
- CPU: 2 cores
- RAM: 4GB
- Storage: 20GB
- OS: Linux (Ubuntu 20.04+), macOS 12+, Windows 10+ with WSL2

**Recommended (Production):**
- CPU: 4+ cores
- RAM: 16GB+
- Storage: 100GB+ SSD
- OS: Ubuntu 22.04 LTS or equivalent

### Required Software

**Development:**
```bash
- Docker 24.0+
- Docker Compose 2.20+
- Node.js 20.x
- Python 3.12+
- Git 2.40+
- bun 1.x (frontend package manager)
- uv 0.x (Python package manager)
```

**Production (Additional):**
```bash
- Nginx 1.24+
- PostgreSQL 17
- Redis 7.x
- SSL Certificates (Let's Encrypt)
- Monitoring tools (Prometheus, Grafana)
```

### External Services

**Required:**
1. **Clerk.com Account**
   - Authentication provider
   - Free tier available
   - Publishable and secret keys needed

2. **Pinecone Account**
   - Vector database
   - Free tier available
   - API key and environment required

3. **Mistral AI Account**
   - LLM provider
   - API key required
   - Pay-per-use pricing

**Optional:**
- Sentry (error tracking)
- LogRocket (session replay)
- GitHub Actions (CI/CD)

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/itsma3il/sira.git
cd sira
```

### 2. Environment Variables

Create `.env` files for each environment:

#### **Root `.env` (Docker Compose)**

```env
# ============================================
# SIRA Platform - Environment Configuration
# ============================================

# Environment
NODE_ENV=development
ENVIRONMENT=development

# Database
POSTGRES_USER=sira_user
POSTGRES_PASSWORD=<generate-strong-password>
POSTGRES_DB=sira_db
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}

# Backend API
BACKEND_PORT=8000
BACKEND_HOST=backend
ALLOWED_ORIGINS=http://localhost:3000

# Frontend
FRONTEND_PORT=3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard/profile/new

# Pinecone Vector Database
PINECONE_API_KEY=xxxxxxxxxx
PINECONE_ENVIRONMENT=us-east1-gcp
PINECONE_INDEX_NAME=sira-programs

# Mistral AI
MISTRAL_API_KEY=xxxxxxxxxx
MISTRAL_MODEL=mistral-large-latest
MISTRAL_EMBED_MODEL=mistral-embed

# Redis (optional - for caching)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=<generate-strong-password>

# Security
SECRET_KEY=<generate-64-char-secret>
JWT_SECRET=<generate-64-char-secret>
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000

# Monitoring (optional)
SENTRY_DSN=https://xxx@sentry.io/xxx
LOG_LEVEL=INFO

# File Uploads
MAX_UPLOAD_SIZE=5242880  # 5MB
UPLOAD_DIR=/app/uploads
ALLOWED_UPLOAD_TYPES=pdf,jpg,jpeg,png
```

#### **Backend `.env`**

```env
# Backend-specific environment variables
DATABASE_URL=postgresql://sira_user:password@localhost:5432/sira_db

# Clerk
CLERK_SECRET_KEY=sk_test_xxxxxxxxxx

# Pinecone
PINECONE_API_KEY=xxxxxxxxxx
PINECONE_ENVIRONMENT=us-east1-gcp
PINECONE_INDEX_NAME=sira-programs

# Mistral
MISTRAL_API_KEY=xxxxxxxxxx

# Security
SECRET_KEY=<64-char-secret>

# File Upload
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE=5242880
```

#### **Frontend `.env.local`**

```env
# Frontend-specific environment variables
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard/profile/new
```

### 3. Generate Secrets

Use these commands to generate secure secrets:

```bash
# Generate random 64-character string (for SECRET_KEY, JWT_SECRET)
openssl rand -hex 32

# Or using Python
python -c "import secrets; print(secrets.token_hex(32))"

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Verify Configuration

```bash
# Check .env files exist
ls -la .env backend/.env frontend/.env.local

# Validate environment variables
docker-compose config
```

---

## Docker Deployment

### Development Deployment

#### 1. Build Services

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend
```

#### 2. Start Services

```bash
# Start all services with hot-reload
docker-compose up

# Start in background
docker-compose up -d

# Start specific services
docker-compose up postgres backend frontend
```

#### 3. View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100 backend
```

#### 4. Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (deletes database data)
docker-compose down -v

# Stop specific service
docker-compose stop backend
```

### Production Deployment

#### 1. Create Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:17-alpine
    container_name: sira-postgres-prod
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data_prod:/var/lib/postgresql/data
    networks:
      - sira-network-prod
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: sira-backend-prod
    restart: always
    environment:
      DATABASE_URL: ${DATABASE_URL}
      CLERK_SECRET_KEY: ${CLERK_SECRET_KEY}
      PINECONE_API_KEY: ${PINECONE_API_KEY}
      MISTRAL_API_KEY: ${MISTRAL_API_KEY}
      SECRET_KEY: ${SECRET_KEY}
    volumes:
      - ./backend/uploads:/app/uploads
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - sira-network-prod
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
      args:
        NEXT_PUBLIC_API_BASE_URL: ${NEXT_PUBLIC_API_BASE_URL}
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    container_name: sira-frontend-prod
    restart: always
    environment:
      CLERK_SECRET_KEY: ${CLERK_SECRET_KEY}
    depends_on:
      - backend
    networks:
      - sira-network-prod
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:1.25-alpine
    container_name: sira-nginx-prod
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/logs:/var/log/nginx
    depends_on:
      - frontend
      - backend
    networks:
      - sira-network-prod

volumes:
  postgres_data_prod:
    driver: local

networks:
  sira-network-prod:
    driver: bridge
```

#### 2. Create Production Dockerfiles

**Backend `Dockerfile.prod`:**

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads/transcripts

# Run as non-root user
RUN useradd -m -u 1000 sira && chown -R sira:sira /app
USER sira

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Start application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

**Frontend `Dockerfile.prod`:**

```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install bun
RUN npm install -g bun

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables at build time
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

# Build application
RUN bun run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

#### 3. Deploy to Production

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

---

## Database Setup

### Initial Migration

```bash
# Enter backend container
docker-compose exec backend bash

# Run migrations
alembic upgrade head

# Verify migration
alembic current
```

### Seed Data

```bash
# Run data ingestion script
docker-compose exec backend python app/ingest_sample.py

# Or use custom script
docker-compose exec backend python scripts/ingest_data.py
```

### Database Health Check

```bash
# Check database connection
docker-compose exec backend python -c "from app.db import engine; print('Connected' if engine.connect() else 'Failed')"

# Check tables
docker-compose exec postgres psql -U sira_user -d sira_db -c "\dt"

# Check record counts
docker-compose exec postgres psql -U sira_user -d sira_db -c "SELECT 'profiles' as table, COUNT(*) FROM profiles UNION ALL SELECT 'recommendations', COUNT(*) FROM recommendations;"
```

---

## SSL/TLS Configuration

### Using Let's Encrypt (Recommended)

#### 1. Install Certbot

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# macOS
brew install certbot
```

#### 2. Obtain Certificate

```bash
# Stop Nginx if running
docker-compose stop nginx

# Generate certificate
sudo certbot certonly --standalone -d sira.itsma3il.com

# Certificates saved to:
# /etc/letsencrypt/live/sira.itsma3il.com/fullchain.pem
# /etc/letsencrypt/live/sira.itsma3il.com/privkey.pem
```

#### 3. Configure Nginx

Create `nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
    limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=10r/m;

    # Upstream backends
    upstream backend {
        server backend:8000;
    }

    upstream frontend {
        server frontend:3000;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name sira.itsma3il.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS Server
    server {
        listen 443 ssl http2;
        server_name sira.itsma3il.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Security Headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # Frontend (Next.js)
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # API Backend (FastAPI)
        location /api {
            rewrite ^/api/(.*) /$1 break;
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Rate limiting for API
            limit_req zone=api_limit burst=20 nodelay;
        }

        # Authentication endpoints (stricter rate limiting)
        location ~ ^/api/(auth|login|register) {
            rewrite ^/api/(.*) /$1 break;
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Strict rate limiting for auth
            limit_req zone=auth_limit burst=5 nodelay;
        }

        # SSE (Server-Sent Events) for streaming
        location ~ ^/api/recommendations/.*/(stream|chat) {
            rewrite ^/api/(.*) /$1 break;
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Connection '';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # SSE-specific settings
            proxy_buffering off;
            proxy_cache off;
            proxy_read_timeout 600s;
            chunked_transfer_encoding off;
        }

        # Health check
        location /health {
            proxy_pass http://backend/health;
        }
    }
}
```

#### 4. Mount SSL Certificates

Update `docker-compose.prod.yml`:

```yaml
nginx:
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - /etc/letsencrypt/live/sira.itsma3il.com:/etc/nginx/ssl:ro
    - ./nginx/logs:/var/log/nginx
```

#### 5. Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Set up auto-renewal cron job
sudo crontab -e

# Add line (runs twice daily)
0 0,12 * * * certbot renew --quiet --post-hook "docker-compose -f /path/to/sira/docker-compose.prod.yml restart nginx"
```

---

## Environment-Specific Configurations

### Development Environment

**Characteristics:**
- Hot-reload enabled
- Debug logging
- Mock external services
- Local database

**Setup:**
```bash
# Use development docker-compose
docker-compose up

# Enable debug mode
export LOG_LEVEL=DEBUG
export DEBUG=True
```

### Staging Environment

**Characteristics:**
- Production-like setup
- Real external services (with test keys)
- Separate database
- SSL enabled

**Setup:**
```bash
# Use staging configuration
docker-compose -f docker-compose.staging.yml up -d

# Set environment
export ENVIRONMENT=staging
export LOG_LEVEL=INFO
```

### Production Environment

**Characteristics:**
- Optimized builds
- Monitoring enabled
- SSL required
- Backups automated

**Setup:**
```bash
# Use production configuration
docker-compose -f docker-compose.prod.yml up -d

# Set environment
export ENVIRONMENT=production
export LOG_LEVEL=WARNING
```

---

## Security Hardening

### 1. Backend Security

**Rate Limiting:**
```python
# app/core/security.py already implements:
- 100 requests/minute per IP (general)
- 10 requests/minute for auth endpoints
- 20 requests/minute for profile operations
```

**Input Validation:**
```python
# All endpoints use Pydantic schemas
# File uploads restricted to PDF, JPG, PNG (max 5MB)
# SQL injection prevented by SQLAlchemy ORM
```

**JWT Verification:**
```python
# Clerk JWT verified on every protected endpoint
# User ID extracted from token, not request body
```

### 2. Database Security

```bash
# Create read-only user for reporting
docker-compose exec postgres psql -U sira_user -d sira_db

CREATE USER readonly_user WITH PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE sira_db TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
```

### 3. Environment Variables

```bash
# Never commit .env files
echo ".env*" >> .gitignore

# Use secrets management in production
# Options: AWS Secrets Manager, HashiCorp Vault, etc.
```

### 4. Docker Security

```bash
# Run containers as non-root
USER sira  # In Dockerfile

# Scan images for vulnerabilities
docker scan sira-backend:latest
docker scan sira-frontend:latest

# Use minimal base images (alpine)
FROM python:3.12-alpine
```

### 5. Network Security

```bash
# Restrict external access
# Only expose ports 80/443 publicly
# Backend/Database on internal Docker network

# Use firewall rules
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 8000/tcp  # Block direct backend access
sudo ufw deny 5432/tcp  # Block direct database access
```

---

## Monitoring & Logging

### Health Checks

```bash
# Backend health
curl http://localhost:8000/health

# Frontend health
curl http://localhost:3000

# Database health
docker-compose exec postgres pg_isready -U sira_user
```

### Application Logs

```bash
# Real-time logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Error logs only
docker-compose logs backend | grep ERROR
docker-compose logs backend | grep -E "ERROR|CRITICAL"

# Export logs
docker-compose logs --since 24h > logs_24h.txt
```

### Prometheus Metrics (Optional)

Add to `docker-compose.prod.yml`:

```yaml
prometheus:
  image: prom/prometheus:latest
  volumes:
    - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    - prometheus_data:/prometheus
  ports:
    - "9090:9090"

grafana:
  image: grafana/grafana:latest
  volumes:
    - grafana_data:/var/lib/grafana
  ports:
    - "3001:3000"
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=admin
```

---

## Backup & Recovery

### Database Backup

```bash
# Manual backup
docker-compose exec postgres pg_dump -U sira_user sira_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated daily backup (cron)
0 2 * * * docker-compose -f /path/to/sira/docker-compose.prod.yml exec -T postgres pg_dump -U sira_user sira_db | gzip > /backups/sira_db_$(date +\%Y\%m\%d).sql.gz
```

### Database Restore

```bash
# Stop application
docker-compose stop backend frontend

# Restore database
docker-compose exec -T postgres psql -U sira_user -d sira_db < backup_20260130.sql

# Or from gzipped backup
gunzip -c backup_20260130.sql.gz | docker-compose exec -T postgres psql -U sira_user -d sira_db

# Start application
docker-compose start backend frontend
```

### File Backup (Uploads)

```bash
# Backup uploads directory
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz backend/uploads/

# Restore uploads
tar -xzf uploads_backup_20260130.tar.gz -C backend/
```

---

## Troubleshooting

### Common Issues

#### 1. Backend Won't Start

**Symptoms:**
- Container exits immediately
- "Connection refused" errors

**Solutions:**
```bash
# Check logs
docker-compose logs backend

# Common causes:
# - Database not ready: Wait for postgres health check
# - Missing environment variables: Verify .env file
# - Port already in use: Change BACKEND_PORT
# - Migration failed: Run migrations manually

# Fix database connection
docker-compose restart postgres
docker-compose up backend
```

#### 2. Frontend Build Fails

**Symptoms:**
- Build errors during docker-compose up
- "Module not found" errors

**Solutions:**
```bash
# Clear build cache
docker-compose build --no-cache frontend

# Check environment variables
docker-compose config | grep NEXT_PUBLIC

# Reinstall dependencies
docker-compose run frontend bun install

# Check for syntax errors
docker-compose run frontend bun run build
```

#### 3. Database Connection Issues

**Symptoms:**
- "FATAL: database does not exist"
- "connection refused"

**Solutions:**
```bash
# Check database is running
docker-compose ps postgres

# Recreate database
docker-compose down -v
docker-compose up postgres

# Verify connection
docker-compose exec postgres psql -U sira_user -d sira_db -c "SELECT 1"
```

#### 4. SSL Certificate Issues

**Symptoms:**
- "NET::ERR_CERT_AUTHORITY_INVALID"
- "SSL handshake failed"

**Solutions:**
```bash
# Verify certificate
openssl s_client -connect sira.itsma3il.com:443 -servername sira.itsma3il.com

# Check certificate expiry
sudo certbot certificates

# Renew certificate
sudo certbot renew --force-renewal

# Restart nginx
docker-compose restart nginx
```

#### 5. Out of Memory

**Symptoms:**
- Containers killed
- "Cannot allocate memory"

**Solutions:**
```bash
# Check memory usage
docker stats

# Increase Docker memory limit (Docker Desktop)
# Settings → Resources → Memory: 8GB+

# Reduce workers in production
# Backend: --workers 2 (instead of 4)

# Add swap space (Linux)
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Performance Issues

#### Slow API Response

**Diagnosis:**
```bash
# Check backend logs for slow queries
docker-compose logs backend | grep "duration"

# Monitor database connections
docker-compose exec postgres psql -U sira_user -d sira_db -c "SELECT COUNT(*) FROM pg_stat_activity;"

# Check Pinecone latency
# (Add logging in app/services/recommendation_service.py)
```

**Solutions:**
- Add database indexes for common queries
- Implement caching (Redis)
- Optimize Pinecone queries
- Scale backend workers

#### Frontend Slow Load

**Diagnosis:**
```bash
# Check bundle size
docker-compose run frontend bun run build

# Analyze bundle
docker-compose run frontend bun run analyze
```

**Solutions:**
- Code splitting
- Image optimization
- Enable caching
- Use CDN for static assets

---

## Rollback Procedures

### Application Rollback

```bash
# 1. Stop current version
docker-compose down

# 2. Checkout previous version
git checkout <previous-commit-hash>

# 3. Rebuild and start
docker-compose build
docker-compose up -d

# 4. Verify health
curl http://localhost:8000/health
curl http://localhost:3000
```

### Database Rollback

```bash
# 1. Stop application
docker-compose stop backend frontend

# 2. Rollback migration
docker-compose exec backend alembic downgrade -1

# Or to specific version
docker-compose exec backend alembic downgrade <revision_id>

# 3. Verify database state
docker-compose exec postgres psql -U sira_user -d sira_db -c "\dt"

# 4. Start application
docker-compose start backend frontend
```

### Full System Rollback

```bash
# 1. Stop all services
docker-compose down

# 2. Restore database backup
gunzip -c backup_20260129.sql.gz | docker-compose exec -T postgres psql -U sira_user -d sira_db

# 3. Restore uploads
tar -xzf uploads_backup_20260129.tar.gz -C backend/

# 4. Checkout stable version
git checkout stable

# 5. Rebuild and start
docker-compose build
docker-compose up -d
```

---

## Production Deployment Checklist

Use this checklist before deploying to production:

### Pre-Deployment

- [ ] All tests passing (100/110 minimum)
- [ ] Code reviewed and approved
- [ ] Environment variables configured
- [ ] SSL certificates obtained and configured
- [ ] Database backup completed
- [ ] Monitoring tools configured
- [ ] Rollback plan documented
- [ ] Team notified of deployment

### During Deployment

- [ ] Maintenance page enabled (if applicable)
- [ ] Database migrations executed successfully
- [ ] All services started without errors
- [ ] Health checks passing
- [ ] SSL redirects working
- [ ] API endpoints responding correctly
- [ ] Frontend loads successfully

### Post-Deployment

- [ ] Smoke tests passed
- [ ] User authentication working
- [ ] Profile creation functional
- [ ] Recommendations generating correctly
- [ ] Chat interface operational
- [ ] File uploads working
- [ ] Monitoring dashboards updated
- [ ] No critical errors in logs
- [ ] Response times acceptable
- [ ] SSL grade A+ on SSLLabs
- [ ] Team notified of successful deployment

### Rollback Triggers

Roll back immediately if:
- Critical functionality broken
- Error rate > 5%
- Response time > 5 seconds
- Database corruption detected
- Security vulnerability discovered

---

## Additional Resources

- **Architecture Documentation**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **API Reference**: [API_REFERENCE.md](./API_REFERENCE.md)
- **Database Schema**: [DATABASE.md](./DATABASE.md)
- **Developer Guide**: [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)
- **Security Checklist**: [SECURITY.md](./SECURITY.md)

---

**Last Updated:** January 30, 2026  
**Version:** 1.0.0  
**Maintainer:** DevOps Team  
**Questions?** devops@sira.platform
