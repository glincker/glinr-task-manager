#!/bin/bash
# =============================================================================
# Test: Project + Ticket Multi-Step Flow (Agentic)
# =============================================================================
# Tests: create_project -> list_projects -> create_ticket -> update_ticket -> get_ticket
# Validates the full GLINR ops pipeline works end-to-end.

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/config.sh"

PROJ_NAME="${1:-API Test Project}"

echo "========================================"
echo "Test: Project + Ticket Multi-Step Flow"
echo "========================================"
echo ""

check_server || exit 1

CONV_ID=$(get_conversation_id) || exit 1
log_info "Using conversation: $CONV_ID"
log_info "Model: $GLINR_MODEL"

MESSAGE="Do these steps in order:
1. Create a project named '$PROJ_NAME' with key 'APITEST' and icon '🧪'
2. Create a ticket in that project titled 'Setup CI Pipeline' type 'task' priority 'high'
3. Update that ticket status to 'in_progress'
4. Get the ticket details to confirm the update

Report what happened at each step."

log_info "Prompt: multi-step project+ticket flow"
echo ""

# Track tools seen
TOOLS_SEEN=""
STEP_COUNT=0

log_info "Starting agentic session..."
echo ""
echo "========================================"
echo "SSE EVENT STREAM"
echo "========================================"
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
          step=$(echo "$json" | jq -r '.data.step // "?"')
          echo -e "${BLUE}[Step $step]${NC} Starting..."
          ;;
        "tool:call")
          tool_name=$(echo "$json" | jq -r '.data.name // "unknown"')
          tool_args=$(echo "$json" | jq -c '.data.arguments // {}')
          echo -e "${GREEN}[Tool]${NC} $tool_name"
          echo "  Args: ${tool_args:0:120}"
          ;;
        "tool:result")
          tool_name=$(echo "$json" | jq -r '.data.name // "unknown"')
          status=$(echo "$json" | jq -r '.data.status // "unknown"')
          if [ "$status" = "executed" ]; then
            echo -e "${GREEN}[OK]${NC} $tool_name succeeded"
          elif [ "$status" = "failed" ]; then
            echo -e "${RED}[FAIL]${NC} $tool_name failed"
            echo "$json" | jq -r '.data.error // ""'
          else
            echo -e "${YELLOW}[???]${NC} $tool_name ($status)"
          fi
          ;;
        "summary")
          echo ""
          echo "========================================"
          echo "SUMMARY"
          echo "========================================"
          echo "$json" | jq -r '.data.summary // "No summary"'
          ;;
        "complete")
          echo ""
          total_steps=$(echo "$json" | jq -r '.data.totalSteps // "?"')
          total_tokens=$(echo "$json" | jq -r '.data.totalTokens // "?"')
          tool_calls=$(echo "$json" | jq -r '.data.toolCalls // [] | length')
          log_success "Complete: $total_steps steps, $tool_calls tool calls, $total_tokens tokens"

          # Validate expected tools were called
          tool_names=$(echo "$json" | jq -r '.data.toolCalls // [] | .[].name' 2>/dev/null)
          echo ""
          echo "--- Tool Call Sequence ---"
          echo "$tool_names" | nl
          echo ""

          # Check for expected tools
          for expected in create_project create_ticket; do
            if echo "$tool_names" | grep -q "$expected"; then
              log_success "Expected tool called: $expected"
            else
              log_warn "Expected tool NOT called: $expected"
            fi
          done
          ;;
        "error")
          log_error "$(echo "$json" | jq -r '.data.message // "Unknown"')"
          ;;
      esac
    fi
  done

echo ""
log_success "Test complete"
