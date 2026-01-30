#!/bin/bash
#
# Smoke Test Suite for SIRA
# Validates critical functionality after deployment
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:8000}"
WEB_BASE_URL="${WEB_BASE_URL:-http://localhost:3000}"
TEST_TOKEN="${TEST_TOKEN:-test_token}"

# Test counters
PASSED=0
FAILED=0
TOTAL=0

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  SIRA Smoke Test Suite${NC}"
echo -e "${BLUE}========================================${NC}\n"
echo "API: ${API_BASE_URL}"
echo "Web: ${WEB_BASE_URL}"
echo ""

# Helper functions
run_test() {
    local test_name="$1"
    TOTAL=$((TOTAL + 1))
    echo -en "${YELLOW}[${TOTAL}] Testing: ${test_name}...${NC} "
}

pass() {
    PASSED=$((PASSED + 1))
    echo -e "${GREEN}✓ PASS${NC}"
}

fail() {
    FAILED=$((FAILED + 1))
    echo -e "${RED}✗ FAIL${NC}"
    [ -n "$1" ] && echo -e "    ${RED}Error: $1${NC}"
}

# Test 1: Health Check Endpoints
run_test "API Health Check"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${API_BASE_URL}/health")
if [ "$RESPONSE" -eq 200 ]; then
    pass
else
    fail "Expected 200, got ${RESPONSE}"
fi

run_test "API System Health"
RESPONSE=$(curl -s "${API_BASE_URL}/health/system")
if echo "$RESPONSE" | grep -q "status"; then
    pass
else
    fail "Invalid response format"
fi

run_test "API Ready Check"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${API_BASE_URL}/health/ready")
if [ "$RESPONSE" -eq 200 ]; then
    pass
else
    fail "API not ready"
fi

# Test 2: Frontend Accessibility
run_test "Frontend Homepage"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${WEB_BASE_URL}")
if [ "$RESPONSE" -eq 200 ]; then
    pass
else
    fail "Expected 200, got ${RESPONSE}"
fi

# Test 3: API Documentation
run_test "OpenAPI Documentation"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${API_BASE_URL}/docs")
if [ "$RESPONSE" -eq 200 ]; then
    pass
else
    fail "Docs not accessible"
fi

# Test 4: Authentication
run_test "Authentication Required"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${API_BASE_URL}/api/profiles/test-user")
if [ "$RESPONSE" -eq 401 ] || [ "$RESPONSE" -eq 403 ]; then
    pass
else
    fail "Authentication not enforced (got ${RESPONSE})"
fi

# Test 5: CORS Headers
run_test "CORS Headers"
RESPONSE=$(curl -s -I "${API_BASE_URL}/health" | grep -i "access-control-allow-origin")
if [ -n "$RESPONSE" ]; then
    pass
else
    fail "CORS headers missing"
fi

# Test 6: Rate Limiting
run_test "Rate Limiting Active"
# Send multiple requests quickly
for i in {1..15}; do
    curl -s -o /dev/null -w "%{http_code}\n" "${API_BASE_URL}/health" >> /tmp/rate_test.txt
done
if grep -q "429" /tmp/rate_test.txt; then
    pass
else
    fail "Rate limiting not working"
fi
rm -f /tmp/rate_test.txt

# Test 7: Security Headers
run_test "Security Headers (X-Frame-Options)"
RESPONSE=$(curl -s -I "${WEB_BASE_URL}" | grep -i "x-frame-options")
if [ -n "$RESPONSE" ]; then
    pass
else
    fail "X-Frame-Options header missing"
fi

run_test "Security Headers (X-Content-Type-Options)"
RESPONSE=$(curl -s -I "${WEB_BASE_URL}" | grep -i "x-content-type-options")
if [ -n "$RESPONSE" ]; then
    pass
else
    fail "X-Content-Type-Options header missing"
fi

# Test 8: Database Connectivity
run_test "Database Connection"
RESPONSE=$(curl -s "${API_BASE_URL}/health/system" | grep -o '"database":"[^"]*"')
if echo "$RESPONSE" | grep -q "healthy"; then
    pass
else
    fail "Database connection issue"
fi

# Test 9: API Response Time
run_test "API Response Time (<1s)"
START=$(date +%s%N)
curl -s "${API_BASE_URL}/health" > /dev/null
END=$(date +%s%N)
DURATION=$(( (END - START) / 1000000 ))  # Convert to milliseconds

if [ "$DURATION" -lt 1000 ]; then
    pass
else
    fail "Response time: ${DURATION}ms (expected <1000ms)"
fi

# Test 10: Static Assets
run_test "Frontend Static Assets"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${WEB_BASE_URL}/_next/static/")
if [ "$RESPONSE" -eq 200 ] || [ "$RESPONSE" -eq 404 ]; then
    # 404 is OK for directory listing
    pass
else
    fail "Static assets not accessible"
fi

# Test 11: Error Handling
run_test "404 Error Handling"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${API_BASE_URL}/nonexistent")
if [ "$RESPONSE" -eq 404 ]; then
    pass
else
    fail "Expected 404, got ${RESPONSE}"
fi

# Test 12: API Versioning
run_test "API Versioning"
RESPONSE=$(curl -s "${API_BASE_URL}/health/system")
if echo "$RESPONSE" | grep -q "version"; then
    pass
else
    fail "Version information missing"
fi

# Summary
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Test Summary${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo "Total Tests: ${TOTAL}"
echo -e "Passed: ${GREEN}${PASSED}${NC}"
echo -e "Failed: ${RED}${FAILED}${NC}"
echo ""

PASS_RATE=$((PASSED * 100 / TOTAL))
echo "Pass Rate: ${PASS_RATE}%"
echo ""

if [ "$FAILED" -eq 0 ]; then
    echo -e "${GREEN}✓ All smoke tests passed!${NC}"
    echo "Deployment validated successfully."
    exit 0
elif [ "$PASS_RATE" -ge 80 ]; then
    echo -e "${YELLOW}⚠ Some tests failed but pass rate acceptable${NC}"
    echo "Review failed tests before proceeding."
    exit 1
else
    echo -e "${RED}✗ Too many test failures (${PASS_RATE}% pass rate)${NC}"
    echo "Do not deploy to production."
    exit 1
fi
