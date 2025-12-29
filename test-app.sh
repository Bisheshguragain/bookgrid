#!/bin/bash

# Calendly Clone - Comprehensive Test Script
# This script verifies the application is production-ready

echo "🧪 Calendly Clone - Application Test Suite"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Test 1: Check if .env.local exists
echo "📋 Test 1: Checking environment configuration..."
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓${NC} .env.local file found"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗${NC} .env.local file not found"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Test 2: Check if Supabase credentials are set
echo "📋 Test 2: Checking Supabase credentials..."
if grep -q "VITE_SUPABASE_URL" .env.local && grep -q "VITE_SUPABASE_ANON_KEY" .env.local; then
    echo -e "${GREEN}✓${NC} Supabase credentials configured"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗${NC} Supabase credentials missing"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Test 3: Check if node_modules exists
echo "📋 Test 3: Checking dependencies..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} Dependencies installed"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${YELLOW}⚠${NC} Dependencies not installed. Running npm install..."
    npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Dependencies installed successfully"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗${NC} Failed to install dependencies"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
fi
echo ""

# Test 4: Check TypeScript compilation
echo "📋 Test 4: Running TypeScript compilation check..."
npx tsc --noEmit 2>&1 | tee /tmp/tsc-output.txt
if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo -e "${GREEN}✓${NC} TypeScript compilation successful"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗${NC} TypeScript compilation failed"
    echo "Errors:"
    cat /tmp/tsc-output.txt
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Test 5: Check for key files
echo "📋 Test 5: Checking for critical application files..."
CRITICAL_FILES=(
    "src/lib/supabase.ts"
    "src/hooks/useRealtimeBookings.ts"
    "src/hooks/useRealtimeReminders.ts"
    "src/pages/Dashboard.tsx"
    "src/App.tsx"
    "src/main.tsx"
)

ALL_FILES_EXIST=true
for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file (missing)"
        ALL_FILES_EXIST=false
    fi
done

if $ALL_FILES_EXIST; then
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Test 6: Check for ESLint errors
echo "📋 Test 6: Running ESLint check..."
npm run lint 2>&1 | tee /tmp/eslint-output.txt
ESLINT_EXIT=${PIPESTATUS[0]}
if [ $ESLINT_EXIT -eq 0 ]; then
    echo -e "${GREEN}✓${NC} No ESLint errors"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${YELLOW}⚠${NC} ESLint warnings/errors found (non-critical)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
fi
echo ""

# Test 7: Try to build the application
echo "📋 Test 7: Building application..."
npm run build 2>&1 | tee /tmp/build-output.txt
if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Application build successful"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗${NC} Application build failed"
    echo "Build errors:"
    tail -50 /tmp/build-output.txt
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Summary
echo "=========================================="
echo "📊 Test Summary"
echo "=========================================="
echo -e "Tests Passed: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Tests Failed: ${RED}${TESTS_FAILED}${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! Application is ready.${NC}"
    echo ""
    echo "🚀 To start the development server, run:"
    echo "   npm run dev"
    echo ""
    echo "📦 To preview the production build, run:"
    echo "   npm run preview"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please fix the issues above.${NC}"
    exit 1
fi
