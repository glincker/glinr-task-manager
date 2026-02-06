# GLINR Task Manager - Antigravity Testing Session

Copy and paste this prompt to start Antigravity on testing the latest changes.

---

## Prompt for Antigravity

```
# GLINR Task Manager - Testing & Verification Session

## Context
You are testing GLINR Task Manager, an AI agent orchestrator. Read these docs first:
- docs/LAUNCH_CHECKLIST.md - Full testing queue (READ FIRST, especially "Antigravity Testing Queue" section)
- CLAUDE.md - Development guidelines
- docs/ROADMAP.md - Full roadmap

## Current State (2026-02-05)
466 unit tests passing, 10/10 API tests passing. Build clean.

### What Was Just Built (needs testing):

1. **In-App Notifications API** (6 new endpoints)
   - `src/routes/notifications.ts` - CRUD + mark-read + unread count
   - `src/storage/libsql.ts` - New `notifications` table
   - `ui/src/features/notifications/components/NotificationBell.tsx` - Real API via TanStack Query

2. **OpenAPI/Swagger Documentation**
   - `src/routes/openapi.ts` - Full spec + Swagger UI
   - Visit `/api/docs` in browser for interactive docs
   - `GET /api/docs/openapi.json` for raw spec

3. **Adaptive Effort Levels on Agentic Endpoint**
   - `effort` param: `low | medium | high | max`
   - Controls thinking budget tokens for AI responses

4. **Model Config Consolidation**
   - `src/providers/core/models.ts` is now canonical source
   - `src/providers/ai-sdk.ts` imports from core (no more duplicates)

5. **6 New UI Components** (ticket detail/list)
   - AssigneePicker, WatchersWidget, AttachmentsWidget
   - ReactionPicker, BulkActionBar, RelationsWidget

6. **Tool Call Status Fixes**
   - Tool call status now derives from result (error/pending/success)
   - UI tool cards show failed status when tool returns `success: false`

7. **Tickets Schema Fix**
   - Added `start_date` to tickets table for `GET /api/tickets`
   - Startup migration ensures existing DBs get the column

8. **Coverage Expansion**
   - Added tests for labels, states, and skills prompt/frontmatter utilities

## Your Task
Run through the testing queue in docs/LAUNCH_CHECKLIST.md under "Antigravity Testing Queue":

### Priority 1: Functional Testing
Test ticket listing stability:
1. GET /api/tickets?limit=20 - verify no SQLITE_ERROR for start_date

Test the new Notifications API:
1. POST /api/notifications with {"title":"Test Notification","type":"info","category":"system"}
2. GET /api/notifications - verify it appears
3. PATCH /api/notifications/:id/read - mark as read
4. GET /api/notifications/unread-count - verify count
5. POST /api/notifications/mark-all-read
6. DELETE /api/notifications/:id

Test Swagger UI:
1. Navigate to /api/docs - verify Swagger UI loads
2. GET /api/docs/openapi.json - verify valid JSON

Test Effort Levels:
1. POST /api/chat/conversations/:id/messages/agentic with "effort":"low" vs "effort":"max"
2. Compare response quality/depth

Test tool status rendering:
1. Trigger a tool with invalid args (e.g., web_search without query)
2. Verify tool card shows Failed status (not Success)

### Priority 2: UI Smoke Tests
Open the app and verify:
1. NotificationBell shows real data (not mock)
2. AssigneePicker opens and lists agents
3. WatchersWidget expands/collapses
4. AttachmentsWidget accepts drag-and-drop
5. BulkActionBar appears when selecting multiple tickets

### Priority 3: Regression
1. pnpm build - must pass
2. pnpm test - all 466 tests must pass (update count if changed)
3. cd docs/api-testing && ./run-all.sh --parallel

## Validation Workflow
For each test:
1. Document the request/response
2. Mark PASS or FAIL
3. If FAIL, describe the issue and expected vs actual behavior

## Commands
pnpm install    # Install dependencies
pnpm dev        # Start dev server (port 3000)
pnpm build      # Must pass
pnpm test       # 466 tests must pass
```

---

## Notes for User

1. **Copy the prompt above** and paste it into Antigravity's session
2. **Start the dev server first** with `pnpm dev` so API endpoints are available
3. **After testing**, Antigravity should report results in the session
4. **Test auth**: Login first via `POST /api/auth/login` or use setup wizard

## Expected Results

| Category | Expected |
|----------|----------|
| Build | Clean pass |
| Unit Tests | 466/466 passing |
| API Tests | 10/10 passing |
| Notifications API | 6/6 endpoints working |
| Swagger UI | Loads at /api/docs |
| UI Components | Render without errors |
