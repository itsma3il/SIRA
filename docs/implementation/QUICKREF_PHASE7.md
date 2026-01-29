# Phase 7 Quick Reference Guide

**Feedback & Quality Monitoring Implementation**

---

## 🎯 Quick Access

### Admin Dashboard
```
URL: http://localhost:3000/dashboard/admin
```

### API Endpoints

#### Feedback Analytics
```bash
# Get feedback trends
GET /api/admin/feedback/trends?days=30

# Get low-rated recommendations
GET /api/admin/feedback/low-rated?threshold=2&limit=50

# Get improvement suggestions
GET /api/admin/feedback/improvement-areas
```

#### System Health
```bash
# System resources
GET /health/system

# Performance metrics
GET /health/performance

# Liveness/Readiness
GET /health/live
GET /health/ready
```

---

## 📊 Key Metrics

### Quality Metrics
- **Average Rating:** Target >4.0/5.0
- **Feedback Rate:** Target >20%
- **Low-Rated Count:** Alert if >5
- **Error Rate:** Target <1%

### Performance Metrics
- **Response Time:** Target <10 seconds
- **CPU Usage:** Alert if >90%
- **Memory Usage:** Alert if >90%
- **Disk Usage:** Alert if >85%

---

## 🔧 Common Tasks

### Check Feedback Analytics
```typescript
// Frontend
import { api } from '@/lib/api';

const token = await getToken();
const trends = await api.admin.getFeedbackTrends(token, 30);
console.log('Average rating:', trends.average_rating);
console.log('Feedback rate:', trends.feedback_rate);
```

### Review Low-Rated Recommendations
```typescript
const lowRated = await api.admin.getLowRatedRecommendations(token, {
  threshold: 2,
  limit: 20
});
```

### Check System Health
```bash
curl http://localhost:8000/health/system
```

### View Logs
```bash
# Backend logs
docker-compose logs -f backend

# Filter for specific events
docker-compose logs backend | grep "LLM_CALL"
docker-compose logs backend | grep "RETRIEVAL_QUERY"
docker-compose logs backend | grep "USER_FEEDBACK"
```

---

## 🛠️ Integration Snippets

### Add Logging to Service
```python
from app.services.logging_service import LoggingService

logging_service = LoggingService()

# Log LLM call
logging_service.log_llm_call(
    model="mistral-large",
    prompt_length=len(prompt),
    response_length=len(response),
    latency_ms=elapsed_time,
    user_id=str(user_id)
)

# Log retrieval
logging_service.log_retrieval_query(
    query=query_text,
    num_results=len(results),
    top_score=max(scores) if scores else None,
    latency_ms=elapsed_time,
    user_id=str(user_id)
)
```

### Use Execution Time Decorator
```python
from app.services.logging_service import log_execution_time

@log_execution_time("generate_recommendation")
async def generate_recommendation(profile_id: UUID):
    # Automatically logs execution time
    pass
```

### Submit Feedback (Frontend)
```typescript
import { api } from '@/lib/api';

await api.recommendations.submitFeedback(token, recommendationId, {
  feedback_rating: 4,
  feedback_comment: "Very helpful!"
});
```

---

## 📁 File Locations

### Backend
```
backend/app/
├── services/
│   ├── feedback_service.py      # Feedback analytics
│   └── logging_service.py       # Logging utilities
├── middleware/
│   └── logging_middleware.py    # HTTP logging
├── utils/
│   └── monitoring.py            # System monitoring
└── api/routes/
    ├── admin.py                 # Admin endpoints
    └── health.py                # Health checks
```

### Frontend
```
frontend/
├── app/dashboard/(with-sidebar)/admin/
│   ├── page.tsx                 # Main dashboard
│   ├── profiles/page.tsx        # Profiles list
│   ├── sessions/page.tsx        # Sessions list
│   └── recommendations/page.tsx # Recommendations list
├── lib/api/
│   └── admin.service.ts         # Admin API client
└── components/
    └── feedback-modal.tsx       # Feedback UI
```

---

## 🚨 Troubleshooting

### Issue: Admin dashboard shows 403 Forbidden
**Solution:** Check if your email is in admin list
```python
# backend/app/api/routes/admin.py
admin_emails = ["your-email@example.com"]
```

### Issue: psutil import error
**Solution:** Install dependency
```bash
cd backend
uv add psutil
# or
pip install psutil==6.1.1
```

### Issue: Logs not appearing
**Solution:** Check logging level
```python
# backend/app/services/logging_service.py
logging.basicConfig(level=logging.INFO)  # Change to DEBUG for more
```

### Issue: Feedback not saving
**Solution:** Check recommendation endpoint logs
```bash
docker-compose logs backend | grep "feedback"
```

---

## 📈 Analytics Queries

### Get Rating Distribution
```sql
SELECT 
  feedback_rating,
  COUNT(*) as count
FROM recommendations
WHERE feedback_rating IS NOT NULL
GROUP BY feedback_rating
ORDER BY feedback_rating;
```

### Find Low-Rated Recommendations
```sql
SELECT 
  r.id,
  r.feedback_rating,
  r.feedback_comment,
  p.profile_name,
  u.email
FROM recommendations r
JOIN profiles p ON r.profile_id = p.id
JOIN users u ON p.user_id = u.id
WHERE r.feedback_rating <= 2
ORDER BY r.created_at DESC
LIMIT 20;
```

### Calculate Average Rating
```sql
SELECT 
  ROUND(AVG(feedback_rating), 2) as avg_rating,
  COUNT(*) as total_feedback
FROM recommendations
WHERE feedback_rating IS NOT NULL
  AND created_at >= NOW() - INTERVAL '30 days';
```

---

## 🎓 Best Practices

### 1. Regular Monitoring
- Check admin dashboard daily
- Review low-rated recommendations weekly
- Monitor system health continuously

### 2. Log Analysis
- Use structured logging for easy parsing
- Set up log aggregation (Datadog, Sentry)
- Create alerts for critical errors

### 3. Feedback Collection
- Encourage users to provide feedback
- Keep feedback form simple (5-star + optional comment)
- Thank users for feedback

### 4. Quality Improvement
- Review improvement areas monthly
- A/B test prompt changes
- Track impact of changes on ratings

### 5. Performance Optimization
- Monitor response times
- Optimize slow queries
- Cache frequently accessed data

---

## 🔗 Related Documentation

- [Phase 7 Implementation Summary](./phase7_implementation_summary.md)
- [Detailed Development Plan](./.planning/detailed_development_plan.md)
- [Admin API Documentation](./admin-api-docs.md)
- [Logging Best Practices](./logging-best-practices.md)

---

## 📞 Support

### Issues & Questions
- Check logs: `docker-compose logs backend`
- Review error messages in admin dashboard
- Consult implementation summary document

### Development
- Use logging service for debugging
- Monitor system health during development
- Test feedback flow end-to-end

---

**Last Updated:** January 29, 2026  
**Version:** 1.0
