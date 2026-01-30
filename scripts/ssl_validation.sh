#!/bin/bash
#
# SSL/TLS Validation Script
# Validates SSL certificate and configuration
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  SSL/TLS Configuration Validator${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Get domain from user
if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage: $0 <domain>${NC}"
    echo "Example: $0 api.yourdomain.com"
    exit 1
fi

DOMAIN="$1"
PORT="${2:-443}"

echo "Testing domain: ${DOMAIN}:${PORT}"
echo ""

# Track issues
CRITICAL=0
WARNINGS=0

print_check() {
    echo -e "${YELLOW}>>> $1${NC}"
}

# 1. Certificate Validity
print_check "1. Checking Certificate Validity"

if command -v openssl >/dev/null 2>&1; then
    CERT_INFO=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:$PORT" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        echo "$CERT_INFO"
        
        # Check expiration
        EXPIRY=$(echo "$CERT_INFO" | grep "notAfter" | cut -d= -f2)
        EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$EXPIRY" +%s 2>/dev/null)
        NOW_EPOCH=$(date +%s)
        DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))
        
        if [ "$DAYS_LEFT" -lt 0 ]; then
            echo -e "${RED}✗ Certificate is EXPIRED${NC}"
            CRITICAL=$((CRITICAL + 1))
        elif [ "$DAYS_LEFT" -lt 7 ]; then
            echo -e "${RED}✗ Certificate expires in $DAYS_LEFT days${NC}"
            CRITICAL=$((CRITICAL + 1))
        elif [ "$DAYS_LEFT" -lt 30 ]; then
            echo -e "${YELLOW}⚠ Certificate expires in $DAYS_LEFT days${NC}"
            WARNINGS=$((WARNINGS + 1))
        else
            echo -e "${GREEN}✓ Certificate valid for $DAYS_LEFT days${NC}"
        fi
    else
        echo -e "${RED}✗ Could not retrieve certificate${NC}"
        CRITICAL=$((CRITICAL + 1))
    fi
else
    echo -e "${YELLOW}⚠ OpenSSL not available${NC}"
fi

echo ""

# 2. Certificate Chain
print_check "2. Checking Certificate Chain"

if command -v openssl >/dev/null 2>&1; then
    CHAIN=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:$PORT" -showcerts 2>/dev/null | grep -c "BEGIN CERTIFICATE")
    
    if [ "$CHAIN" -gt 1 ]; then
        echo -e "${GREEN}✓ Certificate chain complete ($CHAIN certificates)${NC}"
    else
        echo -e "${YELLOW}⚠ Incomplete certificate chain${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

echo ""

# 3. TLS Version
print_check "3. Checking TLS Protocol Versions"

if command -v openssl >/dev/null 2>&1; then
    # Test TLS 1.3
    if echo | openssl s_client -tls1_3 -connect "$DOMAIN:$PORT" 2>/dev/null | grep -q "Protocol.*TLSv1.3"; then
        echo -e "${GREEN}✓ TLS 1.3 supported${NC}"
    else
        echo -e "${YELLOW}⚠ TLS 1.3 not supported${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    # Test TLS 1.2
    if echo | openssl s_client -tls1_2 -connect "$DOMAIN:$PORT" 2>/dev/null | grep -q "Protocol.*TLSv1.2"; then
        echo -e "${GREEN}✓ TLS 1.2 supported${NC}"
    else
        echo -e "${RED}✗ TLS 1.2 not supported${NC}"
        CRITICAL=$((CRITICAL + 1))
    fi
    
    # Test TLS 1.1 (should fail)
    if echo | openssl s_client -tls1_1 -connect "$DOMAIN:$PORT" 2>/dev/null | grep -q "Protocol.*TLSv1.1"; then
        echo -e "${RED}✗ TLS 1.1 enabled (insecure)${NC}"
        CRITICAL=$((CRITICAL + 1))
    else
        echo -e "${GREEN}✓ TLS 1.1 disabled${NC}"
    fi
    
    # Test TLS 1.0 (should fail)
    if echo | openssl s_client -tls1 -connect "$DOMAIN:$PORT" 2>/dev/null | grep -q "Protocol.*TLSv1"; then
        echo -e "${RED}✗ TLS 1.0 enabled (insecure)${NC}"
        CRITICAL=$((CRITICAL + 1))
    else
        echo -e "${GREEN}✓ TLS 1.0 disabled${NC}"
    fi
