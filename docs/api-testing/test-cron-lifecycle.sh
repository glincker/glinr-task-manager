#!/bin/bash
# =============================================================================
# Test: Cron Job Lifecycle (Agentic)
# =============================================================================
# Tests: cron_create -> cron_list -> cron_trigger -> cron_history -> cron_archive
# Validates scheduled job management works end-to-end.

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/config.sh"

echo "========================================"
echo "Test: Cron Job Lifecycle"
echo "========================================"
echo ""

check_server || exit 1

CONV_ID=$(get_conversation_id) || exit 1
log_info "Using conversation: $CONV_ID"
log_info "Model: $GLINR_MODEL"

MESSAGE="Do these steps:
1. Create a cron job named 'API Health Check' that runs every hour with a simple HTTP GET to http://localhost:3000/health
2. List all cron jobs to confirm it was created
3. Trigger the job manually
4. Check the job run history
5. Archive the job when done

Report each step."

log_info "Prompt: cron lifecycle"
echo ""

curl -s -N -X POST "${GLINR_API_URL}/chat/conversations/$CONV_ID/messages/agentic" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d "{
    \"content\": $(echo "$MESSAGE" | jq -Rs .),
    \"showThinking\": false,
    \"maxSteps\": 15,
    \"model\": \"$GLINR_MODEL\"
  }" | while read -r line; do
    if [[ "$line" == data:* ]]; then
      json="${line#data: }"
      [ -z "$json" ] && continue
      event_type=$(echo "$json" | jq -r '.type // "unknown"' 2>/dev/null)

      case "$event_type" in
        "step:start")
          echo -e "${BLUE}[Step $(echo "$json" | jq -r '.data.step')]${NC}"
          ;;
        "tool:call")
          tool_name=$(echo "$json" | jq -r '.data.name')
          echo -e "${GREEN}[Tool]${NC} $tool_name"
          ;;
        "tool:result")
          tool_name=$(echo "$json" | jq -r '.data.name')
          status=$(echo "$json" | jq -r '.data.status // "?"')
          [ "$status" = "executed" ] && echo -e "${GREEN}[OK]${NC} $tool_name" || echo -e "${RED}[FAIL]${NC} $tool_name ($status)"
          ;;
        "summary")
          echo ""
          echo "--- SUMMARY ---"
          echo "$json" | jq -r '.data.summary'
          ;;
        "complete")
          echo ""
          tool_names=$(echo "$json" | jq -r '.data.toolCalls // [] | .[].name' 2>/dev/null)
          log_success "Tools: $(echo "$tool_names" | tr '\n' ', ')"

          for expected in cron_create cron_list; do
            echo "$tool_names" | grep -q "$expected" && log_success "$expected" || log_warn "Missing: $expected"
          done
          ;;
        "error")
          log_error "$(echo "$json" | jq -r '.data.message')"
          ;;
      esac
    fi
  done

echo ""
log_success "Test complete"
