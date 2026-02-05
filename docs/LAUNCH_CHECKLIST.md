# GLINR Launch Checklist

> **Goal:** Stabilize, test, and prepare for OSS launch
> **Status:** In Progress
> **Target:** Ship when all critical items pass

---

## Test Status Summary

| Category | Passing | Failing | Skipped | Coverage |
|----------|---------|---------|---------|----------|
| Unit Tests | 257 | 0 | 5 | 54% |
| API Tests | 5/5 | 0 | - | N/A |
| Shell Tests | 4/4 | 0 | - | N/A |

**Status: ✅ ALL TESTS PASSING**

### Coverage Detail Progress

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Lines | 39.55% | 90% | 🟡 Improving |
| Functions | 22.5% | 90% | 🟡 Improving |

### Implementation Progress Tracking

| Module Path | Status | Passing | Coverage |
|-------------|--------|---------|----------|
| `src/storage/libsql.ts` | In Progress | 7/7 | 26.8% |
| `src/projects/index.ts` | In Progress | 7/7 | 49.1% |
| `src/tickets/index.ts` | In Progress | 6/6 | 38.4% |
| `src/costs/token-tracker.ts` | Tested | 3/3 | 95% |
| `src/browser/browser.ts` | Tested | 1/1 | 85% |

---

## Phase 1: Fix Failing Tests ✅ COMPLETE

### Fixed Tests

| File | Issue | Status |
|------|-------|--------|
| `task-failure.e2e.test.ts` | DLQ API changed to return `{tasks, total}` | ✅ FIXED |
| `task-queue.bench.test.ts` | Mock missing `initStorage` | ✅ FIXED |
| `failure-handler.test.ts` | DLQ tests | ✅ PASSING |
| `claude-code.test.ts` | Timeout due to mock issue | ✅ FIXED |

### Skipped Tests (Infrastructure-Dependent)

| File | Reason | How to Run |
|------|--------|-----------|
| `task-lifecycle.test.ts` | Requires Redis | `REDIS_URL=... pnpm test:e2e` |
| `task-queue.bench.test.ts` | Timing-sensitive benchmark | `pnpm test task-queue.bench` |

---

## Phase 2: API Regression Testing

### Authentication APIs

| Endpoint | Method | Test | Status | Notes |
|----------|--------|------|--------|-------|
| `/api/auth/login` | POST | Login with email/password | ⬜ | |
| `/api/auth/signup` | POST | Create new account | ⬜ | |
| `/api/auth/logout` | POST | End session | ⬜ | |
| `/api/auth/me` | GET | Get current user | ⬜ | |
| `/api/auth/github` | GET | GitHub OAuth start | ⬜ | |
| `/api/auth/github/callback` | GET | GitHub OAuth callback | ⬜ | |

### Tickets APIs

| Endpoint | Method | Test | Status | Notes |
|----------|--------|------|--------|-------|
| `/api/tickets` | GET | List tickets | ⬜ | |
| `/api/tickets` | POST | Create ticket | ⬜ | |
| `/api/tickets/:id` | GET | Get ticket detail | ⬜ | |
| `/api/tickets/:id` | PATCH | Update ticket | ⬜ | |
| `/api/tickets/:id` | DELETE | Delete ticket | ⬜ | |
| `/api/tickets/:id/comments` | GET | List comments | ⬜ | |
| `/api/tickets/:id/comments` | POST | Add comment | ⬜ | |
| `/api/tickets/:id/history` | GET | Get history | ⬜ | |
| `/api/tickets/:id/relations` | GET | Get relations | ⬜ | |
| `/api/tickets/:id/relations` | POST | Add relation | ⬜ | |
| `/api/tickets/:id/watchers` | GET | Get watchers | ⬜ | |
| `/api/tickets/:id/watchers` | POST | Add watcher | ⬜ | |
| `/api/tickets/bulk` | PATCH | Bulk update | ⬜ | |
| `/api/tickets/bulk` | DELETE | Bulk delete | ⬜ | |

