#!/bin/bash

# Test runner script for SIRA backend
# Usage: ./run_tests.sh [options]

set -e

echo "================================"
echo "SIRA Backend Test Suite"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Parse command line arguments
COVERAGE=true
VERBOSE=""
TEST_PATH="tests/"
MARKERS=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --no-coverage)
            COVERAGE=false
            shift
            ;;
        -v|--verbose)
            VERBOSE="-vv"
            shift
            ;;
        -m|--markers)
            MARKERS="-m $2"
            shift 2
            ;;
        -k|--keyword)
            MARKERS="-k $2"
            shift 2
            ;;
        -p|--path)
            TEST_PATH="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: ./run_tests.sh [options]"
            echo ""
            echo "Options:"
            echo "  --no-coverage        Run tests without coverage"
            echo "  -v, --verbose        Verbose output"
            echo "  -m, --markers MARK   Run tests with specific marker (unit, integration, e2e)"
            echo "  -k, --keyword EXPR   Run tests matching keyword expression"
            echo "  -p, --path PATH      Run tests in specific path"
            echo "  -h, --help           Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./run_tests.sh                           # Run all tests with coverage"
            echo "  ./run_tests.sh -m unit                   # Run only unit tests"
            echo "  ./run_tests.sh -k validation             # Run tests matching 'validation'"
            echo "  ./run_tests.sh -p tests/test_schemas.py  # Run specific test file"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Check if pytest is installed
if ! command -v pytest &> /dev/null; then
    echo -e "${RED}Error: pytest is not installed${NC}"
    echo "Install with: pip install pytest pytest-asyncio pytest-cov"
    exit 1
fi

# Build pytest command
PYTEST_CMD="pytest $VERBOSE $MARKERS $TEST_PATH"

if [ "$COVERAGE" = true ]; then
    PYTEST_CMD="$PYTEST_CMD --cov=app --cov-report=term-missing --cov-report=html"
fi

echo -e "${YELLOW}Running command:${NC} $PYTEST_CMD"
echo ""

# Run tests
if $PYTEST_CMD; then
    echo ""
    echo -e "${GREEN}✓ All tests passed!${NC}"
    
    if [ "$COVERAGE" = true ]; then
        echo ""
        echo -e "${YELLOW}Coverage report generated:${NC}"
        echo "  HTML: htmlcov/index.html"
        echo "  Terminal: See above"
    fi
    
    exit 0
else
    echo ""
    echo -e "${RED}✗ Tests failed${NC}"
    exit 1
fi
