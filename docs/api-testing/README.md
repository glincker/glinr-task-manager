# GLINR API Testing Framework

Scripts and tools for testing the GLINR chat API endpoints.

## Quick Start

```bash
# 1. Start the server (in another terminal)
pnpm dev

# 2. Make scripts executable
chmod +x *.sh

# 3. Setup (creates a test conversation)
./setup.sh

# 4. Run tests
./test-simple-chat.sh "Hello!"
./test-tools.sh "List files in src/"
./test-create-ticket.sh "Bug fix needed"
./test-agentic.sh "Create a high priority ticket"
```

## Scripts

### Shell Scripts

| Script | Description |
|--------|-------------|
| `setup.sh` | Creates a test conversation and stores ID |
| `test-simple-chat.sh` | Test basic chat without tools |
| `test-tools.sh` | Test chat with tool calling |
| `test-create-ticket.sh` | Test ticket creation flow |
| `test-agentic.sh` | Test agentic mode with SSE streaming |
| `config.sh` | Shared configuration and helpers |

### Python Framework

```bash
# Install dependency (optional, for pretty output)
pip install requests

# Run all tests
python glinr_test.py --test all

# Run specific test
python glinr_test.py --test ticket
python glinr_test.py --test tools --message "Search for TODO comments"

# Use as library
python
>>> from glinr_test import GlinrClient
>>> client = GlinrClient()
>>> conv = client.create_conversation()
>>> response = client.send_message_with_tools(conv, "Create ticket 'Bug'")
>>> print(response.tool_calls)
```

## Configuration

### Environment Variables

```bash
# Set custom base URL
export GLINR_BASE_URL="http://localhost:3000"

# Set default model (default: gpt4o-mini - Azure GPT-4o Mini)
export GLINR_MODEL="gpt4o-mini"  # Azure GPT-4o Mini (default)
# export GLINR_MODEL="gpt4o"     # Azure GPT-4o
# export GLINR_MODEL="sonnet"    # Anthropic Claude (requires ANTHROPIC_API_KEY)
# export GLINR_MODEL="groq"      # Groq (requires GROQ_API_KEY)
```

### Python CLI Options

```bash
python glinr_test.py --help
  --base-url URL    API base URL (default: http://localhost:3000)
  --model MODEL     Model alias (default: sonnet)
  --test TEST       Test to run: all, health, chat, tools, ticket
  --message MSG     Custom message for chat tests
```

### State File

The `.test-state.json` file stores:
- Current conversation ID
- Last test run info

Delete this file to reset state: `rm .test-state.json`

## Common Issues

### Tools Not Being Called

If `test-create-ticket.sh` shows "NO TOOLS WERE CALLED", the issue is likely:

1. **Model doesn't support tools** - Check model compatibility
2. **System prompt issue** - Tools not enabled in system prompt
3. **Tool definitions missing** - Check `/api/chat/tools` returns tools

Debug with:
```bash
# Check available tools
curl http://localhost:3000/api/chat/tools | jq

# Check model being used
curl http://localhost:3000/api/chat/models | jq
```

### Connection Refused

```bash
# Make sure server is running
pnpm dev

# Check health endpoint
curl http://localhost:3000/health
```

## API Endpoints Tested

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat/conversations` | POST | Create conversation |
| `/api/chat/conversations/:id` | GET | Get conversation |
| `/api/chat/conversations/:id/messages` | POST | Send message (no tools) |
| `/api/chat/conversations/:id/messages/with-tools` | POST | Send message (with tools) |
| `/api/chat/conversations/:id/messages/agentic` | POST | Agentic mode (SSE) |
| `/api/chat/tools` | GET | List available tools |

## Adding New Tests

### Shell Script

```bash
#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "${SCRIPT_DIR}/config.sh"

check_server || exit 1
CONV_ID=$(get_conversation_id) || exit 1

# Your test logic here
response=$(api_request "POST" "/chat/conversations/$CONV_ID/messages" '{
  "content": "Your test message"
}')

echo "$response" | pretty_json
```

### Python

```python
def test_my_feature(self) -> Dict:
    """Test description"""
    conv_id = self.client.get_or_create_conversation()
    response = self.client.send_message_with_tools(conv_id, "Test message")

    # Assertions
    if not response.tool_calls:
        raise Exception("Expected tool calls")

    return {"result": "data"}
```

## Debugging Tool Execution

The `test-create-ticket.sh` saves full response to `.last-create-ticket-response.json`:

```bash
# Run test
./test-create-ticket.sh

# Inspect full response
cat .last-create-ticket-response.json | jq '.toolCalls'
```
