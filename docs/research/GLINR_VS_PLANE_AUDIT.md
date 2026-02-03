# GLINR vs Plane Feature Audit

> **Date:** 2026-02-02 (Updated)
> **Purpose:** Identify feature gaps, integration needs, and roadmap priorities
> **Reference:** `/Users/gdsks/G-Development/GLINR-V3/plane-ref`

---

## Executive Summary

GLINR is **~75% feature-complete** compared to Plane for core project management.

### Recently Completed (2026-02-02)
- ✅ **Labels System** - Full labels table with hierarchy, API, and sync support
- ✅ **GitHub Comment Sync** - Bidirectional comment sync tracking
- ✅ **Repository Sync State** - Track sync status per repository
- ✅ **Webhook → Ticket Updates** - GitHub webhooks update existing tickets

### Primary Remaining Gaps:
1. **Custom States** - Fixed 6 statuses vs Plane's customizable workflow
2. **Multi-User** - Schema ready but UI/auth flows incomplete
3. **Views/Filters** - Basic filtering, no saved custom views
4. **Modules** - No equivalent (Plane groups issues by module/epic)
5. **Labels UI** - Backend ready, frontend picker needed

**Strengths over Plane:**
- AI-first architecture (task queue, agent adapters)
- GitHub Projects V2 import (Plane only imports issues)
- Built-in chat interface for AI interaction
- Lighter stack (TypeScript/Hono vs Django/Next.js)

---

## Feature Comparison Matrix

| Feature | GLINR | Plane | Gap |
|---------|-------|-------|-----|
| **Core** | | | |
| Projects with prefixes | ✅ Yes | ✅ Yes | - |
| Tickets/Issues | ✅ Yes | ✅ Yes | - |
| Comments | ✅ Yes | ✅ Yes | - |
| History/Audit trail | ✅ Yes | ✅ Yes | - |
| Sprints/Cycles | ✅ Yes | ✅ Yes | - |
| Kanban board | ✅ Yes | ✅ Yes | - |
| WIP limits | ✅ Yes | ❌ No | GLINR ahead |
| | | | |
| **Workflow** | | | |
| Custom states | ❌ Fixed 6 | ✅ Per-project | Need |
| State groups | ❌ No | ✅ Yes | Need |
| Labels system | ✅ Full model | ✅ Full model | Done |
| Parent labels | ✅ Yes | ✅ Yes | Done |
| Estimates/Points | ⚠️ Basic | ✅ Multiple systems | Need |
| Modules | ❌ No | ✅ Yes | Consider |
| | | | |
| **Views** | | | |
| List view | ✅ Yes | ✅ Yes | - |
| Board view | ✅ Yes | ✅ Yes | - |
| Table view | ✅ Yes | ✅ Yes | - |
| Calendar view | ❌ No | ✅ Yes | Nice-to-have |
| Gantt view | ❌ No | ✅ Yes | Nice-to-have |
| Spreadsheet view | ❌ No | ✅ Yes | Nice-to-have |
| Saved views | ❌ No | ✅ Yes | Need |
| | | | |
| **Users & Teams** | | | |
| User management | ⚠️ Schema only | ✅ Full | Need UI |
| Workspaces | ⚠️ Default only | ✅ Full | Consider |
| Roles (Admin/Member/Guest) | ❌ No | ✅ Yes | Need |
| Assignees | ✅ Single | ✅ Multiple | Need |
| Watchers | ❌ No | ✅ Yes | Need |
| | | | |
| **Integrations** | | | |
| GitHub Issues sync | ✅ Yes | ✅ Yes | - |
| GitHub Projects import | ✅ V2 GraphQL | ⚠️ Issues only | GLINR ahead |
| GitHub OAuth | ✅ Yes | ✅ Yes | - |
| Linear sync | ✅ Yes | ❌ No | GLINR ahead |
| Jira sync | ⚠️ Schema only | ❌ No | Same |
| Slack | ❌ No | ✅ Yes | Consider |
| | | | |
| **AI Features** | | | |
| Task queue | ✅ BullMQ | ❌ No | GLINR ahead |
| Agent adapters | ✅ Multiple | ❌ No | GLINR ahead |
| Chat interface | ✅ Yes | ❌ No | GLINR ahead |
| Auto-assignment | ✅ Yes | ❌ No | GLINR ahead |
| | | | |
| **Other** | | | |
| Pages/Docs | ❌ No | ✅ Rich editor | Consider |
| Notifications | ⚠️ Basic | ✅ Full | Need |
| Analytics | ⚠️ Basic | ✅ Full | Need |
| Export/Import | ✅ JSON | ✅ Multiple | - |
| Webhooks (outbound) | ✅ Yes | ✅ Yes | - |
| API tokens | ✅ Yes | ✅ Yes | - |

