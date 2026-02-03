# AI-Native Ticket System Research

> **Research Date:** 2026-02-02
> **Goal:** Build an AI-driven ticket system that syncs with Jira/Linear/GitHub

---

## Executive Summary

GLINR will evolve from "AI agent orchestrator" to "AI-native ticket system" where:
- **AI agents create/manage tickets** (not humans clicking)
- **Bi-directional sync** with existing PM tools (Jira, Linear, GitHub, Plane)
- **Unified comment view** aggregating activity from all platforms
- **AI responds to comments** and moves tickets through states

---

## Market Analysis

### The Opportunity

1. **Atlassian forcing migration** - Jira Data Center licenses ending March 2026, full shutdown 2029
2. **"Jira fatigue"** documented phenomenon - complexity, pricing, steep learning curve
3. **AI features retrofitted** - existing tools added AI as afterthought, not built AI-first
4. **Open source alternatives growing** - Plane (38.6K GitHub stars), NocoBase (21K stars)

### Competitors

| Tool | Approach | Gap |
|------|----------|-----|
| **DevRev** | AI-driven product ops | Enterprise-focused, not for solo devs |
| **Taskade** | AI agents + tasks | General productivity, not dev-specific |
| **Plane** | Open source + AI assistant | AI assists humans, doesn't drive |
| **Linear** | Clean UI, dev-focused | AI features limited, still human-driven |

### GLINR's Differentiation

**Everyone builds:** "PM tool + AI assistant"
**GLINR builds:** "AI-native where AI drives, human reviews"

---

## Reference Implementation: Plane

### Why Plane?
- 38.6K GitHub stars, production-ready
- Open source (Apache 2.0)
- Has MCP server for AI integration
- Clean architecture patterns

### Plane's Issue Schema (from their webhook payload)

```typescript
interface PlaneIssue {
  id: string;
  name: string;                    // title
  description_html: string;        // rich text
  priority: 'urgent' | 'high' | 'medium' | 'low' | 'none';
  state: {
    id: string;
    name: string;                  // "In Progress", "Done"
    color: string;
  };
  assignees: string[];             // user IDs
  labels: string[];                // label IDs

  // KEY: External system linking
  external_source: string;         // "github", "jira", "linear"
  external_id: string;             // ID in that system

  // Dates
  start_date: string;
  target_date: string;
  created_at: string;
  updated_at: string;
}
```

### Plane MCP Server Tools

```python
# AI agents create/update tickets via MCP
create_work_item(
    project_id="...",
    name="Implement OAuth2",
    external_source="github",
    external_id="issue-456",
    priority="HIGH"
)

update_work_item(
    work_item_id="...",
    state="in-progress-state-uuid",
    assignees=["user-uuid-1"]
)
```

### Plane Webhook Events

- `issue.created` - New issue created
- `issue.updated` - Issue modified (with field diff)
- `issue.deleted` - Issue removed
- `issue_comment.created` - Comment added

---

## GLINR Universal Schema Design

### Core Ticket Type

```typescript
interface GlinrTicket {
  // === Core Identity ===
  id: string;                      // GLINR internal UUID
  sequence: number;                // Human-readable: GLINR-123

  // === Content ===
  title: string;
  description: string;             // Markdown
  descriptionHtml: string;         // Rendered HTML

  // === Classification ===
  type: 'task' | 'bug' | 'feature' | 'epic' | 'story';
  priority: 'critical' | 'high' | 'medium' | 'low' | 'none';
  status: string;                  // Custom states per workspace
  labels: string[];

  // === Assignment ===
  assignee?: string;               // User ID
  assigneeAgent?: string;          // AI agent ID (Claude, OpenClaw)

  // === Relationships ===
  parentId?: string;               // Epic/parent ticket
  linkedPRs: string[];             // GitHub PR URLs
  linkedCommits: string[];         // Commit SHAs
  linkedBranch?: string;           // Working branch

  // === External Links (Multi-platform sync) ===
  externalLinks: ExternalLink[];   // 1 ticket → N platforms

  // === Timestamps ===
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;

  // === AI Metadata ===
  createdBy: 'human' | 'ai';
  aiAgent?: string;                // Which agent created it
  aiSessionId?: string;            // Link to Claude session

  // === Activity ===
  comments: Comment[];             // Unified from all sources
  history: HistoryEntry[];         // All changes tracked
}
```

### External Link Type

```typescript
interface ExternalLink {
  platform: 'jira' | 'linear' | 'github' | 'plane' | 'monday';
  externalId: string;              // PROJ-123, LIN-456, #789
  externalUrl: string;             // Full URL
  syncEnabled: boolean;            // Auto-sync changes?
  syncDirection: 'push' | 'pull' | 'bidirectional';
  lastSyncedAt?: Date;
}
```

### Unified Comment Type

```typescript
interface Comment {
  id: string;
  content: string;
  contentHtml: string;
  author: {
    type: 'human' | 'ai';
    name: string;
    platform: string;              // Where comment originated
  };
  source: 'glinr' | 'jira' | 'linear' | 'github';
  externalId?: string;             // ID in source system
  createdAt: Date;

  // AI response capability
  isAiResponse?: boolean;
  respondingTo?: string;           // Comment ID it's replying to
}
```

