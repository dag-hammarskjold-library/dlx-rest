#!/bin/bash
set -e

# Combined test runner for Python and JavaScript tests
# Usage: ./runtests.sh [all|py|js]

TEST_TYPE="${1:-all}"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

run_python_tests() {
    print_header "Running Python Tests"
    export DLX_REST_TESTING=True
    pytest -W ignore -vv
}

run_js_tests() {
    print_header "Running JavaScript Tests (v3 components)"
    npm run test:js:v3
}

case "$TEST_TYPE" in
    py|python)
        run_python_tests
        ;;
    js|javascript)
        run_js_tests
        ;;
    all|*)
        run_js_tests
        echo ""
        run_python_tests
        ;;
esac

echo ""
echo -e "${GREEN}✓ All tests passed!${NC}"
