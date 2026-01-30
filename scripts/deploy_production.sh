#!/bin/bash
#
# Production Deployment Script for SIRA
# CRITICAL: Only run after staging validation
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_ROOT="/home/ismail/Master_Project/SIRA"
PRODUCTION_ENV=".env.production"

echo -e "${RED}========================================${NC}"
echo -e "${RED}  SIRA PRODUCTION DEPLOYMENT${NC}"
echo -e "${RED}========================================${NC}\n"

echo -e "${YELLOW}⚠  WARNING: This will deploy to PRODUCTION${NC}"
echo -e "${YELLOW}   Ensure all pre-deployment checks are complete${NC}\n"

# Confirmation
read -p "Have you completed staging validation? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^yes$ ]]; then
    echo -e "${YELLOW}Deployment cancelled. Complete staging validation first.${NC}"
    exit 0
fi

read -p "Type 'DEPLOY TO PRODUCTION' to continue: " -r
echo
if [[ ! $REPLY == "DEPLOY TO PRODUCTION" ]]; then
    echo -e "${YELLOW}Deployment cancelled.${NC}"
    exit 0
fi

# Pre-deployment checklist
echo -e "\n${BLUE}>>> Pre-Deployment Checklist${NC}\n"

CHECKS_PASSED=0
CHECKS_TOTAL=10

check_item() {
    local description="$1"
    read -p "$description (yes/no): " -r
    if [[ $REPLY =~ ^yes$ ]]; then
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗ Failed: $description${NC}"
        return 1
    fi
}

check_item "All tests passing in staging" || exit 1
check_item "Security scan completed and passed" || exit 1
check_item "SSL certificates obtained and installed" || exit 1
check_item "Environment variables configured" || exit 1
check_item "Database backup completed" || exit 1
check_item "Load testing completed successfully" || exit 1
check_item "Monitoring configured and tested" || exit 1
check_item "Incident runbooks reviewed" || exit 1
check_item "Rollback plan documented" || exit 1
check_item "Team notified of deployment" || exit 1

echo ""
echo -e "Checklist: ${CHECKS_PASSED}/${CHECKS_TOTAL} items completed"

if [ "$CHECKS_PASSED" -ne "$CHECKS_TOTAL" ]; then
    echo -e "${RED}✗ Pre-deployment checklist incomplete${NC}"
    exit 1
fi

# Validate environment
echo -e "\n${YELLOW}>>> Validating Production Environment${NC}\n"
if python3 scripts/validate_env.py "${PRODUCTION_ENV}"; then
    echo -e "${GREEN}✓ Environment validation passed${NC}"
else
    echo -e "${RED}✗ Environment validation failed${NC}"
    exit 1
fi

# Create pre-deployment backup
echo -e "\n${YELLOW}>>> Creating Pre-Deployment Backup${NC}\n"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
if docker exec sira-backend /app/scripts/backup_db.sh 2>/dev/null; then
    echo -e "${GREEN}✓ Pre-deployment backup created${NC}"
else
    echo -e "${YELLOW}⚠ No existing deployment to backup (first deployment)${NC}"
fi

# Build production images
echo -e "\n${YELLOW}>>> Building Production Docker Images${NC}\n"
docker-compose -f docker-compose.prod.yml --env-file "${PRODUCTION_ENV}" build
echo -e "${GREEN}✓ Production images built${NC}"

# Stop existing services (if any)
echo -e "\n${YELLOW}>>> Stopping Existing Services${NC}\n"
docker-compose -f docker-compose.prod.yml --env-file "${PRODUCTION_ENV}" down || true
echo -e "${GREEN}✓ Existing services stopped${NC}"

# Start new deployment
echo -e "\n${YELLOW}>>> Starting Production Services${NC}\n"
docker-compose -f docker-compose.prod.yml --env-file "${PRODUCTION_ENV}" up -d
echo -e "${GREEN}✓ Production services started${NC}"

# Wait for services
echo -e "\n${YELLOW}>>> Waiting for Services to be Ready${NC}\n"
sleep 15

for i in {1..60}; do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health | grep -q "200"; then
        echo -e "${GREEN}✓ Backend is healthy${NC}"
        break
    fi
    if [ $i -eq 60 ]; then
        echo -e "${RED}✗ Backend failed to start${NC}"
        echo "Rolling back..."
        docker-compose -f docker-compose.prod.yml --env-file "${PRODUCTION_ENV}" down
        echo "Check logs: docker logs sira_backend_prod --tail=100"
        exit 1
    fi
    echo "Waiting for backend... ($i/60)"
    sleep 2
done

# Run database migrations
echo -e "\n${YELLOW}>>> Running Database Migrations${NC}\n"
if docker exec sira_backend_prod alembic upgrade head; then
    echo -e "${GREEN}✓ Migrations completed${NC}"
else
    echo -e "${RED}✗ Migrations failed${NC}"
    echo "Rolling back deployment..."
    docker-compose -f docker-compose.prod.yml --env-file "${PRODUCTION_ENV}" down
    exit 1
fi

# Run smoke tests
echo -e "\n${YELLOW}>>> Running Production Smoke Tests${NC}\n"
if API_BASE_URL="http://localhost:8000" WEB_BASE_URL="http://localhost:3000" ./scripts/smoke_test.sh; then
    echo -e "${GREEN}✓ Smoke tests passed${NC}"
else
    echo -e "${RED}✗ Smoke tests failed${NC}"
    echo "Review logs immediately"
    echo "Consider rollback if issues persist"
    exit 1
fi

# Start monitoring (if not already running)
echo -e "\n${YELLOW}>>> Starting Monitoring Stack${NC}\n"
docker-compose -f docker-compose.prod.yml --env-file "${PRODUCTION_ENV}" --profile monitoring up -d
echo -e "${GREEN}✓ Monitoring stack started${NC}"

# Post-deployment backup
echo -e "\n${YELLOW}>>> Creating Post-Deployment Backup${NC}\n"
docker exec sira-backend /app/scripts/backup_db.sh
echo -e "${GREEN}✓ Post-deployment backup created${NC}"

# Display deployment summary
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  PRODUCTION DEPLOYMENT SUCCESSFUL${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo "Deployment Time: $(date)"
echo ""

echo "Service Status:"
docker-compose -f docker-compose.prod.yml --env-file "${PRODUCTION_ENV}" ps
echo ""

echo "Access Points:"
echo -e "  Production URL: ${GREEN}https://yourdomain.com${NC}"
echo -e "  API URL: ${GREEN}https://api.yourdomain.com${NC}"
echo -e "  Health Check: ${GREEN}https://api.yourdomain.com/health${NC}"
echo ""

echo "Monitoring:"
echo -e "  Grafana: ${GREEN}http://your-server:3001${NC}"
echo -e "  Prometheus: ${GREEN}http://your-server:9090${NC}"
echo ""

echo "Post-Deployment Tasks:"
echo "  ✓ Monitor error rates for 1 hour"
echo "  ✓ Check Grafana dashboards"
echo "  ✓ Verify user flows"
echo "  ✓ Monitor resource usage"
echo "  ✓ Check backup automation"
echo ""

echo "If Issues Occur:"
echo "  1. Check logs: docker logs sira_backend_prod --follow"
echo "  2. Review Grafana alerts"
echo "  3. Rollback: docker-compose -f docker-compose.prod.yml down"
echo "  4. Restore backup: ./scripts/restore_db.sh /backups/sira_${TIMESTAMP}.sql.gz"
echo ""

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo "Continue monitoring for the next hour."