---

## Status Mapping (Cross-Platform)

```typescript
const STATUS_MAP = {
  // GLINR status → External platform status
  'backlog':     { jira: 'To Do',       linear: 'Backlog',     github: 'open' },
  'todo':        { jira: 'To Do',       linear: 'Todo',        github: 'open' },
  'in_progress': { jira: 'In Progress', linear: 'In Progress', github: 'open' },
  'in_review':   { jira: 'In Review',   linear: 'In Review',   github: 'open' },
  'done':        { jira: 'Done',        linear: 'Done',        github: 'closed' },
  'cancelled':   { jira: 'Cancelled',   linear: 'Cancelled',   github: 'closed' },
};
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    GLINR TICKET ORCHESTRATOR                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   AI AGENTS (CREATE/UPDATE)          EXTERNAL SYSTEMS (SYNC)    │
│   ┌─────────────┐                    ┌─────────────┐            │
│   │ Claude Code │──┐                 │    Jira     │◄──┐        │
│   │   (MCP)     │  │                 └─────────────┘   │        │
│   └─────────────┘  │                 ┌─────────────┐   │        │
│   ┌─────────────┐  │  ┌──────────┐   │   Linear    │◄──┤        │
│   │   Cursor    │──┼─►│  GLINR   │◄─►└─────────────┘   │ SYNC   │
│   │   (API)     │  │  │ TICKETS  │   ┌─────────────┐   │ ENGINE │
│   └─────────────┘  │  └──────────┘   │   GitHub    │◄──┤        │
│   ┌─────────────┐  │       │         │   Issues    │   │        │
│   │  OpenClaw   │──┘       │         └─────────────┘   │        │
│   │   (Shell)   │          │         ┌─────────────┐   │        │
│   └─────────────┘          ▼         │    Plane    │◄──┘        │
│                     ┌──────────┐     └─────────────┘            │
│                     │ UNIFIED  │                                │
│                     │   VIEW   │                                │
│                     │ Comments │                                │
│                     │ Activity │                                │
│                     │ History  │                                │
│                     └──────────┘                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## AI Integration Flow

```
1. Claude Code starts working on a feature
   ↓
2. MCP call: glinr.create_ticket({
     title: "Implement OAuth2",
     type: "feature",
     aiAgent: "claude-code",
     aiSessionId: "session-xyz"
   })
   ↓
3. GLINR creates ticket GLINR-456
   ↓
4. User has Linear connected → GLINR pushes to Linear → LIN-789 created
   ↓
5. Teammate comments on LIN-789 in Linear
   ↓
6. GLINR webhook receives comment → shows in GLINR UI
   ↓
7. AI (Ollama) analyzes comment → auto-responds OR notifies Claude Code
   ↓
8. Claude Code completes work → updates ticket via MCP
   ↓
9. GLINR syncs status "done" → Linear LIN-789 also marked Done
```

---

## Plane Reference: Pros & Cons

### Pros (Learn From)
- Clean webhook schema with `external_source`/`external_id`
- MCP server pattern for AI integration
- Modular architecture (work items, comments, attachments separate)
- State machine for ticket status
- Activity log captures all changes

### Cons (Improve On)
- Still human-centric (AI assists, doesn't drive)
- No AI auto-response to comments
- No multi-platform sync (only import from Jira)
- Heavy UI (we can be lighter for developers)

---

## Implementation Priority

### Phase 16.1: Universal Schema (Week 1)
- [ ] `src/tickets/types.ts` - TypeScript types
- [ ] `src/storage/schema.ts` - Add tickets, external_links, ticket_comments tables
- [ ] Migrations

### Phase 16.2: MCP Ticket Tools (Week 1-2)
- [ ] `glinr.create_ticket`
- [ ] `glinr.update_ticket`
- [ ] `glinr.add_comment`
- [ ] `glinr.link_external`

### Phase 16.3: Sync Engine (Week 2-3)
- [ ] `src/sync/engine.ts` - Core sync logic
- [ ] Linear adapter
- [ ] GitHub Issues adapter
- [ ] Jira adapter (later)

### Phase 16.4: UI (Week 3-4)
- [ ] Ticket list view (simple table, not Kanban initially)
- [ ] Ticket detail with unified comments
- [ ] "Create in Linear" button
- [ ] External link status badges

---

## References

- [Plane GitHub](https://github.com/makeplane/plane) - 38.6K stars
- [Plane MCP Server](https://github.com/makeplane/plane-mcp-server)
- [Plane Developer Docs](https://github.com/makeplane/developer-docs)
- [Linear Jira Sync](https://linear.app/docs/jira)
- [Unito Integration Guide](https://unito.io/blog/how-to-integrate-github-and-jira/)
- [Exalate Sync Patterns](https://exalate.com/blog/jira-github-issues-integration/)

---

## Next Steps

1. Clone Plane repo for reference: `git clone https://github.com/makeplane/plane.git`
2. Study their Django models and API structure
3. Adapt schema patterns for our TypeScript/Drizzle stack
4. Start with tickets table + MCP tools
5. Add sync later (Linear first, easiest API)