---

## Plane Models Analysis

### Core Models (What GLINR Should Match)

```
plane/db/models/
├── workspace.py      # Multi-tenant workspaces
├── project.py        # Projects with settings, members, features
├── issue.py          # 29KB - comprehensive issue model
├── state.py          # Custom workflow states
├── label.py          # Hierarchical labels
├── cycle.py          # Sprints with favorites, views
├── module.py         # Issue grouping (like epics)
├── estimate.py       # Story point systems
├── notification.py   # User notifications
├── page.py           # Documentation pages
├── view.py           # Saved filters/views
└── integration/      # External platform sync
    └── github.py     # GithubRepository, GithubIssueSync, etc.
```

### Plane GitHub Integration Model

```python
# 4 models for complete bidirectional sync:

class GithubRepository(ProjectBaseModel):
    name, url, config, repository_id, owner

class GithubRepositorySync(ProjectBaseModel):
    repository (FK)
    credentials (JSON)
    actor (FK User)        # Bot user for API calls
    workspace_integration  # Link to OAuth
    label (FK)             # Auto-apply label to synced issues

class GithubIssueSync(ProjectBaseModel):
    repo_issue_id          # GitHub issue number
    github_issue_id        # GitHub internal ID
    issue_url
    issue (FK Issue)       # GLINR ticket
    repository_sync (FK)

class GithubCommentSync(ProjectBaseModel):
    repo_comment_id
    comment (FK IssueComment)
    issue_sync (FK)
```

**Key Pattern:** Each external entity (repo, issue, comment) has its own sync tracking table. This allows:
- 1:1 mapping between platforms
- Conflict detection via timestamps
- Selective sync (can exclude certain issues)

---

## GLINR Current Integration State

### GitHub Integration (80% Complete)

**Implemented:**
- ✅ GitHub Projects V2 GraphQL client
- ✅ Repository listing
- ✅ Project import wizard (5-step UI)
- ✅ Token validation & storage
- ✅ Webhook signature verification
- ✅ Issue sync adapter (bidirectional)
- ✅ Field mapping (status, priority, type)

**Missing:**
- ❌ Ticket creation in import execute (stubbed)
- ❌ Comment sync tracking table
- ❌ Repository sync state management
- ❌ Selective sync (all-or-nothing)

### Linear Integration (70% Complete)

**Implemented:**
- ✅ GraphQL API client
- ✅ Team/project mapping
- ✅ Issue CRUD operations
- ✅ Webhook parsing
- ✅ Priority/status mapping

**Missing:**
- ❌ UI for connecting Linear
- ❌ Import wizard
- ❌ Cycle (sprint) sync

### Jira Integration (10% Complete)

**Implemented:**
- ✅ Webhook signature verification
- ✅ Schema references

**Missing:**
- ❌ Jira API client
- ❌ Issue sync adapter
- ❌ Project mapping
- ❌ UI flows

---

## Priority Implementation Roadmap

### Phase 1: Complete GitHub (High Priority)
1. **Ticket creation from import** - Complete the stubbed code
2. **Comment sync table** - Add to schema
3. **Repository sync state** - Track last sync, errors
4. **Webhook handler improvements** - Handle more events

### Phase 2: Labels System (High Priority)
1. **Labels table** - id, projectId, name, color, description, parentId
2. **Ticket-labels junction** - Many-to-many
3. **Label CRUD API** - Create, update, delete, merge
4. **UI components** - Label picker, manager, colors

### Phase 3: Custom States (Medium Priority)
1. **States table** - id, projectId, name, color, group, sequence
2. **State groups** - backlog, unstarted, started, completed, cancelled
3. **Per-project customization** - Add/remove/rename states
4. **Board auto-update** - Columns from project states

### Phase 4: Saved Views (Medium Priority)
1. **Views table** - id, projectId, name, filters, displaySettings
2. **View presets** - List, board, table with different filters
3. **User views** - Personal saved views
4. **Quick filters** - Status, priority, assignee buttons

