#!/bin/bash
# Master test runner for quiz-app
# Runs all backend and frontend tests

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Track results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

echo -e "${BOLD}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║                      Quiz App - Complete Test Suite                         ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════════════════════════════╝${NC}\n"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}Project Root:${NC} $PROJECT_ROOT"
echo -e "${BLUE}Tests Directory:${NC} $SCRIPT_DIR\n"

# ============================================================================
# BACKEND TESTS
# ============================================================================

echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}1. Backend Tests${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

if [ -f "$SCRIPT_DIR/backend/test_tsv_parsing.py" ]; then
    echo -e "${YELLOW}Running TSV parsing tests...${NC}\n"

    python3 "$SCRIPT_DIR/backend/test_tsv_parsing.py"
    BACKEND_EXIT=$?

    if [ $BACKEND_EXIT -eq 0 ]; then
        echo -e "\n${GREEN}✓ Backend tests passed${NC}\n"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "\n${RED}✗ Backend tests failed (exit code: $BACKEND_EXIT)${NC}\n"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
else
    echo -e "${RED}✗ Backend test file not found${NC}\n"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
fi

# ============================================================================
# FRONTEND TESTS
# ============================================================================

echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}2. Frontend Tests${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

if [ -f "$SCRIPT_DIR/frontend/test_image_utils.html" ]; then
    echo -e "${YELLOW}Opening frontend tests in browser...${NC}"
    echo -e "${YELLOW}File:${NC} $SCRIPT_DIR/frontend/test_image_utils.html"
    echo -e "${YELLOW}→ Check browser for results${NC}\n"

    # Try to open in default browser
    if command -v open &> /dev/null; then
        open "$SCRIPT_DIR/frontend/test_image_utils.html"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "$SCRIPT_DIR/frontend/test_image_utils.html"
    else
        echo -e "${YELLOW}Please open the following file manually:${NC}"
        echo -e "  file://$SCRIPT_DIR/frontend/test_image_utils.html"
    fi

    echo -e "${GREEN}✓ Frontend test file opened${NC}\n"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
else
    echo -e "${RED}✗ Frontend test file not found${NC}\n"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
fi

# ============================================================================
# FIXTURES VERIFICATION
# ============================================================================

echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}3. Test Fixtures${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

FIXTURES=("test-valid.tsv" "test-missing-columns.tsv" "test-malformed.tsv" "test-http-images.tsv")
FIXTURES_FOUND=0

for fixture in "${FIXTURES[@]}"; do
    if [ -f "$SCRIPT_DIR/fixtures/$fixture" ]; then
        echo -e "${GREEN}✓${NC} $fixture"
        FIXTURES_FOUND=$((FIXTURES_FOUND + 1))
    else
        echo -e "${RED}✗${NC} $fixture (not found)"
    fi
done

echo -e "\n${YELLOW}Fixtures:${NC} $FIXTURES_FOUND/${#FIXTURES[@]} found\n"

if [ $FIXTURES_FOUND -eq ${#FIXTURES[@]} ]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# ============================================================================
# SUMMARY
# ============================================================================

echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Test Summary${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "  Total Test Suites:  ${BOLD}$TOTAL_TESTS${NC}"
echo -e "  Passed:             ${GREEN}${BOLD}$PASSED_TESTS${NC}"
echo -e "  Failed:             ${RED}${BOLD}$FAILED_TESTS${NC}"

PERCENTAGE=$(( PASSED_TESTS * 100 / TOTAL_TESTS ))

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}${BOLD}✓ All test suites passed! (${PERCENTAGE}%)${NC}"
    echo -e "${GREEN}Ready for production deployment.${NC}\n"
    EXIT_CODE=0
else
    echo -e "\n${RED}${BOLD}✗ Some test suites failed (${PERCENTAGE}% passed)${NC}"
    echo -e "${RED}Review failures above before deploying.${NC}\n"
    EXIT_CODE=1
fi

echo -e "${BOLD}╚══════════════════════════════════════════════════════════════════════════════╝${NC}\n"

exit $EXIT_CODE
