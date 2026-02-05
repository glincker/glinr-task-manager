#!/bin/bash
# =============================================================================
# GLINR API Testing Configuration
# =============================================================================
# Source this file in your test scripts: source ./config.sh
#
# This file stores common settings and provides helper functions for API testing.
# Run setup.sh first to create a test conversation and store the ID.

# Base configuration
export GLINR_BASE_URL="${GLINR_BASE_URL:-http://localhost:3000}"
export GLINR_API_URL="${GLINR_BASE_URL}/api"
export GLINR_MODEL="${GLINR_MODEL:-gpt4o-mini}"  # Default to Azure GPT-4o Mini

# State file (stores conversation IDs, etc.)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export GLINR_STATE_FILE="${SCRIPT_DIR}/.test-state.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# Helper Functions
# =============================================================================

# Print colored output
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Initialize state file if it doesn't exist
init_state() {
  if [ ! -f "$GLINR_STATE_FILE" ]; then
    echo '{}' > "$GLINR_STATE_FILE"
    log_info "Created state file: $GLINR_STATE_FILE"
  fi
}

# Get value from state file
get_state() {
  local key="$1"
  init_state
  jq -r ".$key // empty" "$GLINR_STATE_FILE"
}

# Set value in state file
set_state() {
  local key="$1"
  local value="$2"
  init_state
  local tmp=$(mktemp)
  jq ".$key = \"$value\"" "$GLINR_STATE_FILE" > "$tmp" && mv "$tmp" "$GLINR_STATE_FILE"
}

# Get or create default conversation
get_conversation_id() {
  local conv_id=$(get_state "conversationId")
  if [ -z "$conv_id" ]; then
    log_warn "No conversation ID found. Run setup.sh first."
    return 1
  fi
  echo "$conv_id"
}

# Pretty print JSON response
pretty_json() {
  if command -v jq &> /dev/null; then
    jq '.'
  else
    cat
  fi
}

# Make API request with common headers
api_request() {
  local method="$1"
  local endpoint="$2"
  local data="$3"

  local url="${GLINR_API_URL}${endpoint}"

  if [ -n "$data" ]; then
    curl -s -X "$method" "$url" \
      -H "Content-Type: application/json" \
      -d "$data"
  else
    curl -s -X "$method" "$url" \
      -H "Content-Type: application/json"
  fi
}

# Check if server is running
check_server() {
  if ! curl -s "${GLINR_BASE_URL}/health" > /dev/null 2>&1; then
    log_error "Server not running at ${GLINR_BASE_URL}"
    log_info "Start the server with: pnpm dev"
    return 1
  fi
  log_success "Server is running at ${GLINR_BASE_URL}"
  return 0
}

# =============================================================================
# Exports for test scripts
# =============================================================================
export -f log_info log_success log_warn log_error
export -f init_state get_state set_state get_conversation_id
export -f pretty_json api_request check_server
