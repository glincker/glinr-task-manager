#!/bin/bash
# =============================================================================
# Run All API Tests
# =============================================================================
# Runs each test script and reports pass/fail.
# Usage: ./run-all.sh [--quick]
#   --quick  Skip slow multi-step tests

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/config.sh"

QUICK=false
[[ "$1" == "--quick" ]] && QUICK=true

echo "========================================"
echo "GLINR API Test Suite"
echo "Model: $GLINR_MODEL"
echo "========================================"
echo ""

check_server || exit 1
echo ""

PASSED=0
FAILED=0
SKIPPED=0

run_test() {
  local name="$1"
  local script="$2"
  shift 2

  echo "----------------------------------------"
  echo "Running: $name"
  echo "----------------------------------------"

  if "$script" "$@" > /dev/null 2>&1; then
    log_success "$name"
    PASSED=$((PASSED + 1))
  else
    log_error "$name"
    FAILED=$((FAILED + 1))
  fi
  echo ""
}

# Core tests (fast)
run_test "Simple Chat" "${SCRIPT_DIR}/test-simple-chat.sh" "ping"
run_test "Tools Available" "${SCRIPT_DIR}/test-tools.sh" "What time is it?"
run_test "Create Ticket (single step)" "${SCRIPT_DIR}/test-create-ticket.sh"

if [ "$QUICK" = false ]; then
  # Multi-step agentic tests (slower)
  run_test "Agentic: Ticket Flow" "${SCRIPT_DIR}/test-agentic.sh" "Create a ticket titled 'Run-All Test' with type bug"
  run_test "Agentic: Git Workflow" "${SCRIPT_DIR}/test-git-workflow.sh"
  run_test "Agentic: File Ops Chain" "${SCRIPT_DIR}/test-file-ops-chain.sh"
  run_test "Agentic: Cron Lifecycle" "${SCRIPT_DIR}/test-cron-lifecycle.sh"
  run_test "Agentic: Error Recovery" "${SCRIPT_DIR}/test-error-recovery.sh"
  run_test "Agentic: Web Search + Action" "${SCRIPT_DIR}/test-web-search.sh"
  run_test "Agentic: Project+Ticket Flow" "${SCRIPT_DIR}/test-project-ticket-flow.sh"
else
  SKIPPED=7
  log_warn "Skipped 7 multi-step tests (use without --quick to run all)"
fi

echo ""
echo "========================================"
echo "RESULTS"
echo "========================================"
echo ""
log_success "Passed: $PASSED"
[ "$FAILED" -gt 0 ] && log_error "Failed: $FAILED" || echo -e "Failed: 0"
[ "$SKIPPED" -gt 0 ] && log_warn "Skipped: $SKIPPED"
echo ""

exit $FAILED