### Projects APIs

| Endpoint | Method | Test | Status | Notes |
|----------|--------|------|--------|-------|
| `/api/projects` | GET | List projects | ⬜ | |
| `/api/projects` | POST | Create project | ⬜ | |
| `/api/projects/:id` | GET | Get project | ⬜ | |
| `/api/projects/:id` | PATCH | Update project | ⬜ | |
| `/api/projects/:id` | DELETE | Delete project | ⬜ | |
| `/api/projects/:id/sprints` | GET | List sprints | ⬜ | |
| `/api/projects/:id/sprints` | POST | Create sprint | ⬜ | |

### Tasks (Queue) APIs

| Endpoint | Method | Test | Status | Notes |
|----------|--------|------|--------|-------|
| `/api/tasks` | GET | List tasks | ⬜ | |
| `/api/tasks` | POST | Create task | ⬜ | |
| `/api/tasks/:id` | GET | Get task | ⬜ | |
| `/api/tasks/:id/cancel` | POST | Cancel task | ⬜ | |
| `/api/tasks/:id/retry` | POST | Retry task | ⬜ | |
| `/api/dlq` | GET | List DLQ | ⬜ | |
| `/api/dlq/:id/retry` | POST | Retry from DLQ | ⬜ | |

### Chat APIs

| Endpoint | Method | Test | Status | Notes |
|----------|--------|------|--------|-------|
| `/api/chat/conversations` | GET | List conversations | ⬜ | |
| `/api/chat/conversations` | POST | Create conversation | ⬜ | |
| `/api/chat/conversations/:id` | GET | Get conversation | ⬜ | |
| `/api/chat/conversations/:id/messages` | GET | Get messages | ⬜ | |
| `/api/chat/conversations/:id/messages` | POST | Send message | ⬜ | |
| `/api/chat/conversations/:id/stream` | POST | Stream response | ⬜ | |

### Agents APIs

| Endpoint | Method | Test | Status | Notes |
|----------|--------|------|--------|-------|
| `/api/agents` | GET | List agents | ⬜ | |
| `/api/agents/:id` | GET | Get agent | ⬜ | |
| `/api/agents/:id/health` | GET | Agent health | ⬜ | |

### Cron APIs

| Endpoint | Method | Test | Status | Notes |
|----------|--------|------|--------|-------|
| `/api/cron/jobs` | GET | List jobs | ⬜ | |
| `/api/cron/jobs` | POST | Create job | ⬜ | |
| `/api/cron/jobs/:id` | GET | Get job | ⬜ | |
| `/api/cron/jobs/:id` | DELETE | Delete job | ⬜ | |
| `/api/cron/jobs/:id/trigger` | POST | Trigger job | ⬜ | |
| `/api/cron/jobs/:id/pause` | POST | Pause job | ⬜ | |
| `/api/cron/templates` | GET | List templates | ⬜ | |

### Tools APIs

| Endpoint | Method | Test | Status | Notes |
|----------|--------|------|--------|-------|
| `/api/tools` | GET | List tools | ⬜ | |
| `/api/tools/:name` | GET | Get tool | ⬜ | |
| `/api/tools/execute` | POST | Execute tool | ⬜ | |
| `/api/tools/execute/stream` | POST | Execute streaming | ⬜ | |

### Memory APIs

| Endpoint | Method | Test | Status | Notes |
|----------|--------|------|--------|-------|
| `/api/memory/search` | POST | Search memory | ⬜ | |
| `/api/memory/stats` | GET | Memory stats | ⬜ | |
| `/api/memory/files` | GET | List memory files | ⬜ | |
| `/api/memory/sync` | POST | Sync memory | ⬜ | |

### Messaging Channel APIs

