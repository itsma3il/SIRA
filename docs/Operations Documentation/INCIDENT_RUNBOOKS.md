# Incident Response Runbooks

## Overview
This document contains step-by-step procedures for responding to common production incidents in SIRA.

---

## 🔴 Critical Incidents

### 1. Application Down / 5xx Errors

**Symptoms**:
- Health check endpoint returning 503/500
- Users unable to access application
- Monitoring alerts: "APIDown" or "HighErrorRate"

**Immediate Actions**:

1. **Check Service Status**:
```bash
docker-compose -f docker-compose.prod.yml ps
```

2. **Check Logs**:
```bash
# Backend logs
docker logs sira_backend_prod --tail=100

# Frontend logs
docker logs sira_frontend_prod --tail=100

# Nginx logs
docker logs sira_nginx_prod --tail=100
```

3. **Restart Services**:
```bash
# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend

# Or restart all services
docker-compose -f docker-compose.prod.yml restart
```

4. **Verify Health**:
```bash
curl https://api.yourdomain.com/health
curl https://yourdomain.com
```

**Root Cause Investigation**:
- Check Grafana dashboard for resource usage spikes
- Review error logs for stack traces
- Check database connection status
- Verify external dependencies (Mistral AI, Pinecone)

**Prevention**:
- Implement auto-restart policies (already configured)
- Add more comprehensive error handling
- Increase resource limits if needed

---

### 2. Database Connection Failure

**Symptoms**:
- Backend logs show "connection refused" or "timeout"
- Monitoring alert: "DatabaseDown"
- All API requests failing

**Immediate Actions**:

1. **Check Database Status**:
```bash
docker-compose -f docker-compose.prod.yml ps db
docker logs sira_db_prod --tail=50
```

2. **Check Database Health**:
```bash
docker exec sira_db_prod pg_isready -U postgres
```

3. **Restart Database** (if not responding):
```bash
docker-compose -f docker-compose.prod.yml restart db
```

4. **Check Connection Pool**:
```bash
# Inside database container
docker exec -it sira_db_prod psql -U postgres -d sira -c "SELECT count(*) FROM pg_stat_activity;"
```

5. **Verify Backend Reconnects**:
```bash
docker logs sira_backend_prod --tail=20 | grep -i "database\|connection"
```

**Root Cause Investigation**:
- Check disk space: `df -h`
- Review PostgreSQL logs for errors
- Check connection pool exhaustion
- Verify database resource usage in Grafana

**Recovery**:
```bash
# If data corruption suspected, restore from backup
./scripts/restore_db.sh /backups/latest_backup.sql.gz
```

**Prevention**:
- Monitor connection pool usage
- Implement connection retry logic
- Regular database maintenance (VACUUM, ANALYZE)

---

### 3. High Response Times / Performance Degradation

**Symptoms**:
- Monitoring alert: "HighResponseTime" (p95 > 2s)
- Users reporting slow loading
- Increased request queue

**Immediate Actions**:

1. **Check System Resources**:
```bash
# CPU usage
docker stats --no-stream

# Memory usage
free -h

# Disk I/O
iostat -x 1 5
```

2. **Identify Slow Queries**:
```bash
# PostgreSQL slow queries
docker exec -it sira_db_prod psql -U postgres -d sira -c "
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 seconds' 
AND state = 'active';
"
```

3. **Check Backend Workers**:
```bash
# View Uvicorn worker processes
docker exec sira_backend_prod ps aux | grep uvicorn
```

4. **Temporary Mitigation**:
```bash
# Increase backend workers (if CPU available)
# Edit docker-compose.prod.yml, increase workers
# Then restart:
docker-compose -f docker-compose.prod.yml up -d backend
```

**Root Cause Investigation**:
- Check Grafana for resource bottlenecks
- Review API endpoint performance metrics
- Analyze database query performance
- Check external API latency (Mistral, Pinecone)

**Long-term Solutions**:
- Add database indexes (already done in migration 005)
- Implement Redis caching
- Optimize slow queries
- Horizontal scaling (multiple backend instances)

