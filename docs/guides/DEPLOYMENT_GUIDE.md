# SIRA Deployment Guide

**Last Updated**: January 29, 2026  
**Target Environments**: Development, Staging, Production

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Docker Deployment](#docker-deployment)
- [Production Deployment](#production-deployment)
- [Database Setup](#database-setup)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Monitoring & Logging](#monitoring--logging)
- [Backup Strategy](#backup-strategy)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Docker**: 24.0+ and Docker Compose 2.0+
- **Node.js**: 20+ (for frontend)
- **PostgreSQL**: 17+ (if not using Docker)
- **Git**: For cloning the repository

### Required Accounts

- **Clerk**: Authentication service (clerk.dev)
- **Mistral AI**: LLM API access (mistral.ai)
- **Pinecone**: Vector database (pinecone.io)

### System Requirements

**Minimum (Development):**
- CPU: 2 cores
- RAM: 4GB
- Storage: 10GB

**Recommended (Production):**
- CPU: 4+ cores
- RAM: 8GB+
- Storage: 50GB+ SSD

---

## Environment Configuration

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/sira.git
cd sira
```

### 2. Create Environment Files

#### Backend Environment (`.env` in `/backend/`)

```bash
# Application
APP_NAME=SIRA API
ENVIRONMENT=production  # development | staging | production

# Database
DATABASE_URL=postgresql+psycopg2://postgres:YOUR_PASSWORD@db:5432/sira

# Clerk Authentication
CLERK_JWKS_URL=https://YOUR_CLERK_DOMAIN.clerk.accounts.dev/.well-known/jwks.json
CLERK_FRONTEND_API=https://YOUR_CLERK_DOMAIN.clerk.accounts.dev

# CORS Origins (comma-separated)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=us-east-1-aws  # or your region
PINECONE_INDEX_NAME=sira-academic-programs

# Mistral AI Configuration
MISTRAL_API_KEY=your_mistral_api_key
MISTRAL_EMBEDDING_MODEL=mistral-embed
MISTRAL_LLM_MODEL=mistral-large-latest

# RAG Configuration
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
TOP_K_RESULTS=5
```

#### Frontend Environment (`.env.local` in `/frontend/`)

```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000  # Production: https://api.yourdomain.com

# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Application
NEXT_PUBLIC_APP_NAME=SIRA
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Production: https://yourdomain.com
```

### 3. Security Checklist

- [ ] Generate strong database passwords (min 32 characters)
- [ ] Use separate Clerk projects for dev/staging/prod
- [ ] Rotate API keys regularly
- [ ] Enable 2FA on all service accounts
- [ ] Restrict CORS origins to your domains only
- [ ] Use environment-specific API keys

---

## Docker Deployment

### Development Environment

#### 1. Start Services

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

#### 2. Verify Services

```bash
# Check running containers
docker-compose ps

# View logs
docker-compose logs -f

# Check specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

#### 3. Access Applications

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Database**: localhost:5432

#### 4. Run Migrations

```bash
# Run database migrations
docker-compose exec backend alembic upgrade head

# Create a new migration
docker-compose exec backend alembic revision --autogenerate -m "description"
```

#### 5. Ingest Sample Data

```bash
# Ingest academic programs into Pinecone
docker-compose exec backend python app/ingest_sample.py
```

### Production Environment

#### 1. Update docker-compose.prod.yml

```yaml
version: '3.8'

services:
  db:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: sira
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    env_file:
      - ./backend/.env
    environment:
      - DATABASE_URL=postgresql+psycopg2://postgres:${DB_PASSWORD}@db:5432/sira
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    ports:
      - "8000:8000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
        - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    ports:
      - "3000:3000"
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
```

#### 2. Deploy

```bash
# Pull latest changes
git pull origin main

# Set environment variables
export DB_PASSWORD="your_secure_password"
export NEXT_PUBLIC_API_BASE_URL="https://api.yourdomain.com"

# Build and deploy
docker-compose -f docker-compose.prod.yml up -d --build

# Check status
docker-compose -f docker-compose.prod.yml ps
```

---

## Production Deployment

### Option 1: Cloud Platform (Recommended)

#### AWS Deployment

**Services Used:**
- **ECS/Fargate**: Container orchestration
- **RDS PostgreSQL**: Managed database
- **Application Load Balancer**: Traffic distribution
- **CloudFront**: CDN for frontend
- **Route 53**: DNS management
- **Certificate Manager**: SSL/TLS certificates

**Setup Steps:**

1. **Create RDS Instance**
```bash
aws rds create-db-instance \
  --db-instance-identifier sira-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 17 \
  --master-username postgres \
  --master-user-password YOUR_PASSWORD \
  --allocated-storage 50 \
  --backup-retention-period 7
```

2. **Push Docker Images to ECR**
```bash
# Authenticate
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com

# Build and push backend
docker build -t sira-backend ./backend
docker tag sira-backend:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/sira-backend:latest
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/sira-backend:latest

# Build and push frontend
docker build -t sira-frontend ./frontend
docker tag sira-frontend:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/sira-frontend:latest
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/sira-frontend:latest
```

3. **Create ECS Task Definitions**
4. **Configure Load Balancer**
5. **Set up Auto Scaling**
6. **Configure CloudWatch Logging**

#### DigitalOcean App Platform

1. Connect GitHub repository
2. Configure build settings
3. Set environment variables
4. Configure managed PostgreSQL database
5. Enable automatic deployments

#### Vercel (Frontend) + Railway (Backend)

**Frontend (Vercel):**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod
```

**Backend (Railway):**
1. Connect GitHub repository
2. Configure environment variables
3. Add PostgreSQL plugin
4. Deploy

### Option 2: VPS Deployment

#### Requirements
- Ubuntu 22.04 LTS
- Docker & Docker Compose installed
- Nginx installed
- SSL certificate (Let's Encrypt)

#### Setup Steps

1. **Install Docker**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER
```

2. **Install Nginx**
```bash
sudo apt update
sudo apt install nginx
```

3. **Configure Firewall**
```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

4. **Clone and Deploy**
```bash
git clone https://github.com/yourusername/sira.git
cd sira
docker-compose -f docker-compose.prod.yml up -d
```

5. **Configure Nginx Reverse Proxy**
```nginx
# /etc/nginx/sites-available/sira
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

6. **Enable Site and Restart Nginx**
```bash
sudo ln -s /etc/nginx/sites-available/sira /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

7. **Set up SSL with Let's Encrypt**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Database Setup

### Initial Setup

1. **Run Migrations**
```bash
docker-compose exec backend alembic upgrade head
```

2. **Verify Tables**
```bash
docker-compose exec db psql -U postgres -d sira -c "\dt"
```

### Backup and Restore

#### Create Backup
```bash
# Automated daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T db pg_dump -U postgres sira > backup_$DATE.sql
gzip backup_$DATE.sql

# Keep only last 30 days
find . -name "backup_*.sql.gz" -mtime +30 -delete
```

#### Restore from Backup
```bash
gunzip backup_20260129_100000.sql.gz
docker-compose exec -T db psql -U postgres sira < backup_20260129_100000.sql
```

---

## SSL/TLS Configuration

### Let's Encrypt (Recommended)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (runs twice daily)
sudo systemctl status certbot.timer
```

### Custom Certificate

```nginx
ssl_certificate /path/to/certificate.crt;
ssl_certificate_key /path/to/private.key;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
ssl_prefer_server_ciphers on;
```

---

## Monitoring & Logging

### Application Logs

```bash
# View all logs
docker-compose logs -f

# Backend logs only
docker-compose logs -f backend

# Frontend logs only
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Health Checks

```bash
# Backend health
curl http://localhost:8000/health

# Frontend health
curl http://localhost:3000/

# Database health
docker-compose exec db pg_isready -U postgres
```

### Resource Monitoring

```bash
# Container stats
docker stats

# Disk usage
df -h

# Memory usage
free -h
```

### Production Monitoring Tools

- **Sentry**: Error tracking
- **DataDog**: Application monitoring
- **CloudWatch** (AWS): Logs and metrics
- **Prometheus + Grafana**: Metrics visualization

---

## Backup Strategy

### Database Backups

**Daily Automated Backups:**
```bash
# Add to crontab
0 2 * * * /path/to/backup-script.sh
```

**Backup Retention:**
- Daily backups: Keep 30 days
- Weekly backups: Keep 12 weeks
- Monthly backups: Keep 12 months

### File Uploads Backup

```bash
# Sync uploads directory to S3
aws s3 sync /app/uploads/ s3://your-bucket/uploads/ --delete
```

---

## Troubleshooting

### Common Issues

#### Database Connection Errors

```bash
# Check database is running
docker-compose ps db

# Check database logs
docker-compose logs db

# Test connection
docker-compose exec backend python -c "from app.db import get_engine; get_engine()"
```

#### Frontend Build Failures

```bash
# Clear Next.js cache
rm -rf frontend/.next
rm -rf frontend/node_modules
cd frontend && bun install

# Rebuild
docker-compose up --build frontend
```

#### Rate Limiting Issues

```bash
# Check rate limit headers
curl -I http://localhost:8000/api/profiles

# Clear rate limit (restart backend)
docker-compose restart backend
```

### Performance Tuning

#### Database Optimization
```sql
-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Analyze tables
ANALYZE;

-- Vacuum database
VACUUM ANALYZE;
```

#### Backend Optimization
```bash
# Increase worker processes in Dockerfile
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

---

## Security Checklist

- [ ] All environment variables set securely
- [ ] Database uses strong passwords
- [ ] SSL/TLS enabled and configured
- [ ] Firewall rules configured
- [ ] Regular security updates applied
- [ ] Backups automated and tested
- [ ] Monitoring and alerting configured
- [ ] API rate limiting enabled
- [ ] CORS properly configured
- [ ] File upload restrictions in place
- [ ] Secrets not committed to Git
- [ ] Production logs sanitized (no sensitive data)

---

## Maintenance

### Regular Tasks

**Daily:**
- Monitor error logs
- Check system health

**Weekly:**
- Review performance metrics
- Verify backups
- Update dependencies (security patches)

**Monthly:**
- Review and rotate access logs
- Update SSL certificates (if needed)
- Performance optimization review

---

## Support

For deployment issues:
- **Email**: devops@sira-academic.com
- **Documentation**: https://docs.sira-academic.com/deployment
- **GitHub Issues**: https://github.com/yourusername/sira/issues