### Phase 5: Multi-User (Lower Priority)
1. **Complete auth flows** - Login, register, password reset
2. **Project members** - Add/remove with roles
3. **Assignee improvements** - Multiple assignees, suggestions
4. **Notifications** - In-app + email

---

## Schema Additions Needed

```sql
-- Labels (like Plane)
CREATE TABLE labels (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  parent_id TEXT REFERENCES labels(id),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  description TEXT,
  sort_order REAL DEFAULT 65535,
  external_source TEXT,  -- 'github', 'linear', etc.
  external_id TEXT,
  created_at INTEGER,
  updated_at INTEGER,
  UNIQUE(project_id, name)
);

-- Ticket-Labels junction
CREATE TABLE ticket_labels (
  ticket_id TEXT REFERENCES tickets(id),
  label_id TEXT REFERENCES labels(id),
  PRIMARY KEY (ticket_id, label_id)
);

-- Custom States (like Plane)
CREATE TABLE states (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  slug TEXT,
  sequence REAL DEFAULT 65535,
  state_group TEXT DEFAULT 'backlog',  -- backlog, unstarted, started, completed, cancelled
  is_default INTEGER DEFAULT 0,
  created_at INTEGER,
  updated_at INTEGER,
  UNIQUE(project_id, name)
);

-- Saved Views
CREATE TABLE views (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  user_id TEXT REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  filters TEXT,           -- JSON: {status: [], priority: [], labels: [], etc.}
  display_settings TEXT,  -- JSON: {layout: 'board', groupBy: 'status', etc.}
  is_default INTEGER DEFAULT 0,
  access_level TEXT DEFAULT 'private',  -- private, project, public
  created_at INTEGER,
  updated_at INTEGER
);

-- GitHub Repository Sync (like Plane)
CREATE TABLE github_repository_syncs (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  repository_id INTEGER NOT NULL,
  repository_name TEXT NOT NULL,
  owner TEXT NOT NULL,
  credentials TEXT,        -- Encrypted JSON
  label_id TEXT REFERENCES labels(id),  -- Auto-apply label
  last_sync_at INTEGER,
  sync_status TEXT DEFAULT 'idle',  -- idle, syncing, error
  error_message TEXT,
  created_at INTEGER,
  updated_at INTEGER
);

-- GitHub Comment Sync
CREATE TABLE github_comment_syncs (
  id TEXT PRIMARY KEY,
  issue_sync_id TEXT REFERENCES ticket_external_links(id),
  comment_id TEXT REFERENCES ticket_comments(id),
  github_comment_id INTEGER NOT NULL,
  created_at INTEGER
);
```

---

## GitHub Integration Gaps (Detailed)

### Current Flow
```
1. User enters PAT or OAuth → Token stored
2. User selects GitHub Project V2 → Items fetched
3. User maps fields → Preview shown
4. User clicks Import → [STUB: Creates project only]
```

### Missing in Step 4
```typescript
// In src/routes/import.ts, the execute endpoint needs:

// 1. Create tickets from items
for (const item of items) {
  const ticket = await ticketService.createTicket({
    projectId: newProject.id,
    title: item.title,
    description: item.body,
    status: mapStatus(item.status),
    priority: mapPriority(item.priority),
    type: mapType(item.type),
    labels: item.labels,  // Need labels system first
  });

  // 2. Create external link
  await db.insert(ticketExternalLinks).values({
    id: generateId(),
    ticketId: ticket.id,
    platform: 'github',
    externalId: item.id,
    externalUrl: item.url,
    externalKey: `#${item.number}`,
    syncEnabled: true,
    syncDirection: 'bidirectional',
  });
}

// 3. Create sprints from iterations
for (const iteration of iterations) {
  const sprint = await sprintService.createSprint({
    projectId: newProject.id,
    name: iteration.title,
    startDate: iteration.startDate,
    endDate: addDays(iteration.startDate, iteration.duration),
  });

  // 4. Assign tickets to sprints
  const iterationTickets = items.filter(i => i.iteration === iteration.id);
  for (const ticket of iterationTickets) {
    await sprintService.addTicketToSprint(sprint.id, ticket.id);
  }
}
```

### Webhook Handler Improvements
```typescript
// Current: Creates tasks from webhooks
// Needed: Update existing synced tickets