fi

echo ""

# 4. Cipher Strength
print_check "4. Checking Cipher Strength"

if command -v openssl >/dev/null 2>&1; then
    CIPHER=$(echo | openssl s_client -connect "$DOMAIN:$PORT" 2>/dev/null | grep "Cipher" | head -1)
    echo "$CIPHER"
    
    # Check for weak ciphers
    if echo "$CIPHER" | grep -qi "RC4\|DES\|MD5\|NULL\|EXPORT\|anon"; then
        echo -e "${RED}✗ Weak cipher detected${NC}"
        CRITICAL=$((CRITICAL + 1))
    else
        echo -e "${GREEN}✓ Strong cipher suite${NC}"
    fi
fi

echo ""

# 5. HSTS Header
print_check "5. Checking HSTS (HTTP Strict Transport Security)"

if command -v curl >/dev/null 2>&1; then
    HSTS=$(curl -sI "https://$DOMAIN" | grep -i "strict-transport-security")
    
    if [ -n "$HSTS" ]; then
        echo "$HSTS"
        
        # Check max-age
        if echo "$HSTS" | grep -q "max-age=31536000"; then
            echo -e "${GREEN}✓ HSTS enabled with 1-year max-age${NC}"
        else
            echo -e "${YELLOW}⚠ HSTS max-age should be 31536000 (1 year)${NC}"
            WARNINGS=$((WARNINGS + 1))
        fi
        
        # Check includeSubDomains
        if echo "$HSTS" | grep -qi "includeSubDomains"; then
            echo -e "${GREEN}✓ HSTS includes subdomains${NC}"
        else
            echo -e "${YELLOW}⚠ HSTS should include subdomains${NC}"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        echo -e "${RED}✗ HSTS header not present${NC}"
        CRITICAL=$((CRITICAL + 1))
    fi
fi

echo ""

# 6. Security Headers
print_check "6. Checking Security Headers"

if command -v curl >/dev/null 2>&1; then
    HEADERS=$(curl -sI "https://$DOMAIN")
    
    # X-Frame-Options
    if echo "$HEADERS" | grep -qi "x-frame-options"; then
        echo -e "${GREEN}✓ X-Frame-Options present${NC}"
    else
        echo -e "${YELLOW}⚠ X-Frame-Options missing${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    # X-Content-Type-Options
    if echo "$HEADERS" | grep -qi "x-content-type-options"; then
        echo -e "${GREEN}✓ X-Content-Type-Options present${NC}"
    else
        echo -e "${YELLOW}⚠ X-Content-Type-Options missing${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    # Content-Security-Policy
    if echo "$HEADERS" | grep -qi "content-security-policy"; then
        echo -e "${GREEN}✓ Content-Security-Policy present${NC}"
    else
        echo -e "${YELLOW}⚠ Content-Security-Policy missing${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

echo ""

# 7. OCSP Stapling
print_check "7. Checking OCSP Stapling"

if command -v openssl >/dev/null 2>&1; then
    OCSP=$(echo | openssl s_client -connect "$DOMAIN:$PORT" -status 2>/dev/null | grep "OCSP Response Status")
    
    if echo "$OCSP" | grep -q "successful"; then
        echo -e "${GREEN}✓ OCSP stapling enabled${NC}"
    else
        echo -e "${YELLOW}⚠ OCSP stapling not configured${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

echo ""

# 8. External SSL Labs Test
print_check "8. SSL Labs Test Recommendation"

echo "For comprehensive testing, run:"
echo -e "${BLUE}https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN${NC}"
echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Validation Summary${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "Critical Issues: ${RED}$CRITICAL${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ "$CRITICAL" -gt 0 ]; then
    echo -e "${RED}✗ FAIL: Critical SSL/TLS issues detected${NC}"
    echo "Fix critical issues before deploying to production"
    exit 1
elif [ "$WARNINGS" -gt 3 ]; then
    echo -e "${YELLOW}⚠ WARNING: Multiple configuration warnings${NC}"
    echo "Consider addressing warnings for optimal security"
    exit 1
else
    echo -e "${GREEN}✓ PASS: SSL/TLS configuration looks good${NC}"
    exit 0
fi