---

### 4. SSL Certificate Expiration

**Symptoms**:
- Browser shows "Your connection is not private"
- Monitoring alert: Certificate expiring soon
- curl returns SSL error

**Immediate Actions**:

1. **Check Certificate Expiration**:
```bash
echo | openssl s_client -servername yourdomain.com -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates
```

2. **Renew Let's Encrypt Certificate**:
```bash
# Stop nginx temporarily
docker-compose -f docker-compose.prod.yml stop nginx

# Renew certificate
sudo certbot renew

# Copy new certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/

# Restart nginx
docker-compose -f docker-compose.prod.yml start nginx
```

3. **Verify New Certificate**:
```bash
./scripts/ssl_validation.sh yourdomain.com
```

**Prevention**:
- Set up auto-renewal cron job (already documented)
- Monitor certificate expiration (30-day warning)
- Test renewal in staging first

---

## 🟡 High Priority Incidents

### 5. High Error Rate (2-5%)

**Symptoms**:
- Monitoring alert: "HighErrorRate"
- Increased 4xx/5xx responses
- Some users experiencing errors

**Investigation Steps**:

1. **Identify Error Types**:
```bash
# Check recent errors in logs
docker logs sira_backend_prod --tail=200 | grep -i "error\|exception"

# Group by status code
docker logs sira_nginx_prod --tail=1000 | awk '{print $9}' | sort | uniq -c | sort -rn
```

2. **Check Specific Endpoints**:
```bash
# Find failing endpoints
docker logs sira_nginx_prod --tail=1000 | grep " 5[0-9][0-9] " | awk '{print $7}' | sort | uniq -c | sort -rn
```

3. **Review Application Logs**:
```bash
# Backend application errors
docker exec sira_backend_prod tail -f /app/logs/app.log
```

**Common Causes**:
- Invalid user input (4xx errors) - needs better validation
- External service timeout (Mistral/Pinecone)
- Database query errors
- Authentication failures

**Resolution**:
- Fix validation logic for 4xx errors
- Implement retry logic for external services
- Optimize failing queries
- Check authentication configuration

---

### 6. Disk Space Running Low

**Symptoms**:
- Monitoring alert: "DiskSpaceLow" (<20%)
- Application slowdown
- Log write failures

**Immediate Actions**:

1. **Check Disk Usage**:
```bash
df -h
du -sh /* | sort -rh | head -10
```

2. **Clear Old Logs**:
```bash
# Nginx logs
find logs/nginx -type f -name "*.log" -mtime +7 -delete

# Backend logs
find logs/backend -type f -name "*.log" -mtime +7 -delete

# Docker logs
docker system prune -a --volumes --force
```

3. **Clear Old Backups**:
```bash
# Keep only last 7 days (already configured in backup script)
find /backups -name "sira_*.sql.gz" -mtime +7 -delete
```

4. **Check Volume Usage**:
```bash
docker system df
```

**Prevention**:
- Implement log rotation
- Automate backup cleanup
- Monitor disk usage proactively
- Set up alerts at 70% usage

---

### 7. Memory Exhaustion

**Symptoms**:
- OOM (Out of Memory) errors in logs
- Services being killed
- System slow to respond

**Immediate Actions**:

1. **Check Memory Usage**:
```bash
free -h
docker stats --no-stream
```

2. **Identify Memory Hog**:
```bash
# Process memory usage
ps aux --sort=-%mem | head -10

# Docker container memory
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}"
```

3. **Restart High-Memory Service**:
```bash
docker-compose -f docker-compose.prod.yml restart backend
```

4. **Check for Memory Leaks**:
```bash
# Monitor over time
watch -n 5 'docker stats --no-stream sira_backend_prod'
```

**Prevention**:
- Review application for memory leaks
- Implement proper garbage collection
- Adjust resource limits in docker-compose.prod.yml
- Add memory usage monitoring

---

## 🟢 Low Priority Incidents

