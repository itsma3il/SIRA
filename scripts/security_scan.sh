#!/bin/bash
#
# Security Scanning Script for SIRA
# Runs multiple security checks
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="/home/ismail/Master_Project/SIRA"
REPORT_DIR="${PROJECT_ROOT}/security-reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  SIRA Security Scanning Suite${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Create reports directory
mkdir -p "${REPORT_DIR}"

# Track overall status
CRITICAL_ISSUES=0
HIGH_ISSUES=0
MEDIUM_ISSUES=0

# Function to print section header
print_section() {
    echo -e "\n${YELLOW}>>> $1${NC}\n"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

print_section "1. Python Dependency Vulnerability Scan (Safety)"

if command_exists safety; then
    echo "Running Safety scan..."
    safety check --json > "${REPORT_DIR}/safety_${TIMESTAMP}.json" 2>/dev/null || true
    
    if [ -s "${REPORT_DIR}/safety_${TIMESTAMP}.json" ]; then
        VULNERABILITIES=$(cat "${REPORT_DIR}/safety_${TIMESTAMP}.json" | grep -o '"vulnerabilities"' | wc -l)
        if [ "$VULNERABILITIES" -gt 0 ]; then
            echo -e "${RED}✗ Found vulnerabilities in Python dependencies${NC}"
            CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
        else
            echo -e "${GREEN}✓ No known vulnerabilities in Python dependencies${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠ Safety not installed. Install: pip install safety${NC}"
fi

print_section "2. Node.js Dependency Audit"

cd "${PROJECT_ROOT}/frontend"

if command_exists npm; then
    echo "Running npm audit..."
    npm audit --json > "${REPORT_DIR}/npm_audit_${TIMESTAMP}.json" 2>/dev/null || true
    
    CRITICAL=$(cat "${REPORT_DIR}/npm_audit_${TIMESTAMP}.json" | grep -o '"critical":[0-9]*' | grep -o '[0-9]*' || echo "0")
    HIGH=$(cat "${REPORT_DIR}/npm_audit_${TIMESTAMP}.json" | grep -o '"high":[0-9]*' | grep -o '[0-9]*' || echo "0")
    
    if [ "$CRITICAL" -gt 0 ]; then
        echo -e "${RED}✗ Found $CRITICAL critical vulnerabilities in npm packages${NC}"
        CRITICAL_ISSUES=$((CRITICAL_ISSUES + CRITICAL))
    elif [ "$HIGH" -gt 0 ]; then
        echo -e "${YELLOW}⚠ Found $HIGH high vulnerabilities in npm packages${NC}"
        HIGH_ISSUES=$((HIGH_ISSUES + HIGH))
    else
        echo -e "${GREEN}✓ No critical vulnerabilities in npm packages${NC}"
    fi
else
    echo -e "${YELLOW}⚠ npm not installed${NC}"
fi

cd "${PROJECT_ROOT}"

print_section "3. Docker Image Vulnerability Scan (Trivy)"

if command_exists trivy; then
    echo "Scanning backend Docker image..."
    docker build -t sira-backend:security-scan ./backend -f ./backend/Dockerfile.prod --quiet
    trivy image --severity CRITICAL,HIGH --format json \
        --output "${REPORT_DIR}/trivy_backend_${TIMESTAMP}.json" \
        sira-backend:security-scan 2>/dev/null || true
    
    echo "Scanning frontend Docker image..."
    docker build -t sira-frontend:security-scan ./frontend -f ./frontend/Dockerfile.prod --quiet
    trivy image --severity CRITICAL,HIGH --format json \
        --output "${REPORT_DIR}/trivy_frontend_${TIMESTAMP}.json" \
        sira-frontend:security-scan 2>/dev/null || true
    
    echo -e "${GREEN}✓ Docker image scans completed${NC}"
else
    echo -e "${YELLOW}⚠ Trivy not installed. Install: brew install aquasecurity/trivy/trivy${NC}"
fi

print_section "4. Secret Detection (TruffleHog)"

if command_exists trufflehog; then
    echo "Scanning for secrets in git history..."
    trufflehog git file://. --json > "${REPORT_DIR}/trufflehog_${TIMESTAMP}.json" 2>/dev/null || true
    
    SECRETS_FOUND=$(cat "${REPORT_DIR}/trufflehog_${TIMESTAMP}.json" | wc -l)
    if [ "$SECRETS_FOUND" -gt 0 ]; then
        echo -e "${RED}✗ Found potential secrets in codebase${NC}"
        CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
    else
        echo -e "${GREEN}✓ No secrets detected${NC}"
    fi
else
    echo -e "${YELLOW}⚠ TruffleHog not installed. Install: pip install trufflehog${NC}"
fi

print_section "5. Code Quality & Security Linting"

# Python (Bandit)
if command_exists bandit; then
    echo "Running Bandit security linter..."
    bandit -r backend/app -f json -o "${REPORT_DIR}/bandit_${TIMESTAMP}.json" 2>/dev/null || true
    
    HIGH_SEVERITY=$(cat "${REPORT_DIR}/bandit_${TIMESTAMP}.json" | grep -o '"issue_severity": "HIGH"' | wc -l || echo "0")
    if [ "$HIGH_SEVERITY" -gt 0 ]; then
        echo -e "${YELLOW}⚠ Found $HIGH_SEVERITY high severity issues in Python code${NC}"
        HIGH_ISSUES=$((HIGH_ISSUES + HIGH_SEVERITY))
    else
        echo -e "${GREEN}✓ No high severity issues in Python code${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Bandit not installed. Install: pip install bandit${NC}"
fi

# JavaScript/TypeScript (ESLint security plugin)
cd "${PROJECT_ROOT}/frontend"
if [ -f "node_modules/.bin/eslint" ]; then
    echo "Running ESLint security checks..."
    npm run lint > "${REPORT_DIR}/eslint_${TIMESTAMP}.txt" 2>&1 || true
    echo -e "${GREEN}✓ ESLint scan completed${NC}"
fi
cd "${PROJECT_ROOT}"

print_section "6. SSL/TLS Configuration Check"

echo "Checking SSL configuration..."
if [ -f "nginx/nginx.conf" ]; then
    # Check for weak ciphers
    if grep -q "RC4\|MD5\|DES" nginx/nginx.conf; then
        echo -e "${RED}✗ Weak ciphers detected in Nginx config${NC}"
        HIGH_ISSUES=$((HIGH_ISSUES + 1))
    else
        echo -e "${GREEN}✓ No weak ciphers in Nginx config${NC}"
    fi
    
    # Check TLS version
    if grep -q "TLSv1.2" nginx/nginx.conf && grep -q "TLSv1.3" nginx/nginx.conf; then
        echo -e "${GREEN}✓ Modern TLS versions configured${NC}"
    else
        echo -e "${YELLOW}⚠ TLS configuration should be reviewed${NC}"
    fi
fi

print_section "7. Environment Variable Security"

echo "Checking for exposed secrets..."
python3 scripts/validate_env.py 2>/dev/null || true

if [ -f ".env" ] || [ -f ".env.local" ]; then
    echo -e "${RED}✗ .env files found in repository${NC}"
    CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
else
    echo -e "${GREEN}✓ No .env files in repository${NC}"
fi

print_section "8. OWASP Dependency Check"

if command_exists dependency-check; then
    echo "Running OWASP Dependency Check..."
    dependency-check.sh --project SIRA \
        --scan "${PROJECT_ROOT}" \
        --format JSON \
        --out "${REPORT_DIR}/owasp_${TIMESTAMP}.json" \
        --exclude "**/node_modules/**" \
        --exclude "**/.venv/**" 2>/dev/null || true
    echo -e "${GREEN}✓ OWASP scan completed${NC}"
else
    echo -e "${YELLOW}⚠ OWASP Dependency Check not installed${NC}"
fi

# Summary
print_section "Security Scan Summary"

echo "Reports saved to: ${REPORT_DIR}/"
echo ""
echo "Issues Found:"
echo -e "  ${RED}Critical: $CRITICAL_ISSUES${NC}"
echo -e "  ${YELLOW}High: $HIGH_ISSUES${NC}"
echo -e "  ${BLUE}Medium: $MEDIUM_ISSUES${NC}"
echo ""

if [ "$CRITICAL_ISSUES" -gt 0 ]; then
    echo -e "${RED}✗ FAIL: Critical security issues detected${NC}"
    echo "Review reports in ${REPORT_DIR}/"
    exit 1
elif [ "$HIGH_ISSUES" -gt 5 ]; then
    echo -e "${YELLOW}⚠ WARNING: Multiple high severity issues detected${NC}"
    echo "Review reports and address before production deployment"
    exit 1
else
    echo -e "${GREEN}✓ PASS: No critical security issues detected${NC}"
    exit 0
fi
