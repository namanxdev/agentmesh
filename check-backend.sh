#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}   AgentMesh Backend Health Check${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# 1. Lint
echo -e "${YELLOW}[1/3] Linting (ruff)...${NC}"
if ruff check backend/; then
    echo -e "${GREEN}✓ No lint issues${NC}"
else
    echo -e "${RED}✗ Lint issues found. Run: ruff check --fix backend/${NC}"
    exit 1
fi
echo ""

# 2. Format check
echo -e "${YELLOW}[2/3] Format check (ruff)...${NC}"
if ruff format --check backend/; then
    echo -e "${GREEN}✓ Formatting looks good${NC}"
else
    echo -e "${RED}✗ Formatting issues. Run: ruff format backend/${NC}"
    exit 1
fi
echo ""

# 3. Tests
echo -e "${YELLOW}[3/3] Running tests (pytest)...${NC}"
if pytest -v; then
    echo ""
    echo -e "${GREEN}✓ All tests passed${NC}"
else
    echo ""
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   All checks passed! Ready to deploy.${NC}"
echo -e "${GREEN}========================================${NC}"