| Endpoint | Method | Test | Status | Notes |
|----------|--------|------|--------|-------|
| `/api/telegram/status` | GET | Telegram status | ⬜ | |
| `/api/telegram/webhook` | POST | Telegram webhook | ⬜ | |
| `/api/telegram/test` | POST | Test message | ⬜ | |
| `/api/discord/status` | GET | Discord status | ⬜ | |
| `/api/discord/interactions` | POST | Discord interactions | ⬜ | |
| `/api/discord/test` | POST | Test message | ⬜ | |
| `/api/whatsapp/status` | GET | WhatsApp status | ⬜ | |
| `/api/whatsapp/webhook` | GET | Verify webhook | ⬜ | |
| `/api/whatsapp/webhook` | POST | Receive message | ⬜ | |
| `/api/slack/status` | GET | Slack status | ⬜ | |
| `/api/slack/commands` | POST | Slash command | ⬜ | |

### Settings APIs

| Endpoint | Method | Test | Status | Notes |
|----------|--------|------|--------|-------|
| `/api/settings` | GET | Get all settings | ⬜ | |
| `/api/settings` | POST | Update settings | ⬜ | |
| `/api/settings/providers` | GET | List AI providers | ⬜ | |
| `/api/settings/providers/:id` | POST | Save provider config | ⬜ | |

### Health & Stats APIs

| Endpoint | Method | Test | Status | Notes |
|----------|--------|------|--------|-------|
| `/health` | GET | Basic health | ⬜ | |
| `/api/health/detailed` | GET | Detailed health | ⬜ | |
| `/api/stats` | GET | System stats | ⬜ | |
| `/api/costs` | GET | Cost summary | ⬜ | |

---

## Phase 3: Code Coverage Setup

### Vitest Coverage Configuration

```typescript
// vitest.config.ts additions
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.bench.ts',
        'src/types/**',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
    },
  },
});
```

### Coverage Goals

| Phase | Lines | Functions | Branches | Target Date | Progress |
|-------|-------|-----------|----------|-------------|----------|
| Current | 55.07% | 48.16% | 43.68% | - | 🟡 |
| Launch | 90% | 90% | 85% | Week 1 | 🟡 In Progress |

### 🛠️ In-Progress Test Coverage
| File Path | Tested | Status | Target Coverage |
|-----------|--------|--------|-----------------|
| `src/storage/libsql.ts` | 🟡 | In Progress | 90% |
| `src/storage/index.ts` | 🟡 | In Progress | 100% |
| `src/storage/schema.ts` | ⚪ | Pending | 100% |
| `src/server.ts` | ⚪ | Pending | 90% |
| `src/cli/index.ts` | ⚪ | Pending | 90% |
| `src/mcp/server.ts` | ⚪ | Pending | 90% |
| `src/scrapers/jina.ts` | ⚪ | Pending | 90% |

---

## Phase 4: Critical Path Testing

### User Flows to Test E2E

| Flow | Steps | Status |
|------|-------|--------|
| **New User Signup** | Signup → Login → Create Project → Create Ticket | ⬜ |
| **AI Chat** | Start Chat → Send Message → Receive Response → Tool Call | ⬜ |
| **Ticket Lifecycle** | Create → Assign → Comment → Transition → Close | ⬜ |
| **Webhook Integration** | Configure Telegram → Receive Message → Process → Reply | ⬜ |
| **Cron Job** | Create Job → Wait → Execute → Check History | ⬜ |
| **Import** | GitHub OAuth → Select Project → Map Fields → Import | ⬜ |

---

## Phase 5: Security Checklist

| Check | Status | Notes |
|-------|--------|-------|
| All endpoints require auth (except public) | ⬜ | |
| CORS configured correctly | ⬜ | |
| Rate limiting enabled | ⬜ | |
| SQL injection prevention | ⬜ | Parameterized queries |
| XSS prevention | ⬜ | Content sanitization |
| CSRF protection | ⬜ | Token validation |
| Secrets not in logs | ⬜ | Check all log statements |
| Webhook signatures verified | ⬜ | Telegram, Discord, WhatsApp |
| API tokens hashed | ⬜ | |
| Session management secure | ⬜ | HttpOnly, Secure cookies |

---

## Phase 6: Documentation