### 8. Slow Recommendation Generation

**Symptoms**:
- Monitoring alert: "SlowRecommendationGeneration" (>5s)
- Users complaining about slow responses

**Investigation**:

1. **Check AI Service Status**:
```bash
# Test Mistral AI connectivity
curl -H "Authorization: Bearer $MISTRAL_API_KEY" https://api.mistral.ai/v1/models

# Test Pinecone connectivity
curl -H "Api-Key: $PINECONE_API_KEY" https://$PINECONE_HOST/describe_index_stats
```

2. **Review Recommendation Logs**:
```bash
docker logs sira_backend_prod | grep -i "recommendation\|llama\|mistral"
```

**Resolution**:
- Check external service status pages
- Implement caching for recommendations
- Reduce query complexity
- Optimize vector search parameters

---

### 9. Failed Backup

**Symptoms**:
- Backup cron job failed
- No recent backup files

**Recovery**:

1. **Manual Backup**:
```bash
docker exec sira-backend /app/scripts/backup_db.sh
```

2. **Verify Backup**:
```bash
ls -lh /backups/sira_*.sql.gz | tail -5
```

3. **Test Backup Integrity**:
```bash
# Check if backup is valid gzip
gzip -t /backups/latest_backup.sql.gz
```

**Prevention**:
- Monitor backup job execution
- Set up backup success/failure alerts
- Test restore procedure monthly

---

## Escalation Procedures

### Severity Levels

**P0 - Critical (Immediate Response)**:
- Application completely down
- Data breach
- Database corruption
- **Response Time**: 15 minutes
- **Escalation**: Immediately page on-call engineer

**P1 - High (Urgent Response)**:
- Partial outage
- High error rate (>5%)
- Performance severely degraded
- **Response Time**: 1 hour
- **Escalation**: Contact engineering lead

**P2 - Medium (Standard Response)**:
- Minor errors
- Performance issues for some users
- Non-critical feature broken
- **Response Time**: 4 hours
- **Escalation**: Create ticket, assign to team

**P3 - Low (Scheduled Response)**:
- Minor bugs
- Enhancement requests
- Documentation issues
- **Response Time**: Next business day

### Contact Information

| Role | Contact | Escalation Path |
|------|---------|-----------------|
| On-Call Engineer | oncall@yourdomain.com | → Engineering Lead |
| Engineering Lead | lead@yourdomain.com | → CTO |
| Database Admin | dba@yourdomain.com | → Engineering Lead |
| Security Team | security@yourdomain.com | → CISO |
| DevOps | devops@yourdomain.com | → Engineering Lead |

---

## Post-Incident Review

After resolving any P0 or P1 incident, conduct a post-incident review:

1. **Document Timeline**:
   - When incident detected
   - When response started
   - When resolved
   - Total downtime

2. **Root Cause Analysis**:
   - What caused the incident?
   - Why weren't we alerted sooner?
   - What prevented faster resolution?

3. **Action Items**:
   - Preventive measures
   - Monitoring improvements
   - Documentation updates
   - Process improvements

4. **Share Learnings**:
   - Update runbooks
   - Team briefing
   - Documentation updates

---

## Useful Commands Quick Reference

```bash
# View all services
docker-compose -f docker-compose.prod.yml ps

# Restart all services
docker-compose -f docker-compose.prod.yml restart

# View logs (last 100 lines)
docker logs <container_name> --tail=100 --follow

# Check health endpoints
curl https://api.yourdomain.com/health
curl https://api.yourdomain.com/health/system

# Database backup
docker exec sira-backend /app/scripts/backup_db.sh

# Database restore
docker exec sira-backend /app/scripts/restore_db.sh /backups/<file>.sql.gz

# Check disk usage
df -h
docker system df

# Check memory usage
free -h
docker stats --no-stream

# Monitor metrics
# Grafana: http://localhost:3001
# Prometheus: http://localhost:9090
```

---

**Last Updated**: 2026-01-29  
**Next Review**: Quarterly (after each incident)
