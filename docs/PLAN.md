# GLINR Task Manager - Implementation Plan

> **Created:** 2026-02-01
> **Purpose:** Architecture and implementation guide for building the AI agent orchestrator

---

## Product Vision

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   GLINR Task Manager = AI Agent ORCHESTRATOR (not another AI agent)        │
│                                                                             │
│   ┌─────────────┐     ┌─────────────────────────┐     ┌─────────────────┐  │
│   │   GitHub    │     │                         │     │   Claude Code   │  │
│   │   Issues    │────▶│                         │────▶│   OpenClaw      │  │
│   ├─────────────┤     │    GLINR Task Manager   │     │   Gemini        │  │
│   │   Jira      │────▶│                         │────▶│   Ollama        │  │
│   │   Tickets   │     │  • Routes tasks         │     │   Devin         │  │
│   ├─────────────┤     │  • Tracks costs         │     └────────┬────────┘  │
│   │   Linear    │────▶│  • Stores summaries     │              │           │
│   │   Issues    │     │  • Links to PRs         │              ▼           │
│   └─────────────┘     │  • Manages versions     │     ┌─────────────────┐  │
│                       │                         │     │   Artifacts     │  │
│                       └───────────┬─────────────┘     │   • PRs         │  │
│                                   │                   │   • Commits     │  │
│                                   ▼                   │   • Deployments │  │
│                       ┌─────────────────────────┐     │   • Summaries   │  │
│                       │   Developer Dashboard   │     └─────────────────┘  │
│                       │   "What did AI do?"     │                          │
│                       └─────────────────────────┘                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Problem & Solution

| Pain Point | Current State | GLINR Solution |
|------------|---------------|----------------|
| **"What did the AI do?"** | Random MD files, scattered PRs | Unified task view with linked artifacts |
| **Token burn** | No visibility, surprise bills | Cost tracking per task, budget alerts |
| **Multi-agent chaos** | Each agent works in isolation | Coordinated routing, shared context |
| **No accountability** | Can't trace AI decisions | Full audit trail with summaries |
| **Manual version bumps** | Devs do it themselves | Smart semantic versioning |

---

## Integration Architecture