| Doc | Status | Notes |
|-----|--------|-------|
| README.md | ⬜ | Quick start, features |
| INSTALLATION.md | ⬜ | Docker, manual setup |
| API.md | ⬜ | Full API reference |
| CONFIGURATION.md | ⬜ | Env vars, settings |
| CONTRIBUTING.md | ⬜ | How to contribute |
| LICENSE | ⬜ | Apache 2.0 |
| CHANGELOG.md | ⬜ | Version history |

---

## Phase 7: Pre-Launch

| Task | Status | Notes |
|------|--------|-------|
| Clean up console.logs | ⬜ | |
| Remove debug code | ⬜ | |
| Update package.json metadata | ⬜ | |
| Create .env.example | ⬜ | |
| Test Docker build | ⬜ | |
| Test fresh install | ⬜ | |
| Create demo video | ⬜ | |
| Write launch post | ⬜ | |

---

## Test Commands

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test --coverage

# Run specific test file
pnpm test src/routes/tickets.test.ts

# Run in watch mode
pnpm test --watch

# Run E2E tests only
pnpm test --grep "e2e"
```

---

## API Test Script

```bash
#!/bin/bash
# Save as: scripts/api-test.sh

BASE_URL="${BASE_URL:-http://localhost:3000}"
TOKEN="${API_TOKEN:-}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

test_endpoint() {
  local method=$1
  local endpoint=$2
  local expected=$3
  local data=$4

  if [ -n "$data" ]; then
    response=$(curl -s -w "%{http_code}" -X "$method" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "$data" \
      "$BASE_URL$endpoint")
  else
    response=$(curl -s -w "%{http_code}" -X "$method" \
      -H "Authorization: Bearer $TOKEN" \
      "$BASE_URL$endpoint")
  fi

  status="${response: -3}"
  body="${response:0:${#response}-3}"

  if [ "$status" = "$expected" ]; then
    echo -e "${GREEN}✓${NC} $method $endpoint → $status"
    return 0
  else
    echo -e "${RED}✗${NC} $method $endpoint → $status (expected $expected)"
    echo "  Response: $body"
    return 1
  fi
}

echo "=== GLINR API Regression Tests ==="
echo "Base URL: $BASE_URL"
echo ""

# Health
echo "--- Health ---"
test_endpoint GET "/health" "200"
test_endpoint GET "/api/health/detailed" "200"

# Tickets
echo "--- Tickets ---"
test_endpoint GET "/api/tickets" "200"
test_endpoint POST "/api/tickets" "201" '{"title":"Test Ticket","description":"Test"}'

# Projects
echo "--- Projects ---"
test_endpoint GET "/api/projects" "200"

# Chat
echo "--- Chat ---"
test_endpoint GET "/api/chat/conversations" "200"

# Tools
echo "--- Tools ---"
test_endpoint GET "/api/tools" "200"

# Settings
echo "--- Settings ---"
test_endpoint GET "/api/settings" "200"

# Messaging
echo "--- Messaging ---"
test_endpoint GET "/api/telegram/status" "200"
test_endpoint GET "/api/discord/status" "200"
test_endpoint GET "/api/whatsapp/status" "200"

echo ""
echo "=== Test Complete ==="
```

---

## Progress Tracking

| Phase | Progress | Blocking Issues |
|-------|----------|-----------------|
| 1. Fix Tests | 100% | None |
| 2. API Testing | 10% | Tests being written |
| 3. Coverage | 55% | Aiming for 90% |
| 4. E2E Flows | 0% | After unit tests |
| 5. Security | 0% | Audit needed |
| 6. Docs | 35% | README exists |
| 7. Pre-Launch | 0% | After testing |

**Overall: ~25% complete**

---

## Next Actions

1. [ ] Fix the 16 failing tests
2. [ ] Set up coverage reporting
3. [ ] Create API test script
4. [ ] Run full regression
5. [ ] Fix any issues found
6. [ ] Update documentation
7. [ ] Prepare launch materials
