# Production Monitoring Configuration

## Overview
This directory contains configuration files for monitoring SIRA in production.

## Components

### 1. Prometheus (Metrics Collection)
- **File**: `prometheus.yml`
- **Purpose**: Collects application and system metrics
- **Endpoints**:
  - Backend: `http://backend:8000/metrics`
  - PostgreSQL: `http://postgres-exporter:9187`
  - Nginx: `http://nginx-exporter:9113`

### 2. Grafana (Visualization)
- **File**: `grafana/dashboards/sira-dashboard.json`
- **Purpose**: Visualize metrics and create alerts
- **Default Dashboards**:
  - API Request Rates
  - Response Times (p50, p95, p99)
  - Error Rates
  - Database Connection Pool
  - CPU/Memory Usage
  - Recommendation Generation Times

### 3. Loki (Log Aggregation)
- **File**: `loki-config.yml`
- **Purpose**: Centralized log collection and querying
- **Sources**:
  - Backend application logs
  - Nginx access/error logs
  - PostgreSQL logs

### 4. Alertmanager (Alert Routing)
- **File**: `alertmanager.yml`
- **Purpose**: Route alerts to notification channels
- **Channels**:
  - Email
  - Slack (optional)
  - PagerDuty (optional)

## Quick Setup

### With Docker Compose

Add monitoring stack to your deployment:

```bash
# Start with monitoring
docker-compose -f docker-compose.prod.yml --profile monitoring up -d

# Access dashboards
# Grafana: http://localhost:3001 (admin/admin)
# Prometheus: http://localhost:9090
```

### Manual Setup

1. **Install Prometheus**:
```bash
# Download and run
wget https://github.com/prometheus/prometheus/releases/latest/download/prometheus-linux-amd64.tar.gz
tar xvfz prometheus-linux-amd64.tar.gz
cd prometheus-*
./prometheus --config.file=monitoring/prometheus.yml
```

2. **Install Grafana**:
```bash
# Ubuntu/Debian
sudo apt-get install -y software-properties-common
sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
sudo apt-get update
sudo apt-get install grafana

# Start service
sudo systemctl start grafana-server
```

3. **Install Loki**:
```bash
# Docker
docker run -d --name=loki -p 3100:3100 grafana/loki:latest -config.file=/etc/loki/local-config.yaml
```

## Metrics Instrumentation

### Backend (FastAPI)

Add Prometheus metrics to your FastAPI app:

```python
# backend/app/main.py
from prometheus_fastapi_instrumentator import Instrumentator

app = FastAPI()

# Enable metrics endpoint
Instrumentator().instrument(app).expose(app, endpoint="/metrics")
```

### Custom Metrics

Add custom business metrics:

```python
from prometheus_client import Counter, Histogram

# Define metrics
recommendations_generated = Counter(
    'sira_recommendations_generated_total',
    'Total number of recommendations generated'
)

recommendation_duration = Histogram(
    'sira_recommendation_duration_seconds',
    'Time to generate recommendations'
)

# Use in code
with recommendation_duration.time():
    # Generate recommendations
    recommendations = generate_recommendations(profile)
    recommendations_generated.inc(len(recommendations))
```

## Alert Rules

### Critical Alerts

1. **High Error Rate**:
   - Condition: Error rate > 5% for 5 minutes
   - Action: Page on-call engineer

2. **Database Down**:
   - Condition: Database unreachable
   - Action: Immediate page

3. **High Response Time**:
   - Condition: p95 latency > 2s for 5 minutes
   - Action: Slack notification

4. **Disk Space Low**:
   - Condition: Disk usage > 80%
   - Action: Email notification

### Warning Alerts

1. **Elevated Error Rate**:
   - Condition: Error rate > 2% for 10 minutes
   - Action: Slack notification

2. **Memory Usage High**:
   - Condition: Memory > 80% for 15 minutes
   - Action: Email notification

## Log Queries

### Useful Loki Queries

1. **All Backend Errors**:
```logql
{service="backend"} |= "ERROR"
```

2. **API Endpoint Errors**:
```logql
{service="backend"} |= "ERROR" | json | status >= 500
```

3. **Slow Queries**:
```logql
{service="backend"} |= "duration" | json | duration > 1000
```

4. **User Activity**:
```logql
{service="backend"} | json | user_id="<user_id>"
```

## Dashboard Customization

### Import SIRA Dashboard

1. Open Grafana (http://localhost:3001)
2. Go to Dashboards > Import
3. Upload `grafana/dashboards/sira-dashboard.json`
4. Select Prometheus data source
5. Click Import

### Create Custom Dashboard

1. Go to Dashboards > New Dashboard
2. Add Panel
3. Select Prometheus data source
4. Query examples:
   - Request rate: `rate(http_requests_total[5m])`
   - Error rate: `rate(http_requests_total{status=~"5.."}[5m])`
   - Latency: `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))`

## Retention Policies

### Prometheus
- **Retention**: 15 days
- **Storage**: `/prometheus/data`
- **Scrape Interval**: 15 seconds

### Loki
- **Retention**: 30 days
- **Storage**: `/loki/chunks`

### Grafana
- **Database**: SQLite (default) or PostgreSQL (recommended)
- **Storage**: `/var/lib/grafana`

## Backup

### Prometheus Snapshots
```bash
# Create snapshot
curl -XPOST http://localhost:9090/api/v1/admin/tsdb/snapshot

# Snapshots stored in /prometheus/data/snapshots/
```

### Grafana Dashboards
```bash
# Export all dashboards
curl -H "Authorization: Bearer <api_key>" \
  http://localhost:3001/api/search?type=dash-db | \
  jq -r '.[] | .uid' | \
  xargs -I {} curl -H "Authorization: Bearer <api_key>" \
  http://localhost:3001/api/dashboards/uid/{} > dashboard_{}.json
```

## Troubleshooting

### Prometheus Not Scraping

1. Check target status: http://localhost:9090/targets
2. Verify endpoint is accessible: `curl http://backend:8000/metrics`
3. Check firewall rules

### Grafana Data Source Connection Failed

1. Verify Prometheus URL in data source settings
2. Check network connectivity
3. Verify Prometheus is running

### High Cardinality Issues

If Prometheus performance degrades:
1. Review label usage (avoid high-cardinality labels like user_id)
2. Increase memory allocation
3. Reduce retention period

## Security

### Authentication

1. **Grafana**: Change default password (admin/admin)
2. **Prometheus**: Add basic auth via Nginx reverse proxy
3. **Alertmanager**: Configure webhook authentication

### Network Isolation

- Run monitoring stack in isolated network
- Use Nginx reverse proxy for external access
- Enable HTTPS for all dashboards

## Performance Tips

1. **Use recording rules** for frequently queried metrics
2. **Limit time series** by using appropriate labels
3. **Set up federation** for multi-cluster deployments
4. **Use remote write** for long-term storage (Thanos, Cortex)

## Next Steps

1. ✅ Set up basic monitoring stack
2. ⏳ Configure alerting rules
3. ⏳ Create custom dashboards for business metrics
4. ⏳ Set up log aggregation
5. ⏳ Configure alert notifications (email, Slack)
6. ⏳ Implement distributed tracing (Jaeger/Tempo)
