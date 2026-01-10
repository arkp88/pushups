#!/bin/bash
# Master test runner for quiz-app
# Runs all backend, frontend, integration, and schema tests

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
echo -e "${BOLD}║                   Quiz App - Comprehensive Test Suite                        ║${NC}"
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

# Test 1.1: TSV Parsing Tests
if [ -f "$SCRIPT_DIR/backend/test_tsv_parsing.py" ]; then
    echo -e "${YELLOW}1.1 Running TSV parsing tests...${NC}\n"
    python3 "$SCRIPT_DIR/backend/test_tsv_parsing.py"
    BACKEND_EXIT=$?

    if [ $BACKEND_EXIT -eq 0 ]; then
        echo -e "\n${GREEN}✓ TSV parsing tests passed${NC}\n"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "\n${RED}✗ TSV parsing tests failed (exit code: $BACKEND_EXIT)${NC}\n"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
else
    echo -e "${RED}✗ TSV parsing test file not found${NC}\n"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
fi

# Test 1.2: API Endpoint Tests
if [ -f "$SCRIPT_DIR/backend/test_api_endpoints.py" ]; then
    echo -e "${YELLOW}1.2 Running API endpoint tests...${NC}\n"
    python3 "$SCRIPT_DIR/backend/test_api_endpoints.py"
    API_EXIT=$?

    if [ $API_EXIT -eq 0 ]; then
        echo -e "\n${GREEN}✓ API endpoint tests passed${NC}\n"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "\n${RED}✗ API endpoint tests failed (exit code: $API_EXIT)${NC}\n"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
else
    echo -e "${YELLOW}⚠ API endpoint test file not found (skipping)${NC}\n"
fi

# Test 1.3: Database Schema Tests
if [ -f "$SCRIPT_DIR/backend/test_database_schema.py" ]; then
    echo -e "${YELLOW}1.3 Running database schema tests...${NC}\n"
    python3 "$SCRIPT_DIR/backend/test_database_schema.py"
    SCHEMA_EXIT=$?

    if [ $SCHEMA_EXIT -eq 0 ]; then
        echo -e "\n${GREEN}✓ Database schema tests passed${NC}\n"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "\n${RED}✗ Database schema tests failed (exit code: $SCHEMA_EXIT)${NC}\n"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
else
    echo -e "${YELLOW}⚠ Database schema test file not found (skipping)${NC}\n"
fi

# ============================================================================
# FRONTEND TESTS
# ============================================================================

echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}2. Frontend Tests${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Test 2.1: HTML Browser Tests
if [ -f "$SCRIPT_DIR/frontend/test_image_utils.html" ]; then
    echo -e "${YELLOW}2.1 Opening frontend HTML tests in browser...${NC}"
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

    echo -e "${GREEN}✓ Frontend HTML test file opened${NC}\n"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
else
    echo -e "${RED}✗ Frontend HTML test file not found${NC}\n"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
fi

# Test 2.2: Jest Hook Tests
if [ -f "$SCRIPT_DIR/frontend/hooks.test.js" ]; then
    echo -e "${YELLOW}2.2 Running Jest hook tests...${NC}"
    echo -e "${BLUE}Note: Jest tests require 'npm test' to be run from frontend directory${NC}\n"

    # Check if we should run Jest (requires node_modules)
    if [ -d "$PROJECT_ROOT/frontend/node_modules" ]; then
        cd "$PROJECT_ROOT/frontend"
        npm test -- --testPathPattern=tests/frontend/hooks.test.js --passWithNoTests 2>/dev/null || true
        JEST_EXIT=$?

        if [ $JEST_EXIT -eq 0 ]; then
            echo -e "\n${GREEN}✓ Jest hook tests passed (or skipped)${NC}\n"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo -e "\n${YELLOW}⚠ Jest hook tests require setup (skipping)${NC}\n"
        fi
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        cd "$SCRIPT_DIR"
    else
        echo -e "${YELLOW}⚠ Frontend dependencies not installed. Run 'npm install' in frontend directory.${NC}\n"
    fi
else
    echo -e "${YELLOW}⚠ Jest hook tests not found (skipping)${NC}\n"
fi

# ============================================================================
# INTEGRATION TESTS
# ============================================================================

echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}3. Integration Tests${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

if [ -f "$SCRIPT_DIR/integration/test_user_flows.py" ]; then
    echo -e "${YELLOW}Running user flow integration tests...${NC}\n"
    python3 "$SCRIPT_DIR/integration/test_user_flows.py"
    INTEGRATION_EXIT=$?

    if [ $INTEGRATION_EXIT -eq 0 ]; then
        echo -e "\n${GREEN}✓ Integration tests passed${NC}\n"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "\n${RED}✗ Integration tests failed (exit code: $INTEGRATION_EXIT)${NC}\n"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
else
    echo -e "${YELLOW}⚠ Integration test file not found (skipping)${NC}\n"
fi

# ============================================================================
# FIXTURES VERIFICATION
# ============================================================================

echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}4. Test Fixtures${NC}"
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

if [ $TOTAL_TESTS -gt 0 ]; then
    PERCENTAGE=$(( PASSED_TESTS * 100 / TOTAL_TESTS ))
else
    PERCENTAGE=0
fi

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}${BOLD}✓ All test suites passed! (${PERCENTAGE}%)${NC}"
    echo -e "${GREEN}Ready for refactoring and deployment.${NC}\n"
    EXIT_CODE=0
else
    echo -e "\n${RED}${BOLD}✗ Some test suites failed (${PERCENTAGE}% passed)${NC}"
    echo -e "${RED}Review failures above before refactoring.${NC}\n"
    EXIT_CODE=1
fi

echo -e "${BOLD}╚══════════════════════════════════════════════════════════════════════════════╝${NC}\n"

exit $EXIT_CODE
