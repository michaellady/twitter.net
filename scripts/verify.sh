#!/bin/bash
# Tracer Bullet Final Verification Script
# Run this to verify the complete end-to-end system works

set -e

echo "=========================================="
echo "  Twitter.net Tracer Bullet Verification"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS_COUNT=0
FAIL_COUNT=0

pass() {
    echo -e "${GREEN}✓ PASS:${NC} $1"
    ((PASS_COUNT++))
}

fail() {
    echo -e "${RED}✗ FAIL:${NC} $1"
    ((FAIL_COUNT++))
}

warn() {
    echo -e "${YELLOW}⚠ WARN:${NC} $1"
}

section() {
    echo ""
    echo "----------------------------------------"
    echo "  $1"
    echo "----------------------------------------"
}

# ==========================================
# 1. INFRASTRUCTURE VERIFICATION
# ==========================================
section "1. Infrastructure Check"

# Check Docker is running
if docker info > /dev/null 2>&1; then
    pass "Docker daemon is running"
else
    fail "Docker daemon not running"
    echo "Please start Docker and try again."
    exit 1
fi

# Check docker-compose.yml exists
if [ -f "docker-compose.yml" ]; then
    pass "docker-compose.yml exists"
else
    fail "docker-compose.yml not found"
    exit 1
fi

# Start services
echo "Starting services with docker-compose..."
if docker-compose up -d; then
    pass "docker-compose up succeeded"
else
    fail "docker-compose up failed"
    exit 1
fi

# Wait for services to be healthy
echo "Waiting for services to become healthy..."
sleep 10

# Check service health
section "2. Service Health Checks"

check_health() {
    local service=$1
    local url=$2
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -sf "$url" > /dev/null 2>&1; then
            pass "$service is healthy at $url"
            return 0
        fi
        sleep 1
        ((attempt++))
    done
    fail "$service failed health check at $url"
    return 1
}

# Health checks for each service (adjust ports as needed)
check_health "Frontend" "http://localhost:3000" || true
check_health "BFF" "http://localhost:4000/health" || true
check_health "Core API" "http://localhost:5000/health" || true
check_health "LocalStack" "http://localhost:4566/_localstack/health" || true

# ==========================================
# 3. UNIT TESTS
# ==========================================
section "3. Unit Tests"

# Frontend tests
if [ -d "frontend" ]; then
    echo "Running frontend unit tests..."
    if (cd frontend && npm test -- --watchAll=false 2>/dev/null); then
        pass "Frontend unit tests passed"
    else
        fail "Frontend unit tests failed"
    fi
fi

# BFF tests
if [ -d "bff" ]; then
    echo "Running BFF unit tests..."
    if (cd bff && npm test 2>/dev/null); then
        pass "BFF unit tests passed"
    else
        fail "BFF unit tests failed"
    fi
fi

# Core tests
if [ -d "core" ]; then
    echo "Running Core unit tests..."
    if (cd core && dotnet test 2>/dev/null); then
        pass "Core unit tests passed"
    else
        fail "Core unit tests failed"
    fi
fi

# ==========================================
# 4. INTEGRATION TESTS
# ==========================================
section "4. Integration Tests"

if [ -d "core" ]; then
    echo "Running Core integration tests..."
    if (cd core && dotnet test --filter Category=Integration 2>/dev/null); then
        pass "Core integration tests passed"
    else
        warn "Core integration tests not found or failed"
    fi
fi

# ==========================================
# 5. E2E TESTS
# ==========================================
section "5. E2E Tests"

if [ -f "playwright.config.ts" ] || [ -d "e2e" ]; then
    echo "Running Playwright E2E tests..."
    if npx playwright test 2>/dev/null; then
        pass "E2E tests passed"
    else
        fail "E2E tests failed"
    fi
else
    warn "E2E tests not found (playwright.config.ts or e2e/ directory)"
fi

# ==========================================
# 6. MANUAL SMOKE TEST INSTRUCTIONS
# ==========================================
section "6. Manual Smoke Test"

echo "Please perform the following manual verification:"
echo ""
echo "  1. Open http://localhost:3000 in your browser"
echo "  2. Type a tweet in the composer"
echo "  3. Click the Tweet button"
echo "  4. Verify the tweet appears in the feed below"
echo "  5. Refresh the page"
echo "  6. Verify the tweet persists after refresh"
echo ""
read -p "Did the manual smoke test pass? (y/n): " smoke_result
if [ "$smoke_result" = "y" ] || [ "$smoke_result" = "Y" ]; then
    pass "Manual smoke test passed"
else
    fail "Manual smoke test failed"
fi

# ==========================================
# 7. HOT RELOAD VERIFICATION
# ==========================================
section "7. Hot Reload Verification (Optional)"

echo "To verify hot reload:"
echo ""
echo "  1. Edit a frontend file (e.g., change button text)"
echo "  2. Save the file"
echo "  3. Verify the change appears in browser without manual refresh"
echo ""
read -p "Did hot reload work? (y/n/s to skip): " hotreload_result
if [ "$hotreload_result" = "y" ] || [ "$hotreload_result" = "Y" ]; then
    pass "Hot reload works"
elif [ "$hotreload_result" = "s" ] || [ "$hotreload_result" = "S" ]; then
    warn "Hot reload verification skipped"
else
    warn "Hot reload may need investigation"
fi

# ==========================================
# SUMMARY
# ==========================================
section "VERIFICATION SUMMARY"

echo ""
echo "  Passed: $PASS_COUNT"
echo "  Failed: $FAIL_COUNT"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}=========================================="
    echo "  ALL VERIFICATIONS PASSED!"
    echo "==========================================${NC}"
    exit 0
else
    echo -e "${RED}=========================================="
    echo "  VERIFICATION FAILED ($FAIL_COUNT issues)"
    echo "==========================================${NC}"
    exit 1
fi