### Zero-Burn Integration Methods

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     ZERO-BURN INTEGRATION METHODS                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐     ┌──────────────────────┐                       │
│  │  Claude Code        │────▶│  1. MCP SERVER       │  ~50 tokens/call      │
│  │  (via MCP tools)    │     │  glinr__log_task     │  (structured report)  │
│  └─────────────────────┘     └──────────────────────┘                       │
│                                                                             │
│  ┌─────────────────────┐     ┌──────────────────────┐                       │
│  │  Claude Code        │────▶│  2. HOOKS            │  0 tokens             │
│  │  (PostToolUse)      │     │  Auto-intercept      │  (shell command)      │
│  └─────────────────────┘     └──────────────────────┘                       │
│                                                                             │
│  ┌─────────────────────┐     ┌──────────────────────┐                       │
│  │  OpenClaw/Devin     │────▶│  3. WEBHOOK          │  0 tokens             │
│  │  (HTTP POST)        │     │  POST /api/hook/*    │  (HTTP callback)      │
│  └─────────────────────┘     └──────────────────────┘                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### How Claude Reports to GLINR (This Session Example)

```
User: "Add MCP integration to roadmap"
       │
       ▼
┌─────────────────┐
│  Claude (me)    │──── Hook: PostToolUse ────▶ GLINR logs each Edit/Write
│  edits files    │     (0 tokens, shell cmd)
└────────┬────────┘
         │
         │ When I'm done, I could call:
         ▼
┌─────────────────┐
│  MCP tool call  │──── glinr__complete_task ──▶ GLINR stores:
│  ~50 tokens     │     - Summary of changes
└─────────────────┘     - Files modified
                        - PR link (if any)
                        - Token estimate
```

---

## Intelligence Layer (Where "Smartness" Comes From)

### The Problem

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  WHERE DOES THE "SMARTNESS" COME FROM?                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Claude does work ──▶ Hook sends raw data ──▶ ??? ──▶ GLINR creates task   │
│                                                 │                           │
│                                            WHO DECIDES:                     │
│                                            • What task to create?           │
│                                            • How to link to GitHub?         │
│                                            • What summary to write?         │
│                                            • Which PR this relates to?      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### The Solution: Tiered Intelligence

```
┌─────────────────────────────────────────────────────────────────┐
│  INTELLIGENCE ROUTING (tiered, cost-optimized)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Hook arrives ──▶ Rules Engine (70% handled, $0)               │
│       │                                                         │
│       │ Complex?                                                │
│       ▼                                                         │
│  Has Ollama? ──▶ Local LLM ($0)                                │
│       │                                                         │
│       │ No                                                      │
│       ▼                                                         │
│  Has Copilot? ──▶ Copilot Proxy ($0, user's subscription)      │
│       │                                                         │
│       │ No                                                      │
│       ▼                                                         │
│  Gemini Flash ──▶ $0.01/task (cheap fallback)                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Cost Comparison

| Layer | When Used | Cost |
|-------|-----------|------|
| Rules Engine | Always (first pass) | $0 |
| Ollama | If installed locally | $0 |
| Copilot Proxy | If user has subscription | $0 |
| Gemini Flash | Fallback only | ~$0.01/task |

**Expected cost for 1000 tasks:**
- 700 handled by rules: $0
- 200 handled by Ollama/Copilot: $0
- 100 need Gemini: $1

**Total: ~$1 for 1000 tasks vs $100+ if we burned Claude tokens**

---

## MCP Server Tools

```typescript
// GLINR MCP Server - tools it exposes
const tools = {
  // Claude calls this to log what it's working on
  'glinr__log_task': {
    description: 'Log current task to GLINR for tracking',
    input: { taskId: string, summary: string, filesChanged: string[] }
  },

  // Claude calls this when done
  'glinr__complete_task': {
    description: 'Mark task complete with summary',
    input: { taskId: string, summary: string, prUrl?: string }
  },

  // Claude calls this to report costs (optional)
  'glinr__report_usage': {
    description: 'Report token usage for cost tracking',
    input: { inputTokens: number, outputTokens: number, model: string }
  },

  // Claude calls this to get context from past tasks
  'glinr__get_context': {
    description: 'Get relevant past tasks for context',
    input: { query: string, limit?: number }
  }
}
```

---

## Hook Payload Schema

```json
// PostToolUse hook payload - DETERMINISTIC, no AI needed to parse
{
  "event": "PostToolUse",
  "tool": "Edit",
  "input": {
    "file_path": "/src/auth/github.ts",
    "old_string": "function login() {",
    "new_string": "async function login(): Promise<User> {"
  },
  "output": {
    "success": true,
    "lines_changed": 15
  },
  "timestamp": "2026-02-01T12:34:56Z",
  "session_id": "abc123"
}
```

---

## Rules Engine Examples

```typescript
// src/intelligence/rules.ts - NO AI NEEDED
function inferTaskFromHook(hook: HookPayload): TaskInference {
  // Pattern: File path tells us what it is
  if (hook.input.file_path.includes('/auth/')) {
    return { type: 'auth', component: 'authentication' };
  }
  if (hook.input.file_path.includes('.test.')) {
    return { type: 'test', component: 'testing' };
  }

  // Pattern: Tool tells us the action
  if (hook.tool === 'Write') {
    return { action: 'create' };
  }
  if (hook.tool === 'Edit') {
    return { action: 'modify' };
  }

  // Pattern: Git operations
  if (hook.tool === 'Bash' && hook.input.command.includes('git commit')) {
    return { action: 'commit', extractCommitMessage: true };
  }

  // Pattern: Link to issues via #123
  const issueMatch = hook.input?.toString().match(/#(\d+)/);
  if (issueMatch) {
    return { linkedIssue: issueMatch[1] };
  }
}
```

---

## MVP Definition

**Minimum Viable Product** = Phases 1 + 2 + 5 + 6 + 7 + 8 (partial)

At MVP:
- ✅ Tasks flow from GitHub/Jira to AI agents
- ✅ **MCP Server** for Claude Code integration (zero-burn tracking)
- ✅ **Hooks** for automatic activity capture
- ✅ Token costs are tracked per task
- ✅ Summaries are stored (not random MD files)
- ✅ PRs are linked to tasks
- ✅ Basic dashboard shows what AI did

---

## Implementation Order

### Phase 1: Core (Start Here)
1. Set up test coverage (Vitest)
2. Implement structured error types
3. Add structured logging

### Phase 2: MCP Integration (Critical Path)
1. Create MCP server (`src/mcp/server.ts`)
2. Implement hook endpoints (`/api/hook/*`)
3. Create rules engine (`src/intelligence/rules.ts`)

### Phase 3: Token Tracking
1. Create token tracker
2. Create pricing config
3. Add cost calculation

### Phase 4: GitHub Integration
1. GitHub OAuth flow
2. PR linking
3. Semantic versioning

---

## File Structure (Planned)

```
src/
├── adapters/           # AI agent adapters (existing)
├── auth/               # OAuth flows (NEW)
│   ├── github.ts
│   ├── jira.ts
│   └── linear.ts
├── costs/              # Token cost management (NEW)
│   ├── token-tracker.ts
│   ├── pricing.ts
│   └── budget.ts
├── hooks/              # Hook handlers (NEW)
│   ├── tool-use.ts
│   ├── session-end.ts
│   └── schemas.ts
├── intelligence/       # Smart inference (NEW)
│   ├── rules.ts
│   ├── ollama.ts
│   ├── copilot.ts
│   ├── gemini.ts
│   └── router.ts
├── mcp/                # MCP server (NEW)
│   └── server.ts
├── summaries/          # Summary management (NEW)
│   ├── extractor.ts
│   ├── templates.ts
│   └── storage.ts
├── versioning/         # Semantic versioning (NEW)
│   └── semver.ts
├── queue/              # BullMQ queue (existing)
├── integrations/       # Webhooks (existing)
├── types/              # TypeScript types
└── server.ts           # Hono server
```

---

## Resources

- [Claude Code MCP Docs](https://code.claude.com/docs/en/mcp)
- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks)
- [copilot-api (Copilot proxy)](https://github.com/ericc-ch/copilot-api)
- [LiteLLM Copilot Integration](https://docs.litellm.ai/docs/providers/github_copilot)
- [Langfuse MCP Tracing](https://langfuse.com/docs/observability/features/mcp-tracing)
