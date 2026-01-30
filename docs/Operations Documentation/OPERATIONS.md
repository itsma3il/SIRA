# SIRA Operations Manual

**Day-to-Day Operations Guide for SIRA Platform**

This manual covers all operational procedures for running and maintaining the SIRA platform in production, including routine maintenance, performance monitoring, resource management, and operational best practices.

---

## Table of Contents

- [Daily Operations](#daily-operations)
- [System Maintenance](#system-maintenance)
- [Performance Management](#performance-management)
- [Resource Monitoring](#resource-monitoring)
- [Backup Operations](#backup-operations)
- [Log Management](#log-management)
- [Service Management](#service-management)
- [Scaling Operations](#scaling-operations)
- [Emergency Procedures](#emergency-procedures)

---

## Daily Operations

### Morning Health Check (15 minutes)

**Checklist:**
```bash
# 1. Check all services are running
docker-compose ps

# Expected: All services "Up" status
# frontend, backend, postgres, nginx (all healthy)

# 2. Verify application health
curl https://sira.itsma3il.com/health
# Expected: {"status": "healthy", "database": "connected", "timestamp": "..."}

# 3. Check error rates (last 24 hours)
docker-compose logs --since 24h backend | grep -c ERROR
# Expected: < 10 errors per day

# 4. Check resource usage
docker stats --no-stream
# Expected:
# - Backend CPU < 50%, Memory < 2GB
# - Frontend CPU < 30%, Memory < 1GB
# - Postgres CPU < 40%, Memory < 4GB

# 5. Verify backup completed
ls -lh /backups/ | head -n 5
# Expected: Recent backup from last night

# 6. Check disk space
df -h
# Expected: < 80% usage on all partitions
```

**Red Flags:**
- Any service showing "Restarting" or "Exited"
- Error rate > 20 in last 24 hours
- CPU consistently > 80%
- Memory usage > 90%
- Disk usage > 85%
- No recent backup file

**Response:**
- If any red flags, check [Troubleshooting](#troubleshooting) section
- Escalate to on-call engineer if unresolved within 30 minutes

### User Activity Monitoring

**Check Active Users:**
```bash
# Total registered users
docker-compose exec postgres psql -U sira_user -d sira_db -c \
  "SELECT COUNT(*) as total_users FROM users;"

# Active users (last 7 days)
docker-compose exec postgres psql -U sira_user -d sira_db -c \
  "SELECT COUNT(DISTINCT user_id) as active_users 
   FROM profiles 
   WHERE updated_at > NOW() - INTERVAL '7 days';"

# Recommendations generated today
docker-compose exec postgres psql -U sira_user -d sira_db -c \
  "SELECT COUNT(*) as recommendations_today 
   FROM recommendations 
   WHERE created_at::date = CURRENT_DATE;"
```

**Metrics to Track:**
- Daily active users (DAU)
- Weekly active users (WAU)
- Recommendations generated per day
- Average session duration
- User retention rate

### Evening Review (10 minutes)

```bash
# 1. Check API response times
docker-compose logs backend | grep "duration" | tail -n 100 | awk '{print $NF}' | sort -n | tail -n 10
# Expected: < 2000ms for 99th percentile

# 2. Review error log summary
docker-compose logs --since 24h backend | grep ERROR | sort | uniq -c | sort -rn
# Expected: No recurring errors

# 3. Confirm backup exists
ls -lh /backups/sira_db_$(date +%Y%m%d)*.sql.gz
# Expected: File exists, size > 1MB

# 4. Check certificate expiry
echo | openssl s_client -servername sira.itsma3il.com -connect sira.itsma3il.com:443 2>/dev/null | openssl x509 -noout -dates
# Expected: notAfter > 30 days from now
```

---

## System Maintenance

### Weekly Maintenance (30 minutes)

**Every Sunday at 2:00 AM UTC:**

```bash
#!/bin/bash
# weekly-maintenance.sh

# 1. Update system packages (if necessary)
echo "=== Updating system packages ==="
sudo apt-get update
sudo apt-get upgrade -y

# 2. Clean Docker resources
echo "=== Cleaning Docker resources ==="
docker system prune -f
docker volume prune -f

# 3. Rotate logs
echo "=== Rotating logs ==="
find /var/log/sira -name "*.log" -mtime +30 -delete
docker-compose logs --tail=1000 > /var/log/sira/docker_$(date +%Y%m%d).log

# 4. Analyze database performance
echo "=== Database maintenance ==="
docker-compose exec -T postgres psql -U sira_user -d sira_db <<EOF
  VACUUM ANALYZE;
  REINDEX DATABASE sira_db;
EOF

# 5. Update dependencies (review before applying)
echo "=== Checking dependency updates ==="
cd /path/to/sira/backend && uv pip list --outdated
cd /path/to/sira/frontend && bun outdated

# 6. Test backups
echo "=== Testing backup restoration (dry run) ==="
./scripts/test-backup-restore.sh --dry-run

# 7. Generate weekly report
echo "=== Generating weekly report ==="
./scripts/generate-weekly-report.sh

echo "=== Weekly maintenance complete ==="
```

**Automation:**
```bash
# Add to crontab
sudo crontab -e

# Add line:
0 2 * * 0 /path/to/sira/scripts/weekly-maintenance.sh >> /var/log/sira/maintenance.log 2>&1
```

### Monthly Maintenance (1-2 hours)

**First Sunday of each month:**

1. **Security Updates**
   ```bash
   # Update all dependencies
   cd backend && uv pip install --upgrade $(uv pip list --format=freeze | cut -d= -f1)
   cd frontend && bun update
   
   # Scan for vulnerabilities
   bun audit
   docker scan sira-backend:latest
   docker scan sira-frontend:latest
   ```

2. **SSL Certificate Renewal**
   ```bash
   # Check expiry
   sudo certbot certificates
   
   # Renew if needed (auto-renews at 30 days)
   sudo certbot renew
   
   # Restart nginx
   docker-compose restart nginx
   ```

3. **Database Optimization**
   ```bash
   # Analyze query performance
   docker-compose exec postgres psql -U sira_user -d sira_db -c \
     "SELECT query, calls, total_time, mean_time 
      FROM pg_stat_statements 
      ORDER BY total_time DESC 
      LIMIT 20;"
   
   # Check index usage
   docker-compose exec postgres psql -U sira_user -d sira_db -c \
     "SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
      FROM pg_stat_user_indexes 
      ORDER BY idx_scan ASC 
      LIMIT 20;"
   ```

4. **Capacity Planning Review**
   - Review resource trends (CPU, memory, disk)
   - Forecast growth for next 3 months
   - Adjust resource allocations if needed

5. **Test Disaster Recovery**
   - Full backup restoration to test environment
   - Verify all functionality works
   - Document any issues

### Quarterly Maintenance (4-8 hours)

1. **Major Dependency Updates**
   - Review release notes for Next.js, FastAPI, Python, Node.js
   - Test in staging environment
   - Deploy to production

2. **Performance Audit**
   - Load testing with realistic traffic
   - Identify bottlenecks
   - Optimize slow queries
   - Review and update caching strategies

3. **Security Audit**
   - Penetration testing (internal or external)
   - Review access logs for anomalies
   - Update security policies
   - Rotate API keys and secrets

4. **Documentation Review**
   - Update all documentation
   - Review and update runbooks
   - Update architecture diagrams

---

## Performance Management

### Response Time Monitoring

**Target SLAs:**
- API endpoints: < 500ms (p95), < 2s (p99)
- Page load: < 2s (p95), < 5s (p99)
- Database queries: < 100ms (p95)
- Recommendation generation: < 30s

**Monitoring Commands:**
```bash
# Check API response times (last hour)
docker-compose logs --since 1h backend | \
  grep "duration" | \
  awk '{print $NF}' | \
  sort -n | \
  awk 'BEGIN {c=0; sum=0} {a[c++]=$1; sum+=$1} END {
    print "Min: " a[0] "ms";
    print "Median: " a[int(c/2)] "ms";
    print "P95: " a[int(c*0.95)] "ms";
    print "P99: " a[int(c*0.99)] "ms";
    print "Max: " a[c-1] "ms";
    print "Avg: " sum/c "ms";
  }'

# Slow query detection (PostgreSQL)
docker-compose exec postgres psql -U sira_user -d sira_db -c \
  "SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
   FROM pg_stat_activity 
   WHERE (now() - pg_stat_activity.query_start) > interval '5 seconds' 
     AND state = 'active';"
```

### Database Performance

**Key Metrics:**
```bash
# Connection count
docker-compose exec postgres psql -U sira_user -d sira_db -c \
  "SELECT COUNT(*) FROM pg_stat_activity;"
# Expected: < 20 connections

# Cache hit ratio (should be > 99%)
docker-compose exec postgres psql -U sira_user -d sira_db -c \
  "SELECT 
     sum(heap_blks_read) as heap_read,
     sum(heap_blks_hit) as heap_hit,
     sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
   FROM pg_statio_user_tables;"

# Table bloat
docker-compose exec postgres psql -U sira_user -d sira_db -c \
  "SELECT schemaname, tablename, 
     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
   FROM pg_tables 
   WHERE schemaname = 'public' 
   ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

**Performance Tuning:**
```bash
# If cache hit ratio < 99%, increase shared_buffers
# Edit postgresql.conf:
shared_buffers = 512MB  # Increase from default

# If slow queries persist, analyze and optimize
docker-compose exec postgres psql -U sira_user -d sira_db -c \
  "EXPLAIN ANALYZE SELECT * FROM profiles WHERE user_id = '...';"
```

### Application Performance

**Backend Optimization:**
```python
# Enable query logging for slow queries
# app/db.py
from sqlalchemy import event

@event.listens_for(Engine, "before_cursor_execute")
def log_slow_queries(conn, cursor, statement, parameters, context, executemany):
    conn.info.setdefault('query_start_time', []).append(time.time())

@event.listens_for(Engine, "after_cursor_execute")
def log_query_duration(conn, cursor, statement, parameters, context, executemany):
    total = time.time() - conn.info['query_start_time'].pop()
    if total > 0.1:  # Log queries > 100ms
        logger.warning(f"Slow query ({total:.3f}s): {statement}")
```

**Frontend Optimization:**
- Enable Next.js caching headers
- Optimize images (use next/image)
- Code splitting (dynamic imports)
- Prefetch critical routes

---

## Resource Monitoring

### CPU & Memory

**Real-Time Monitoring:**
```bash
# All containers
docker stats

# Specific service
docker stats sira-backend

# Historical data (if Prometheus configured)
# Open Grafana: http://localhost:3001
# Dashboard: "SIRA Resource Usage"
```

**Resource Limits:**
```yaml
# docker-compose.prod.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Disk Space Management

**Check Usage:**
```bash
# Overall disk usage
df -h

# Docker volume usage
docker system df -v

# Largest directories
du -h --max-depth=1 /var/lib/docker | sort -hr | head -n 10

# Application uploads
du -h backend/uploads/
```

**Cleanup:**
```bash
# Remove old uploads (older than 90 days)
find backend/uploads/transcripts -mtime +90 -type f -delete

# Remove old Docker logs
truncate -s 0 $(docker inspect --format='{{.LogPath}}' sira-backend)
truncate -s 0 $(docker inspect --format='{{.LogPath}}' sira-frontend)

# Clean Docker system
docker system prune -a --volumes -f
```

### Network Monitoring

**Connection Tracking:**
```bash
# Active connections to backend
netstat -an | grep :8000 | wc -l

# Active connections to frontend
netstat -an | grep :3000 | wc -l

# Database connections
docker-compose exec postgres psql -U sira_user -d sira_db -c \
  "SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;"
```

---

## Backup Operations

### Daily Automated Backup

**Script Location:** `/path/to/sira/scripts/backup-database.sh`

```bash
#!/bin/bash
# backup-database.sh

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="sira_db_${DATE}.sql.gz"
RETENTION_DAYS=7

# Create backup
docker-compose exec -T postgres pg_dump -U sira_user sira_db | gzip > "${BACKUP_DIR}/${FILENAME}"

# Verify backup
if [ $? -eq 0 ] && [ -s "${BACKUP_DIR}/${FILENAME}" ]; then
    echo "[$(date)] Backup successful: ${FILENAME}" >> /var/log/sira/backup.log
    
    # Remove old backups
    find "${BACKUP_DIR}" -name "sira_db_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
    
    # Optional: Upload to cloud storage
    # aws s3 cp "${BACKUP_DIR}/${FILENAME}" s3://sira-backups/
else
    echo "[$(date)] Backup FAILED!" >> /var/log/sira/backup.log
    # Send alert
    curl -X POST https://alerts.sira.platform/webhook \
      -d '{"message": "Database backup failed!", "severity": "critical"}'
fi
```

**Cron Schedule:**
```bash
# Daily at 2 AM
0 2 * * * /path/to/sira/scripts/backup-database.sh
```

### Manual Backup

```bash
# Full database backup
docker-compose exec postgres pg_dump -U sira_user sira_db > manual_backup_$(date +%Y%m%d).sql

# Backup with compression
docker-compose exec postgres pg_dump -U sira_user sira_db | gzip > manual_backup_$(date +%Y%m%d).sql.gz

# Backup specific tables
docker-compose exec postgres pg_dump -U sira_user -d sira_db -t profiles -t recommendations > profiles_backup.sql

# Backup uploads directory
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz backend/uploads/
```

### Restore Operations

** CAUTION: Restoration will overwrite current data!**

```bash
# 1. Create safety backup FIRST
docker-compose exec postgres pg_dump -U sira_user sira_db > safety_backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Stop application (prevent writes during restore)
docker-compose stop backend frontend

# 3. Restore from backup
gunzip -c backup_20260130.sql.gz | docker-compose exec -T postgres psql -U sira_user -d sira_db

# 4. Verify restoration
docker-compose exec postgres psql -U sira_user -d sira_db -c "\dt"
docker-compose exec postgres psql -U sira_user -d sira_db -c "SELECT COUNT(*) FROM profiles;"

# 5. Restart application
docker-compose start backend frontend

# 6. Test functionality
curl https://sira.itsma3il.com/health
```

---

## Log Management

### Log Locations

```bash
# Application logs (Docker)
docker-compose logs backend > backend.log
docker-compose logs frontend > frontend.log

# Nginx access logs
tail -f nginx/logs/access.log

# Nginx error logs
tail -f nginx/logs/error.log

# PostgreSQL logs
docker-compose exec postgres cat /var/lib/postgresql/data/log/postgresql-*.log

# System logs (Docker host)
journalctl -u docker.service -f
```

### Log Aggregation

**Daily Log Export:**
```bash
#!/bin/bash
# export-logs.sh

LOG_DIR="/var/log/sira"
DATE=$(date +%Y%m%d)

# Export Docker logs
docker-compose logs --tail=5000 backend > "${LOG_DIR}/backend_${DATE}.log"
docker-compose logs --tail=5000 frontend > "${LOG_DIR}/frontend_${DATE}.log"

# Compress old logs
find "${LOG_DIR}" -name "*.log" -mtime +1 -exec gzip {} \;

# Remove very old logs (30+ days)
find "${LOG_DIR}" -name "*.log.gz" -mtime +30 -delete
```

### Log Analysis

**Common Queries:**
```bash
# Error count by type (last 24 hours)
docker-compose logs --since 24h backend | grep ERROR | cut -d: -f3 | sort | uniq -c | sort -rn

# Top 10 slowest API endpoints
docker-compose logs backend | grep "duration" | awk '{print $(NF-1), $NF}' | sort -k2 -rn | head -n 10

# Failed authentication attempts
docker-compose logs backend | grep "401" | wc -l

# 500 errors (last hour)
docker-compose logs --since 1h backend | grep "500 Internal" | wc -l
```

---

## Service Management

### Starting Services

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d backend

# Start with specific profile (e.g., monitoring)
docker-compose --profile monitoring up -d

# Force recreate containers
docker-compose up -d --force-recreate
```

### Stopping Services

```bash
# Stop all services (graceful shutdown)
docker-compose down

# Stop specific service
docker-compose stop backend

# Stop and remove volumes ( deletes database data!)
docker-compose down -v

# Emergency stop (immediate, may cause data loss)
docker-compose kill
```

### Restarting Services

```bash
# Restart all services
docker-compose restart

# Restart specific service (zero-downtime)
docker-compose restart backend

# Rolling restart (one at a time)
for service in backend frontend postgres; do
    docker-compose restart $service
    sleep 10  # Wait for health check
done
```

### Updating Services

```bash
# 1. Pull latest changes
git pull origin main

# 2. Rebuild images
docker-compose build

# 3. Zero-downtime deployment
docker-compose up -d --no-deps --build backend
docker-compose up -d --no-deps --build frontend

# 4. Run database migrations (if any)
docker-compose exec backend alembic upgrade head

# 5. Verify health
curl https://sira.itsma3il.com/health
```

---

## Scaling Operations

### Horizontal Scaling (Multiple Instances)

**Backend Scaling:**
```yaml
# docker-compose.prod.yml
services:
  backend:
    deploy:
      replicas: 3  # Run 3 backend instances
```

**Load Balancing (Nginx):**
```nginx
upstream backend {
    least_conn;  # Use least-connection algorithm
    server backend-1:8000 weight=2;
    server backend-2:8000 weight=2;
    server backend-3:8000 weight=1;
}
```

### Vertical Scaling (More Resources)

```yaml
# docker-compose.prod.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '4.0'      # Increase from 2.0
          memory: 8G       # Increase from 2G
        reservations:
          cpus: '2.0'
          memory: 4G
  
  postgres:
    deploy:
      resources:
        limits:
          cpus: '4.0'
          memory: 8G       # More memory = better cache
```

### Database Scaling

**Read Replicas (Future Enhancement):**
```yaml
services:
  postgres-primary:
    image: postgres:17-alpine
    environment:
      POSTGRES_REPLICATION_MODE: master
  
  postgres-replica-1:
    image: postgres:17-alpine
    environment:
      POSTGRES_REPLICATION_MODE: slave
      POSTGRES_MASTER_HOST: postgres-primary
```

**Connection Pooling:**
```python
# app/db.py
from sqlalchemy.pool import QueuePool

engine = create_async_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,        # Increase from default 5
    max_overflow=40,     # Allow up to 60 connections total
    pool_pre_ping=True,  # Verify connections before use
    pool_recycle=3600,   # Recycle connections after 1 hour
)
```

---

## Emergency Procedures

### Service Down

**Symptoms:**
- Health check fails
- Users report "Service Unavailable"
- 502/503 errors

**Response:**
```bash
# 1. Check service status
docker-compose ps

# 2. View recent logs
docker-compose logs --tail=100 backend
docker-compose logs --tail=100 frontend

# 3. Restart affected service
docker-compose restart backend

# 4. If restart fails, rebuild
docker-compose up -d --force-recreate --build backend

# 5. Verify health
curl https://sira.itsma3il.com/health

# 6. If still failing, rollback
git checkout HEAD~1
docker-compose up -d --build
```

### Database Emergency

**Symptoms:**
- "Connection refused" errors
- Slow queries
- Database corruption

**Response:**
```bash
# 1. Check database is running
docker-compose ps postgres

# 2. Check connection count
docker-compose exec postgres psql -U sira_user -d sira_db -c \
  "SELECT COUNT(*) FROM pg_stat_activity;"

# 3. Kill long-running queries
docker-compose exec postgres psql -U sira_user -d sira_db -c \
  "SELECT pg_terminate_backend(pid) 
   FROM pg_stat_activity 
   WHERE pid <> pg_backend_pid() 
     AND state = 'active' 
     AND query_start < NOW() - INTERVAL '5 minutes';"

# 4. Restart database (if needed)
docker-compose restart postgres

# 5. Check for corruption
docker-compose exec postgres psql -U sira_user -d sira_db -c "VACUUM ANALYZE;"
```

### Out of Disk Space

**Response:**
```bash
# 1. Check disk usage
df -h

# 2. Find largest consumers
du -h --max-depth=1 / | sort -hr | head -n 20

# 3. Clean Docker
docker system prune -a --volumes -f

# 4. Remove old logs
find /var/log -name "*.log" -mtime +7 -delete

# 5. Remove old backups
find /backups -name "*.sql.gz" -mtime +14 -delete

# 6. Clean uploads
find backend/uploads/transcripts -mtime +90 -type f -delete
```

---

## Additional Resources

- **Deployment Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Monitoring Guide**: [MONITORING.md](./MONITORING.md)
- **Incident Runbooks**: [INCIDENT_RUNBOOKS.md](./INCIDENT_RUNBOOKS.md)
- **Security Guide**: [SECURITY.md](./SECURITY.md)
- **Troubleshooting**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

**Last Updated:** January 30, 2026  
**Version:** 1.0.0  
**Operations Team:** ops@sira.platform  
**On-Call:** +1-XXX-XXX-XXXX