// In src/integrations/github.ts
async handleIssueEvent(payload: WebhookPayload) {
  // Check if issue is already synced
  const existing = await db.query.ticketExternalLinks.findFirst({
    where: and(
      eq(ticketExternalLinks.platform, 'github'),
      eq(ticketExternalLinks.externalId, payload.issue.id.toString()),
    ),
  });

  if (existing) {
    // Update existing ticket
    await ticketService.updateTicket(existing.ticketId, {
      title: payload.issue.title,
      description: payload.issue.body,
      status: mapGitHubState(payload.issue.state),
    });
  } else if (shouldImport(payload)) {
    // Create new ticket (existing logic)
  }
}
```

---

## Comparison with Linear

| Feature | GLINR | Linear |
|---------|-------|--------|
| Issue tracking | ✅ | ✅ |
| Projects | ✅ | ✅ |
| Cycles (Sprints) | ✅ | ✅ |
| Custom states | ❌ | ✅ |
| Labels | ⚠️ | ✅ |
| Roadmaps | ❌ | ✅ |
| Sub-issues | ⚠️ Basic | ✅ Full |
| Issue relations | ❌ | ✅ |
| Triage | ❌ | ✅ |
| Inbox | ❌ | ✅ |
| SLAs | ❌ | ✅ |
| Automation rules | ❌ | ✅ |
| Keyboard shortcuts | ⚠️ Basic | ✅ Extensive |
| Command palette | ❌ | ✅ |
| AI features | ✅ Core | ⚠️ Add-on |

**Linear's Key Differentiators:**
1. Keyboard-first UX with extensive shortcuts
2. Command palette (⌘K) for quick actions
3. Triage/Inbox for incoming work
4. SLAs and automation rules
5. Issue relations (blocks, duplicates, relates)

**GLINR's Key Differentiators:**
1. AI agent integration (task queue, adapters)
2. GitHub Projects V2 import
3. Bidirectional sync engine
4. Chat interface for AI interaction

---

## Recommended Priority Order

### Immediate (This Week)
1. Complete GitHub import ticket creation
2. Add labels table and basic CRUD

### Short-term (This Month)
3. Labels UI (picker, colors, management)
4. Custom states per project
5. Saved views (filters as presets)

### Medium-term (Next Month)
6. Linear import wizard UI
7. Comment sync tracking
8. Multiple assignees
9. User notifications

### Future (Backlog)
10. Jira integration
11. Slack notifications
12. Calendar/Gantt views
13. Issue relations
14. Automation rules

---

## Files to Modify/Create

### Backend

| File | Action | Purpose |
|------|--------|---------|
| `src/storage/schema.ts` | MODIFY | Add labels, states, views tables |
| `src/labels/index.ts` | CREATE | Labels service |
| `src/routes/labels.ts` | CREATE | Labels API |
| `src/states/index.ts` | CREATE | Custom states service |
| `src/routes/states.ts` | CREATE | States API |
| `src/routes/import.ts` | MODIFY | Complete ticket creation |
| `src/tickets/index.ts` | MODIFY | Add labels support |

### Frontend

| File | Action | Purpose |
|------|--------|---------|
| `ui/src/core/types/index.ts` | MODIFY | Add Label, State types |
| `ui/src/core/api/client.ts` | MODIFY | Add labels, states API |
| `ui/src/features/labels/` | CREATE | Labels feature folder |
| `ui/src/features/settings/views/ProjectSettings.tsx` | CREATE | States config UI |
| `ui/src/components/shared/LabelPicker.tsx` | CREATE | Label selection component |

---

## Verification Checklist

After implementing each feature:

```bash
# Labels
curl -X POST http://localhost:3000/api/projects/{id}/labels \
  -d '{"name": "bug", "color": "#ff0000"}'

# Custom States
curl http://localhost:3000/api/projects/{id}/states

# GitHub Import (complete)
curl -X POST http://localhost:3000/api/import/github/projects/{id}/execute \
  -d '{"projectKey": "TEST", "projectName": "Test"}'
# Should create: project + tickets + sprints + external links

# Saved Views
curl -X POST http://localhost:3000/api/projects/{id}/views \
  -d '{"name": "My Bugs", "filters": {"type": "bug", "status": "open"}}'
```

---

*Document generated from codebase analysis of GLINR task manager and Plane reference.*
