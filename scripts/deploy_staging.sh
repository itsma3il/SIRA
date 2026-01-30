#!/bin/bash
#
# Staging Deployment Script for SIRA
# Deploys application to staging environment for validation
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
STAGING_ENV=".env.staging"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  SIRA Staging Deployment${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check prerequisites
echo -e "${YELLOW}>>> Checking Prerequisites${NC}\n"

if [ ! -f "${STAGING_ENV}" ]; then
    echo -e "${RED}✗ Staging environment file not found${NC}"
    echo "Copy .env.staging.example to .env.staging and configure"
    exit 1
fi
echo -e "${GREEN}✓ Staging environment file found${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker installed${NC}"

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ Docker Compose not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose installed${NC}"

# Validate environment
echo -e "\n${YELLOW}>>> Validating Environment Configuration${NC}\n"
if python3 scripts/validate_env.py "${STAGING_ENV}"; then
    echo -e "${GREEN}✓ Environment validation passed${NC}"
else
    echo -e "${RED}✗ Environment validation failed${NC}"
    exit 1
fi

# Stop existing staging deployment
echo -e "\n${YELLOW}>>> Stopping Existing Deployment${NC}\n"
docker-compose -f docker-compose.prod.yml --env-file "${STAGING_ENV}" down || true
echo -e "${GREEN}✓ Stopped existing services${NC}"

# Pull latest changes (if in git repo)
if [ -d ".git" ]; then
    echo -e "\n${YELLOW}>>> Pulling Latest Changes${NC}\n"
    git pull origin main || echo -e "${YELLOW}⚠ Could not pull latest changes${NC}"
fi

# Build Docker images
echo -e "\n${YELLOW}>>> Building Docker Images${NC}\n"
docker-compose -f docker-compose.prod.yml --env-file "${STAGING_ENV}" build
echo -e "${GREEN}✓ Docker images built${NC}"

# Start services
echo -e "\n${YELLOW}>>> Starting Services${NC}\n"
docker-compose -f docker-compose.prod.yml --env-file "${STAGING_ENV}" up -d
echo -e "${GREEN}✓ Services started${NC}"

# Wait for services to be healthy
echo -e "\n${YELLOW}>>> Waiting for Services to be Ready${NC}\n"
sleep 10

# Check service health
echo "Checking service health..."
for i in {1..30}; do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health | grep -q "200"; then
        echo -e "${GREEN}✓ Backend is healthy${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}✗ Backend failed to start${NC}"
        docker logs sira_backend_prod --tail=50
        exit 1
    fi
    echo "Waiting for backend... ($i/30)"
    sleep 2
done

# Run database migrations
echo -e "\n${YELLOW}>>> Running Database Migrations${NC}\n"
docker exec sira_backend_prod alembic upgrade head
echo -e "${GREEN}✓ Migrations completed${NC}"

# Run smoke tests
echo -e "\n${YELLOW}>>> Running Smoke Tests${NC}\n"
if ./scripts/smoke_test.sh; then
    echo -e "${GREEN}✓ Smoke tests passed${NC}"
else
    echo -e "${RED}✗ Smoke tests failed${NC}"
    echo "Review logs and fix issues before production deployment"
    exit 1
fi

# Run migration tests
echo -e "\n${YELLOW}>>> Testing Database Migrations${NC}\n"
cd backend
if python3 ../scripts/test_migrations.py; then
    echo -e "${GREEN}✓ Migration tests passed${NC}"
else
    echo -e "${RED}✗ Migration tests failed${NC}"
    cd ..
    exit 1
fi
cd ..

# Create backup
echo -e "\n${YELLOW}>>> Creating Initial Backup${NC}\n"
docker exec sira-backend /app/scripts/backup_db.sh
echo -e "${GREEN}✓ Backup created${NC}"

# Display service status
echo -e "\n${YELLOW}>>> Service Status${NC}\n"
docker-compose -f docker-compose.prod.yml --env-file "${STAGING_ENV}" ps

# Display access information
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}  Staging Deployment Complete${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo "Access Points:"
echo -e "  Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "  Backend API: ${GREEN}http://localhost:8000${NC}"
echo -e "  API Docs: ${GREEN}http://localhost:8000/docs${NC}"
echo -e "  Health Check: ${GREEN}http://localhost:8000/health${NC}"
echo ""

echo "Monitoring (if enabled with --profile monitoring):"
echo -e "  Grafana: ${GREEN}http://localhost:3001${NC} (admin/admin)"
echo -e "  Prometheus: ${GREEN}http://localhost:9090${NC}"
echo ""

echo "Next Steps:"
echo "  1. Test all critical user flows"
echo "  2. Run load tests: locust -f scripts/load_test.py --host=http://localhost:8000"
echo "  3. Review logs: docker logs sira_backend_prod --follow"
echo "  4. Monitor metrics in Grafana"
echo "  5. If all tests pass, proceed to production deployment"
echo ""

echo "To view logs:"
echo "  docker logs sira_backend_prod --follow"
echo "  docker logs sira_frontend_prod --follow"
echo ""

echo "To stop staging:"
echo "  docker-compose -f docker-compose.prod.yml --env-file ${STAGING_ENV} down"
echo ""
