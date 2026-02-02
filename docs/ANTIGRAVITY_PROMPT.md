# GLINR Task Manager - Antigravity Session Prompt

Copy and paste this prompt to start Antigravity on the next phase of development.

---

## Prompt for Antigravity

```
# GLINR Task Manager - Implementation Session

## Context
You are working on GLINR Task Manager, an AI agent orchestrator. Read these docs first:
- docs/HANDOFF.md - Current status and recommended tasks (READ FIRST)
- docs/ROADMAP.md - Full roadmap with checklist
- CLAUDE.md - Development guidelines
- AGENTS.md - AI agent workflow

## Current State (2026-02-01)
Phase 5 (MCP Integration) is 75% complete. The following are DONE:
- ✅ MCP Server with 4 tools (glinr__log_task, glinr__complete_task, glinr__report_usage, glinr__get_context)
- ✅ Hook endpoints (tool-use, session-end, prompt-submit)
- ✅ Rules engine for pattern-based inference
- ✅ Linear webhook integration
- ✅ Example Claude settings and setup docs

## Your Task
Pick ONE of these independent tasks to implement:

### Option A: Token Cost Tracking (Phase 6) - RECOMMENDED
Create `src/costs/` directory:
1. `token-tracker.ts` - Track input/output tokens per task
2. `pricing.ts` - Model pricing config (Claude, GPT, Gemini rates)
3. Add `/api/costs/summary` endpoint

### Option B: Structured Summaries (Phase 7)
Create `src/summaries/` directory:
1. `src/types/summary.ts` - Zod schema for summaries
2. `src/summaries/extractor.ts` - Extract from agent output
3. Add `/api/summaries/*` endpoints

### Option C: Local LLM (Ollama) Integration
Create `src/intelligence/ollama.ts`:
1. Detect if Ollama running on localhost:11434
2. Use for summary generation (zero cost)
3. Create `src/intelligence/router.ts` to coordinate

## Validation Workflow
RESEARCH → VALIDATE → IMPLEMENT → VERIFY

Before implementing:
1. Check existing patterns in the codebase
2. Use Context7 for library validation
3. Follow patterns in AGENTS.md

After implementing:
1. Run `pnpm build` - must pass
2. Run `pnpm test` - should pass (some pre-existing failures ok)
3. Update docs/ROADMAP.md with [x] for completed items
4. Update docs/HANDOFF.md with your changes

## Important Files
- `src/server.ts` - Add new endpoints here
- `src/types/` - Add new types here
- `src/hooks/` - Reference for handler patterns
- `src/intelligence/rules.ts` - Reference for inference patterns

## DO NOT modify:
- package.json (unless absolutely necessary)
- tsconfig.json
- Existing working code in src/queue/, src/adapters/

## Commands
pnpm install    # Install dependencies
pnpm dev        # Start dev server
pnpm build      # Must pass before PR
pnpm test       # Run tests
```

---

## Notes for User

1. **Copy the prompt above** and paste it into Antigravity's session
2. **Let Antigravity pick** which option to work on
3. **After completion**, Antigravity should update HANDOFF.md
4. **To avoid overlap**, only one agent should work at a time on this repo

## Verification Checklist

After Antigravity completes work, verify:
- [ ] `pnpm build` passes
- [ ] New files follow existing patterns
- [ ] ROADMAP.md updated with completed items
- [ ] HANDOFF.md updated with changes
