#!/bin/bash
# =============================================================================
# Test: Web Search + Action (Agentic)
# =============================================================================
# Tests: web_search -> use result -> create_ticket
# Validates web search integrates with other tools.

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/config.sh"

echo "========================================"
echo "Test: Web Search + Action"
echo "========================================"
echo ""

check_server || exit 1

CONV_ID=$(get_conversation_id) || exit 1
log_info "Using conversation: $CONV_ID"
log_info "Model: $GLINR_MODEL"

MESSAGE="Search the web for 'TypeScript 5.7 new features' and then create a ticket titled 'Evaluate TypeScript 5.7 Features' with a description that includes the top 3 features you found."

log_info "Prompt: web search + create ticket"
echo ""

curl -s -N -X POST "${GLINR_API_URL}/chat/conversations/$CONV_ID/messages/agentic" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d "{
    \"content\": $(echo "$MESSAGE" | jq -Rs .),
    \"showThinking\": false,
    \"maxSteps\": 12,
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
          tool_args=$(echo "$json" | jq -c '.data.arguments // {}')
          echo -e "${GREEN}[Tool]${NC} $tool_name  ${tool_args:0:100}"
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

          echo "$tool_names" | grep -q "web_search" && log_success "web_search called" || log_warn "Missing: web_search"
          echo "$tool_names" | grep -q "create_ticket" && log_success "create_ticket called" || log_warn "Missing: create_ticket"
          ;;
        "error")
          log_error "$(echo "$json" | jq -r '.data.message')"
          ;;
      esac
    fi
  done

echo ""
log_success "Test complete"
