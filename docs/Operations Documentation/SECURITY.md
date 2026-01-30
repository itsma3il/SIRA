# SIRA Security Documentation

**Comprehensive Security Guide for SIRA Platform**

This document covers all security aspects of the SIRA platform, including authentication, authorization, data protection, security hardening, vulnerability management, and compliance.

---

## Table of Contents

- [Security Overview](#security-overview)
- [Authentication & Authorization](#authentication--authorization)
- [Data Security](#data-security)
- [API Security](#api-security)
- [Infrastructure Security](#infrastructure-security)
- [Security Hardening](#security-hardening)
- [Security Checklist](#security-checklist)
- [Incident Response](#incident-response)
- [Vulnerability Reporting](#vulnerability-reporting)
- [Compliance](#compliance)

---

## Security Overview

### Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User Layer                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│  │  Browser │◄───┤   HTTPS  │───►│  Clerk   │             │
│  └──────────┘    └──────────┘    └──────────┘             │
└─────────────────────────────────────────────────────────────┘
                            │
                   ┌────────▼────────┐
                   │  Rate Limiting  │
                   │  (Nginx + API)  │
                   └────────┬────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                       │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │   Frontend   │◄────────┤   Backend    │                 │
│  │  (Next.js)   │  JWT    │   (FastAPI)  │                 │
│  └──────────────┘         └──────┬───────┘                 │
│                                   │                          │
│         Input Validation │ Auth Middleware │ CORS           │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                        Data Layer                           │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│  │PostgreSQL│    │ Pinecone │    │ Mistral  │             │
│  │ Encrypted│    │ API Keys │    │ API Keys │             │
│  └──────────┘    └──────────┘    └──────────┘             │
└─────────────────────────────────────────────────────────────┘
```

### Security Principles

1. **Defense in Depth**: Multiple layers of security controls
2. **Least Privilege**: Minimal access rights for users and services
3. **Zero Trust**: Verify every request regardless of origin
4. **Secure by Default**: Security built into every component
5. **Privacy by Design**: Data protection integrated from the start

### Threat Model

**Identified Threats:**
- Unauthorized access to user data
- API abuse and DDoS attacks
- SQL injection and XSS attacks
- Man-in-the-middle attacks
- Credential stuffing and brute force
- Data exfiltration
- Malicious file uploads

**Mitigations:**
- Clerk authentication with JWT
- Rate limiting at multiple layers
- Input validation and sanitization
- SSL/TLS encryption
- Rate limiting on auth endpoints
- Database encryption at rest
- File type and size restrictions

---

## Authentication & Authorization

### Clerk Authentication

**Implementation:**
```typescript
// Frontend: app/layout.tsx
<ClerkProvider>
  <html lang="en">
    <body>{children}</body>
  </html>
</ClerkProvider>

// Protected route: app/dashboard/page.tsx
import { auth } from '@clerk/nextjs/server';

export default function Dashboard() {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');
  // ...
}
```

**Backend JWT Verification:**
```python
# app/api/deps.py
from clerk import verify_clerk_token

async def get_current_user_id(
    authorization: str = Header(None)
) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing authorization header")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        payload = verify_clerk_token(token)
        return payload["sub"]  # Clerk user ID
    except Exception:
        raise HTTPException(401, "Invalid token")
```

### Authorization Flow

```
1. User signs in via Clerk (frontend)
2. Clerk returns JWT token
3. Frontend stores token in memory (not localStorage)
4. Every API request includes: Authorization: Bearer <token>
5. Backend verifies JWT with Clerk public key
6. Backend extracts user_id from token
7. Backend performs action on behalf of user
```

### Security Features

**Multi-Factor Authentication (MFA):**
- Enable in Clerk dashboard
- SMS, authenticator app, or email
- Recommended for admin accounts

**Session Management:**
- Automatic session refresh
- Configurable session lifetime (default: 7 days)
- Revoke sessions on logout
- Force logout on password change

**Password Policy:**
Enforced by Clerk:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

---

## Data Security

### Data Classification

| Level | Examples | Protection |
|-------|----------|------------|
| **Public** | Marketing content | None required |
| **Internal** | Documentation | Authentication required |
| **Confidential** | User profiles, grades | Encryption + access control |
| **Restricted** | Payment info (future) | PCI-DSS compliance |

### Encryption

**Data at Rest:**
```bash
# PostgreSQL encryption
# Enable in postgresql.conf:
ssl = on
ssl_cert_file = '/path/to/server.crt'
ssl_key_file = '/path/to/server.key'

# Encrypt database backups
pg_dump sira_db | gpg --encrypt --recipient devops@sira.platform > backup.sql.gpg
```

**Data in Transit:**
- All connections use HTTPS (TLS 1.2+)
- Backend-to-Pinecone: HTTPS
- Backend-to-Mistral: HTTPS
- Frontend-to-Backend: HTTPS

**Field-Level Encryption (Optional):**
```python
# For highly sensitive fields (e.g., grades)
from cryptography.fernet import Fernet

def encrypt_field(value: str, key: bytes) -> str:
    f = Fernet(key)
    return f.encrypt(value.encode()).decode()

def decrypt_field(encrypted: str, key: bytes) -> str:
    f = Fernet(key)
    return f.decrypt(encrypted.encode()).decode()
```

### Data Retention

**User Data:**
- Active accounts: Indefinite
- Deleted accounts: 30-day grace period, then permanent deletion
- Anonymized analytics: 2 years

**Logs:**
- Application logs: 90 days
- Security logs: 1 year
- Audit logs: 7 years (compliance)

### GDPR Compliance

**User Rights:**
1. **Right to Access**: Users can download their data via API
2. **Right to Rectification**: Users can update their profiles
3. **Right to Erasure**: Users can request account deletion
4. **Right to Portability**: Export data in JSON format

**Implementation:**
```python
# app/api/routes/gdpr.py
@router.get("/me/export")
async def export_user_data(user_id: str = Depends(get_current_user_id)):
    """Export all user data in JSON format"""
    # Fetch all user-related data
    profiles = await get_user_profiles(user_id)
    recommendations = await get_user_recommendations(user_id)
    conversations = await get_user_conversations(user_id)
    
    return {
        "user_id": user_id,
        "profiles": profiles,
        "recommendations": recommendations,
        "conversations": conversations,
        "exported_at": datetime.utcnow().isoformat()
    }

@router.delete("/me")
async def delete_account(user_id: str = Depends(get_current_user_id)):
    """Permanently delete user account and all data"""
    # Soft delete (30-day grace period)
    await mark_user_for_deletion(user_id)
    return {"message": "Account scheduled for deletion in 30 days"}
```

---

## API Security

### Rate Limiting

**Implementation:**

**1. Nginx Layer (DDoS protection):**
```nginx
# nginx/nginx.conf
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=10r/m;

location /api {
    limit_req zone=api_limit burst=20 nodelay;
    limit_req_status 429;
    # ...
}

location ~ ^/api/(auth|login|register) {
    limit_req zone=auth_limit burst=5 nodelay;
    # ...
}
```

**2. Application Layer (Granular control):**
```python
# app/core/security.py
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

# Apply to FastAPI app
app.state.limiter = limiter

# Usage in routes
@router.post("/profiles")
@limiter.limit("20/minute")
async def create_profile(...):
    # ...
```

**Rate Limit Tiers:**

| Endpoint Category | Rate Limit | Burst | Why |
|-------------------|------------|-------|-----|
| General API | 100/min | 20 | Normal usage |
| Authentication | 10/min | 5 | Prevent brute force |
| Profile Operations | 20/min | 10 | Frequent updates |
| Recommendations | 5/min | 2 | CPU-intensive |
| File Uploads | 5/hour | 2 | Large payloads |

### Input Validation

**Automatic Validation (Pydantic):**
```python
# app/schemas/profile_schemas.py
from pydantic import BaseModel, Field, validator

class ProfileCreateSchema(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    gpa: float = Field(..., ge=0, le=20)
    budget_min: int = Field(..., gt=0)
    budget_max: int = Field(..., gt=0)
    
    @validator('budget_max')
    def validate_budget(cls, v, values):
        if 'budget_min' in values and v < values['budget_min']:
            raise ValueError('budget_max must be >= budget_min')
        return v
    
    @validator('name')
    def sanitize_name(cls, v):
        # Remove potentially dangerous characters
        return v.strip().replace('<', '').replace('>', '')
```

**File Upload Validation:**
```python
# app/api/routes/upload.py
ALLOWED_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def validate_file(file: UploadFile):
    # Check extension
    ext = file.filename.split('.')[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"File type .{ext} not allowed")
    
    # Check size
    file.file.seek(0, 2)  # Seek to end
    size = file.file.tell()
    file.file.seek(0)  # Reset
    
    if size > MAX_FILE_SIZE:
        raise HTTPException(400, f"File size exceeds {MAX_FILE_SIZE} bytes")
    
    # Check magic bytes (verify actual file type)
    header = file.file.read(8)
    file.file.seek(0)
    
    if ext == 'pdf' and not header.startswith(b'%PDF'):
        raise HTTPException(400, "File is not a valid PDF")
    
    return True
```

### SQL Injection Prevention

**Using SQLAlchemy ORM:**
```python
#  SAFE: Parameterized queries
from sqlalchemy import select

stmt = select(Profile).where(Profile.user_id == user_id)
profiles = await session.execute(stmt)

#  SAFE: ORM operations
profile = Profile(user_id=user_id, name=name, gpa=gpa)
session.add(profile)

#  UNSAFE: Raw SQL with string formatting (NEVER DO THIS)
query = f"SELECT * FROM profiles WHERE user_id = '{user_id}'"  # VULNERABLE!
```

### XSS Prevention

**Frontend Sanitization:**
```typescript
// React automatically escapes JSX expressions
function ProfileCard({ profile }: { profile: Profile }) {
  // This is safe - React escapes HTML
  return <h1>{profile.name}</h1>;
  
  // Use dangerouslySetInnerHTML ONLY with sanitized content
  // import DOMPurify from 'dompurify';
  // const clean = DOMPurify.sanitize(htmlString);
  // return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}
```

**Backend Sanitization:**
```python
import bleach

def sanitize_html(text: str) -> str:
    """Remove all HTML tags except safe ones"""
    allowed_tags = ['b', 'i', 'u', 'em', 'strong', 'p', 'br']
    return bleach.clean(text, tags=allowed_tags, strip=True)
```

### CORS Configuration

```python
# app/main.py
from fastapi.middleware.cors import CORSMiddleware

ALLOWED_ORIGINS = [
    "https://sira.itsma3il.com",      # Production
    "https://staging.sira.itsma3il.com",  # Staging
    "http://localhost:3000",            # Development
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],  # For file downloads
    max_age=3600,  # Cache preflight requests for 1 hour
)
```

---

## Infrastructure Security

### Docker Security

**1. Non-Root Users:**
```dockerfile
# backend/Dockerfile
FROM python:3.12-slim

# Create non-root user
RUN useradd -m -u 1000 sira && chown -R sira:sira /app
USER sira

# Run as non-root
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**2. Image Scanning:**
```bash
# Scan for vulnerabilities
docker scan sira-backend:latest
docker scan sira-frontend:latest

# Use Trivy for comprehensive scanning
trivy image sira-backend:latest
trivy image sira-frontend:latest
```

**3. Minimal Base Images:**
```dockerfile
# Use Alpine variants (smaller attack surface)
FROM python:3.12-alpine
FROM node:20-alpine
```

**4. Read-Only Filesystems:**
```yaml
# docker-compose.prod.yml
services:
  backend:
    read_only: true
    tmpfs:
      - /tmp
      - /app/.cache
```

### Network Security

**Docker Network Isolation:**
```yaml
# docker-compose.prod.yml
networks:
  frontend-network:
    driver: bridge
  backend-network:
    driver: bridge
  database-network:
    driver: bridge
    internal: true  # No external access

services:
  frontend:
    networks:
      - frontend-network
  
  backend:
    networks:
      - frontend-network
      - backend-network
      - database-network
  
  postgres:
    networks:
      - database-network  # Only accessible to backend
```

**Firewall Rules (UFW):**
```bash
# Allow only necessary ports
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Block direct access to backend/database
sudo ufw deny 8000/tcp
sudo ufw deny 5432/tcp
```

### Secrets Management

**Development:**
```bash
# Use .env files (NEVER commit to Git)
echo ".env*" >> .gitignore
```

**Production:**
```bash
# Option 1: Docker Secrets
echo "my_secret_password" | docker secret create db_password -

# docker-compose.prod.yml
services:
  backend:
    secrets:
      - db_password

secrets:
  db_password:
    external: true

# Access in application
with open('/run/secrets/db_password') as f:
    password = f.read().strip()
```

**Option 2: Environment Variables (Kubernetes):**
```yaml
# k8s-secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: sira-secrets
type: Opaque
data:
  database-password: <base64-encoded>
  mistral-api-key: <base64-encoded>
```

**Option 3: External Secrets Management:**
- AWS Secrets Manager
- HashiCorp Vault
- Azure Key Vault

### SSL/TLS Best Practices

**Nginx SSL Configuration:**
```nginx
# Strong TLS configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256...';
ssl_prefer_server_ciphers on;

# Enable OCSP stapling
ssl_stapling on;
ssl_stapling_verify on;

# HSTS (force HTTPS)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

**Test SSL Configuration:**
```bash
# Test with SSL Labs
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=sira.itsma3il.com

# Target: A+ rating

# Test with testssl.sh
testssl.sh https://sira.itsma3il.com
```

---

## Security Hardening

### Backend Hardening

**1. Disable Debug Mode:**
```python
# app/core/config.py
class Settings(BaseSettings):
    DEBUG: bool = False  # NEVER True in production
    LOG_LEVEL: str = "WARNING"  # INFO for staging, WARNING for prod
```

**2. Secure Headers:**
```python
# app/main.py
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware

# Only allow specific hosts
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["sira.itsma3il.com", "*.sira.itsma3il.com"]
)

# Compress responses
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Security headers
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response
```

**3. Error Handling (No Information Leakage):**
```python
# app/core/exceptions.py
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    # Log full error internally
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    # Return generic message to user (don't leak internals)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred. Please try again later."}
    )
```

### Database Hardening

**1. Least Privilege Principle:**
```sql
-- Create application user with limited permissions
CREATE USER sira_app WITH PASSWORD 'strong_password';

-- Grant only necessary permissions
GRANT CONNECT ON DATABASE sira_db TO sira_app;
GRANT USAGE ON SCHEMA public TO sira_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sira_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sira_app;

-- Revoke dangerous permissions
REVOKE CREATE ON SCHEMA public FROM sira_app;
REVOKE ALL ON TABLE pg_catalog.pg_user FROM sira_app;
```

**2. Connection Limits:**
```sql
-- Limit connections per user
ALTER USER sira_app CONNECTION LIMIT 20;
```

**3. Audit Logging:**
```sql
-- Enable query logging (postgresql.conf)
logging_collector = on
log_directory = 'pg_log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_statement = 'mod'  # Log all data-modifying statements
log_connections = on
log_disconnections = on
log_duration = on
```

### Frontend Hardening

**1. Content Security Policy (CSP):**
```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clerk.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self' data:;
      connect-src 'self' https://api.sira.itsma3il.com https://clerk.com;
      frame-src 'self' https://clerk.com;
    `.replace(/\s{2,}/g, ' ').trim()
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];

const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

**2. Subresource Integrity (SRI):**
```html
<!-- Verify external script integrity -->
<script 
  src="https://cdn.example.com/library.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/ux..."
  crossorigin="anonymous"
></script>
```

**3. Dependency Scanning:**
```bash
# Scan npm packages for vulnerabilities
bun audit

# Fix vulnerabilities
bun audit fix

# Alternative: npm audit
npm audit
npm audit fix
```

---

## Security Checklist

### Pre-Deployment Security Checklist

Use this checklist before every production deployment:

#### **Authentication & Authorization**
- [ ] Clerk authentication configured correctly
- [ ] JWT verification working on all protected endpoints
- [ ] Session timeouts configured (7 days max)
- [ ] MFA enabled for admin accounts
- [ ] Password policy enforced (8+ chars, complexity)

#### **API Security**
- [ ] Rate limiting enabled (Nginx + Application)
- [ ] CORS configured with whitelist of allowed origins
- [ ] Input validation on all endpoints (Pydantic schemas)
- [ ] File upload restrictions enforced (types, size)
- [ ] SQL injection prevention verified (ORM only, no raw SQL)

#### **Data Security**
- [ ] Database connection encrypted (SSL)
- [ ] Sensitive data encrypted at rest (if applicable)
- [ ] All external API connections use HTTPS
- [ ] Backups encrypted and stored securely
- [ ] Data retention policy implemented

#### **Infrastructure**
- [ ] SSL/TLS certificates valid and auto-renewing
- [ ] SSL configuration rated A+ on SSL Labs
- [ ] Firewall rules configured (only 80/443 exposed)
- [ ] Docker containers run as non-root users
- [ ] Docker images scanned for vulnerabilities
- [ ] Secrets not hardcoded (environment variables only)

#### **Application Hardening**
- [ ] Debug mode disabled (`DEBUG=False`)
- [ ] Error messages don't leak internal info
- [ ] Security headers configured (CSP, X-Frame-Options, etc.)
- [ ] Logging configured (but no sensitive data logged)
- [ ] Dependencies up to date (no known vulnerabilities)

#### **Monitoring**
- [ ] Health check endpoints working
- [ ] Error tracking configured (Sentry)
- [ ] Log aggregation configured
- [ ] Alerts configured for critical errors
- [ ] Performance monitoring enabled

#### **Compliance**
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] GDPR data export/deletion implemented
- [ ] Cookie consent banner (if applicable)
- [ ] Data processing agreement signed (with Clerk, Pinecone, Mistral)

#### **Backup & Recovery**
- [ ] Database backups automated (daily minimum)
- [ ] Backup restoration tested successfully
- [ ] Rollback procedure documented and tested
- [ ] Disaster recovery plan documented

#### **Documentation**
- [ ] Security documentation up to date
- [ ] Incident response plan documented
- [ ] Security contact info published
- [ ] Vulnerability reporting process published

---

## Incident Response

### Incident Response Plan

**Phases:**
1. **Preparation**: Ready before incidents occur
2. **Detection**: Identify security incidents
3. **Containment**: Limit damage
4. **Eradication**: Remove threat
5. **Recovery**: Restore systems
6. **Lessons Learned**: Improve processes

### Detection

**Indicators of Compromise (IOCs):**
- Sudden spike in failed login attempts
- Unusual API usage patterns
- Database queries taking longer than normal
- Unexpected data exports
- Alerts from monitoring tools

**Monitoring Tools:**
```bash
# Real-time log monitoring
docker-compose logs -f | grep -E "ERROR|CRITICAL|401|403|500"

# Check for brute force attempts
docker-compose exec postgres psql -U sira_user -d sira_db -c "
  SELECT user_id, COUNT(*) 
  FROM audit_log 
  WHERE action = 'login_failed' 
    AND created_at > NOW() - INTERVAL '1 hour'
  GROUP BY user_id 
  HAVING COUNT(*) > 10;
"
```

### Containment

**Immediate Actions:**

```bash
# 1. Block attacker IP (if identified)
sudo ufw deny from <attacker-ip>

# 2. Revoke compromised user sessions
# Via Clerk dashboard or API

# 3. Rotate compromised secrets
# - Generate new MISTRAL_API_KEY
# - Generate new SECRET_KEY
# - Update environment variables
docker-compose down
# Update .env
docker-compose up -d

# 4. Enable maintenance mode (if needed)
# Update Nginx to return 503 for all requests
```

### Communication

**Notification Template:**

```
Subject: Security Incident - [SEVERITY] - [DATE]

Summary:
We detected a [BRIEF DESCRIPTION] on [DATE] at [TIME].

Impact:
- [WHAT DATA/SYSTEMS AFFECTED]
- [NUMBER OF USERS AFFECTED]
- [CURRENT STATUS]

Actions Taken:
- [IMMEDIATE CONTAINMENT STEPS]
- [REMEDIATION IN PROGRESS]

Next Steps:
- [WHAT WE'RE DOING]
- [WHAT USERS SHOULD DO]

Timeline:
- [INCIDENT DISCOVERED]: [TIME]
- [CONTAINMENT]: [TIME]
- [RESOLUTION ETA]: [TIME]

Contact:
security@sira.platform
```

### Post-Incident Review

**Required Documentation:**
1. Timeline of events
2. Root cause analysis
3. Impact assessment
4. Response effectiveness
5. Lessons learned
6. Preventive measures

---

## Vulnerability Reporting

### Responsible Disclosure Policy

We welcome reports of security vulnerabilities!

**Contact:**
- Email: security@sira.platform
- PGP Key: [Publish on website]

**What to Include:**
1. Description of vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested remediation (if any)

**Response Timeline:**
- Acknowledgment: Within 24 hours
- Initial assessment: Within 72 hours
- Resolution: Varies by severity (see below)

**Severity Levels:**

| Severity | Examples | Resolution SLA |
|----------|----------|----------------|
| **Critical** | Auth bypass, RCE | 24 hours |
| **High** | SQL injection, XSS | 7 days |
| **Medium** | CSRF, rate limit bypass | 30 days |
| **Low** | Info disclosure | 90 days |

**Rewards:**
- Public acknowledgment (Hall of Fame)
- Swag (stickers, t-shirt)
- Potential bounty (case-by-case)

**Out of Scope:**
- Automated scanners without validation
- Social engineering attacks
- Physical attacks
- DoS attacks
- Spam or social engineering content

---

## Compliance

### GDPR Compliance

**Data Controller:** SIRA Platform  
**DPO Contact:** privacy@sira.platform

**User Rights Implementation:**

```python
# app/api/routes/privacy.py

@router.get("/me/data-export")
async def export_data(user_id: str = Depends(get_current_user_id)):
    """Right to Data Portability (GDPR Art. 20)"""
    return await export_all_user_data(user_id)

@router.delete("/me/delete-account")
async def delete_account(user_id: str = Depends(get_current_user_id)):
    """Right to Erasure (GDPR Art. 17)"""
    await schedule_account_deletion(user_id, days=30)
    return {"message": "Account will be deleted in 30 days"}

@router.post("/me/data-rectification")
async def rectify_data(
    updates: ProfileUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """Right to Rectification (GDPR Art. 16)"""
    return await update_user_profile(user_id, updates)
```

### Data Processing Agreements

**Required with Third Parties:**
- [ ] Clerk (authentication)
- [ ] Pinecone (vector storage)
- [ ] Mistral AI (LLM processing)

**Ensure they provide:**
- GDPR compliance certification
- Sub-processor list
- Data transfer safeguards
- Security measures documentation

### Cookie Policy

**Cookies Used:**
- `__clerk_session` - Authentication (essential)
- `clerk_js_version` - SDK version (essential)
- `analytics_*` - Anonymous usage (optional, requires consent)

**Implementation:**
```typescript
// components/cookie-consent.tsx
'use client';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(true);

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShowBanner(false);
    // Enable optional cookies (analytics)
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4">
      <p>We use cookies to improve your experience. Essential cookies are required for the site to function.</p>
      <button onClick={acceptCookies}>Accept All</button>
      <button onClick={() => setShowBanner(false)}>Essential Only</button>
    </div>
  );
}
```

---

## Security Maintenance

### Regular Tasks

**Weekly:**
- [ ] Review application logs for anomalies
- [ ] Check for failed login attempts
- [ ] Verify backup integrity

**Monthly:**
- [ ] Update dependencies (`bun update`, `uv add <package>@latest`)
- [ ] Review and rotate API keys (if needed)
- [ ] Scan Docker images for vulnerabilities
- [ ] Review access logs

**Quarterly:**
- [ ] Security audit (internal or external)
- [ ] Penetration testing
- [ ] Update threat model
- [ ] Review and update security documentation

**Annually:**
- [ ] Comprehensive security assessment
- [ ] Disaster recovery drill
- [ ] Compliance audit (GDPR, etc.)
- [ ] Security training for team

---

## Additional Resources

- **Deployment Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **API Reference**: [API_REFERENCE.md](./API_REFERENCE.md)
- **Database Schema**: [DATABASE.md](./DATABASE.md)
- **Incident Runbooks**: [INCIDENT_RUNBOOKS.md](./INCIDENT_RUNBOOKS.md)

**External Resources:**
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- CWE Top 25: https://cwe.mitre.org/top25/
- NIST Cybersecurity Framework: https://www.nist.gov/cyberframework

---

**Last Updated:** January 30, 2026  
**Version:** 1.0.0  
**Security Contact:** security@sira.platform  
**Emergency:** critical-security@sira.platform
