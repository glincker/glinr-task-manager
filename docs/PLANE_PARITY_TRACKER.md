# GLINR Plane Parity Tracker

> Tracking implementation of PM features from Plane to make GLINR competitive as a full project management solution while keeping our AI-native advantage.
>
> **Last Updated:** 2026-02-05
> **Comparison Doc:** [PLANE_COMPARISON.md](./research/PLANE_COMPARISON.md)

---

## Implementation Status

### Legend
- ✅ Complete
- 🚧 In Progress
- 📋 Planned
- ❌ Not Started
- ⏭️ Deferred

---

## Phase A: Core PM Parity (Q1 2026)

**Goal**: Make tickets competitive with Plane for basic project management.

| # | Feature | Status | Backend | Frontend | Priority |
|---|---------|--------|---------|----------|----------|
| A1 | Issue relations (blocks, relates, duplicates) | ✅ | ✅ `ticket_relations` table | ✅ RelationsWidget | High |
| A2 | Estimate points (story points) | ✅ | ✅ Already exists | ✅ EstimateSelect | High |
| A3 | Start date field | ✅ | ✅ `startDate` column | 📋 UI needed | Medium |
| A4 | Multi-assignee | ✅ | ✅ `ticket_assignees` table | 📋 UI needed | High |
| A5 | Bulk operations | ✅ | ✅ API exists | 📋 UI needed | Medium |
| A6 | Attachments | ✅ | ✅ `ticket_attachments` table | 📋 UI needed | Medium |
| A7 | Reactions | ✅ | ✅ `ticket_reactions` table | 📋 UI needed | Low |
| A8 | Watchers/Subscribers | ✅ | ✅ `ticket_watchers` table | 📋 UI needed | Medium |
| A9 | Mentions | ✅ | ✅ `ticket_mentions` table | 📋 UI needed | Medium |

**Summary**: Backend complete for most. Need frontend components.

---

## Phase B: Views & Organization (Q1-Q2 2026)

**Goal**: Rich visualization and filtering capabilities.

| # | Feature | Status | Backend | Frontend | Priority |
|---|---------|--------|---------|----------|----------|
| B1 | Saved views | ❌ | Need table + API | Need UI | High |
| B2 | Modules/Epics | ❌ | Need table + API | Need UI | High |
| B3 | Calendar view | ❌ | API ready (has dates) | Need UI | Medium |
| B4 | Gantt chart | ❌ | API ready (has dates) | Need UI | Medium |
| B5 | Advanced filters (15+ fields) | 🚧 | Partial (8 fields) | Need UI | High |
| B6 | Display property toggles | ❌ | Need user prefs | Need UI | Medium |
| B7 | Group by options | 🚧 | Partial | Need UI | Medium |
| B8 | Spreadsheet/Table view | ❌ | API ready | Need UI | Low |

---

## Phase C: Collaboration (Q2 2026)

**Goal**: Team communication and awareness features.

| # | Feature | Status | Backend | Frontend | Priority |
|---|---------|--------|---------|----------|----------|
| C1 | In-app notifications | ❌ | Need table + API | Need UI | High |
| C2 | Outbound webhooks | ❌ | Need table + API | Need UI | High |
| C3 | Email notifications | ❌ | Need service | Need prefs | Medium |
| C4 | Notification preferences | ❌ | Need table | Need UI | Medium |
| C5 | @mentions in comments | 🚧 | Backend done | Need UI | Medium |
| C6 | Activity feed | ✅ | ✅ `ticket_history` | 📋 UI widget | Medium |

---

## Phase D: Advanced Features (Q2-Q3 2026)

**Goal**: Enterprise-grade PM capabilities.

| # | Feature | Status | Backend | Frontend | Priority |
|---|---------|--------|---------|----------|----------|
| D1 | Pages/Wiki | ❌ | Need table + API | Need editor | High |
| D2 | Advanced analytics | 🚧 | Basic stats | Need charts | Medium |
| D3 | CSV import | ❌ | Need parser + API | Need wizard | Medium |
| D4 | JSON import | ❌ | Need parser + API | Need wizard | Medium |
| D5 | Multi-format export | 🚧 | CSV done | JSON/XLSX needed | Low |
| D6 | Inbox/Intake triage | ❌ | Need table + API | Need UI | Low |
| D7 | Draft issues | ❌ | Need table + API | Need UI | Low |
| D8 | Custom fields | ❌ | Need table + API | Need UI | Low |
| D9 | Time tracking | ❌ | Need columns + API | Need UI | Low |
| D10 | Workflow automation | ❌ | Need engine | Need UI | Low |

---

## Detailed Implementation Plans

### A2: Estimate Points

**Schema changes** (`src/storage/libsql.ts`):
```sql
ALTER TABLE tickets ADD COLUMN estimate_points INTEGER;
-- Values: null, 0, 1, 2, 3, 5, 8, 13, 21 (Fibonacci)
```

**Type changes** (`src/tickets/types.ts`):
```typescript
export const ESTIMATE_OPTIONS = [0, 1, 2, 3, 5, 8, 13, 21] as const;
export type EstimatePoints = typeof ESTIMATE_OPTIONS[number] | null;

// Add to CreateTicketSchema and UpdateTicketSchema
estimatePoints: z.number().refine(v => ESTIMATE_OPTIONS.includes(v)).nullable().optional(),
```

**API changes** (`src/routes/tickets.ts`):
- Add to create/update handlers
- Add to query filters: `?estimatePoints=3,5,8`
- Add to list response

**UI changes** (`ui/src/features/tickets/`):
- `components/EstimateSelect.tsx` - Dropdown with Fibonacci values
- Add to `CreateTicketModal.tsx`
- Add to `TicketDetail.tsx` inline edit
- Add to `TicketList.tsx` column (optional)

**Sprint integration**:
- Sum estimate points for sprint capacity
- Show in burndown chart

---

### B1: Saved Views

**Schema** (`src/storage/libsql.ts`):
```sql
CREATE TABLE IF NOT EXISTS saved_views (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  project_id TEXT REFERENCES projects(id),

  -- Filter configuration (JSON)
  filters TEXT NOT NULL DEFAULT '{}',
  -- { status: ['todo', 'in_progress'], priority: ['high'], assignee: [...] }

  -- Display configuration
  layout TEXT NOT NULL DEFAULT 'list', -- 'list' | 'kanban' | 'calendar' | 'gantt'
  group_by TEXT, -- 'status' | 'priority' | 'assignee' | 'label' | null
  sort_by TEXT DEFAULT 'createdAt',
  sort_order TEXT DEFAULT 'desc',
  display_properties TEXT NOT NULL DEFAULT '["title","status","priority","assignee"]',

  -- Access control
  is_public INTEGER DEFAULT 0,
  is_locked INTEGER DEFAULT 0, -- Prevent editing

  -- Appearance
  icon TEXT,
  color TEXT,

  -- Ownership
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX idx_saved_views_project ON saved_views(project_id);
CREATE INDEX idx_saved_views_created_by ON saved_views(created_by);
```

**Types** (`src/views/types.ts`):
```typescript
export const ViewLayout = z.enum(['list', 'kanban', 'calendar', 'gantt', 'table']);
export const GroupBy = z.enum(['status', 'priority', 'assignee', 'label', 'sprint', 'module', 'none']);

export const ViewFilters = z.object({
  status: z.array(TicketStatus).optional(),
  priority: z.array(TicketPriority).optional(),
  type: z.array(TicketType).optional(),
  assignee: z.array(z.string()).optional(),
  labels: z.array(z.string()).optional(),
  sprint: z.string().optional(),
  module: z.string().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  dueAfter: z.string().datetime().optional(),
  dueBefore: z.string().datetime().optional(),
  hasEstimate: z.boolean().optional(),
  search: z.string().optional(),
});

export const SavedView = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  projectId: z.string().optional(),
  filters: ViewFilters,
  layout: ViewLayout,
  groupBy: GroupBy.optional(),
  sortBy: z.string(),
  sortOrder: z.enum(['asc', 'desc']),
  displayProperties: z.array(z.string()),
  isPublic: z.boolean(),
  isLocked: z.boolean(),
  icon: z.string().optional(),
  color: z.string().optional(),
  createdBy: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});
```

**API** (`src/routes/views.ts`):
```
GET    /views              - List views (project or global)
POST   /views              - Create view
GET    /views/:id          - Get view
PATCH  /views/:id          - Update view
DELETE /views/:id          - Delete view
POST   /views/:id/duplicate - Clone view
```

**UI** (`ui/src/features/views/`):
```
views/
├── components/
│   ├── ViewSelector.tsx      - Dropdown to switch views
│   ├── ViewFiltersBar.tsx    - Active filter chips
│   ├── ViewFiltersPanel.tsx  - Filter configuration panel
│   ├── CreateViewModal.tsx   - Create/save view
│   └── ViewSettingsSheet.tsx - Edit view settings
├── hooks/
│   └── useViews.ts           - TanStack Query hooks
└── views/
    └── ViewsManager.tsx      - List all views (settings)
```

---

### B2: Modules/Epics

**Schema** (`src/storage/libsql.ts`):
```sql
CREATE TABLE IF NOT EXISTS modules (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  name TEXT NOT NULL,
  description TEXT,

  -- Status (like Plane)
  status TEXT NOT NULL DEFAULT 'planned',
  -- 'backlog' | 'planned' | 'in_progress' | 'paused' | 'completed' | 'cancelled'

  -- Timeline
  start_date INTEGER,
  target_date INTEGER,

  -- Appearance
  icon TEXT,
  color TEXT,

  -- Tracking
  lead_id TEXT, -- Primary owner

  -- Metadata
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Module members (multiple owners/contributors)
CREATE TABLE IF NOT EXISTS module_members (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- 'lead' | 'member'
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Module-ticket association (many-to-many)
CREATE TABLE IF NOT EXISTS module_tickets (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  UNIQUE(module_id, ticket_id)
);

-- Module links (external resources)
CREATE TABLE IF NOT EXISTS module_links (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX idx_modules_project ON modules(project_id);
CREATE INDEX idx_module_tickets_module ON module_tickets(module_id);
CREATE INDEX idx_module_tickets_ticket ON module_tickets(ticket_id);
```

**API** (`src/routes/modules.ts`):
```
GET    /modules                    - List modules (by project)
POST   /modules                    - Create module
GET    /modules/:id                - Get module with stats
PATCH  /modules/:id                - Update module
DELETE /modules/:id                - Delete module

GET    /modules/:id/tickets        - List module tickets
POST   /modules/:id/tickets        - Add ticket to module
DELETE /modules/:id/tickets/:ticketId - Remove ticket

GET    /modules/:id/members        - List members
POST   /modules/:id/members        - Add member
DELETE /modules/:id/members/:userId - Remove member

GET    /modules/:id/links          - List links
POST   /modules/:id/links          - Add link
DELETE /modules/:id/links/:linkId  - Remove link
```

**UI** (`ui/src/features/modules/`):
```
modules/
├── components/
│   ├── ModuleCard.tsx         - Module summary card
│   ├── ModuleProgress.tsx     - Progress bar with stats
│   ├── ModuleStatusBadge.tsx  - Status indicator
│   ├── CreateModuleModal.tsx
│   ├── ModuleTicketPicker.tsx - Add tickets to module
│   └── ModuleTimeline.tsx     - Date range visualization
├── views/
│   ├── ModuleList.tsx         - List all modules
│   └── ModuleDetail.tsx       - Module detail with tickets
└── hooks/
    └── useModules.ts
```

---

### C1: In-App Notifications

**Schema** (`src/storage/libsql.ts`):
```sql
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,

  -- What triggered it
  entity_type TEXT NOT NULL, -- 'ticket' | 'comment' | 'module' | 'sprint' | 'mention'
  entity_id TEXT NOT NULL,

  -- Content
  title TEXT NOT NULL,
  message TEXT,

  -- Who triggered it
  triggered_by TEXT, -- user/agent ID
  triggered_by_type TEXT, -- 'human' | 'ai'

  -- Status
  is_read INTEGER DEFAULT 0,
  is_snoozed INTEGER DEFAULT 0,
  snoozed_until INTEGER,
  is_archived INTEGER DEFAULT 0,

  -- Metadata
  data TEXT, -- JSON with entity-specific data

  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,

  -- Granular preferences
  ticket_assigned INTEGER DEFAULT 1,
  ticket_mentioned INTEGER DEFAULT 1,
  ticket_status_changed INTEGER DEFAULT 1,
  ticket_commented INTEGER DEFAULT 1,
  ticket_completed INTEGER DEFAULT 1,

  module_assigned INTEGER DEFAULT 1,
  sprint_started INTEGER DEFAULT 1,
  sprint_ending INTEGER DEFAULT 1,

  -- Delivery channels
  in_app INTEGER DEFAULT 1,
  email INTEGER DEFAULT 0,
  slack INTEGER DEFAULT 0,

  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

  UNIQUE(user_id)
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_entity ON notifications(entity_type, entity_id);
```

**API** (`src/routes/notifications.ts`):
```
GET    /notifications              - List notifications (paginated)
GET    /notifications/unread-count - Count unread
POST   /notifications/mark-read    - Mark as read (single or bulk)
POST   /notifications/mark-all-read
POST   /notifications/:id/snooze   - Snooze until time
POST   /notifications/:id/archive

GET    /notifications/preferences  - Get preferences
PATCH  /notifications/preferences  - Update preferences
```

**UI** (`ui/src/features/notifications/`):
```
notifications/
├── components/
│   ├── NotificationBell.tsx      - Header bell with unread count
│   ├── NotificationDropdown.tsx  - Quick view dropdown
│   ├── NotificationItem.tsx      - Single notification row
│   ├── NotificationFilters.tsx   - Filter by type/status
│   └── NotificationPrefsForm.tsx
├── views/
│   └── NotificationCenter.tsx    - Full page notification center
└── hooks/
    └── useNotifications.ts       - Query + SSE subscription
```

**Real-time**: Extend existing SSE to include notification events.

---

### C2: Outbound Webhooks

**Schema** (`src/storage/libsql.ts`):
```sql
CREATE TABLE IF NOT EXISTS webhooks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT NOT NULL, -- For HMAC signature

  -- Scope
  project_id TEXT REFERENCES projects(id), -- null = workspace-wide

  -- Events to listen for (JSON array)
  events TEXT NOT NULL DEFAULT '["ticket.created", "ticket.updated"]',
  -- ticket.created, ticket.updated, ticket.deleted, ticket.status_changed
  -- comment.created, sprint.started, sprint.completed, module.updated

  -- Status
  is_active INTEGER DEFAULT 1,

  -- Stats
  last_triggered_at INTEGER,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,

  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS webhook_logs (
  id TEXT PRIMARY KEY,
  webhook_id TEXT NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,

  -- Request
  event TEXT NOT NULL,
  payload TEXT NOT NULL, -- JSON

  -- Response
  status_code INTEGER,
  response_body TEXT,
  response_time_ms INTEGER,

  -- Status
  success INTEGER NOT NULL,
  error_message TEXT,

  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX idx_webhooks_project ON webhooks(project_id);
CREATE INDEX idx_webhook_logs_webhook ON webhook_logs(webhook_id, created_at DESC);
```

**Webhook service** (`src/webhooks/index.ts`):
- Queue webhook deliveries via BullMQ
- Sign payload with HMAC-SHA256
- Retry with exponential backoff (3 attempts)
- Log all attempts

**API** (`src/routes/webhooks.ts`):
```
GET    /webhooks           - List webhooks
POST   /webhooks           - Create webhook
GET    /webhooks/:id       - Get webhook
PATCH  /webhooks/:id       - Update webhook
DELETE /webhooks/:id       - Delete webhook
POST   /webhooks/:id/test  - Send test payload
GET    /webhooks/:id/logs  - Get delivery logs
```

**UI** (`ui/src/features/webhooks/`):
```
webhooks/
├── components/
│   ├── WebhookForm.tsx       - Create/edit form
│   ├── WebhookEventPicker.tsx - Multi-select events
│   ├── WebhookLogItem.tsx    - Log entry row
│   └── WebhookTestButton.tsx
└── views/
    ├── WebhookList.tsx
    └── WebhookDetail.tsx     - With logs
```

---

### D1: Pages/Wiki

**Schema** (`src/storage/libsql.ts`):
```sql
CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id),
  parent_id TEXT REFERENCES pages(id), -- Hierarchy

  name TEXT NOT NULL,
  description TEXT,

  -- Content (TipTap JSON format)
  content TEXT, -- JSON
  content_html TEXT, -- Rendered HTML for search
  content_plain TEXT, -- Plain text for FTS

  -- Appearance
  icon TEXT,
  color TEXT,
  cover_image TEXT,
  is_full_width INTEGER DEFAULT 0,

  -- Access
  is_public INTEGER DEFAULT 0,
  is_locked INTEGER DEFAULT 0,

  -- Ownership
  created_by TEXT NOT NULL,

  -- Metadata
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS page_versions (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS page_labels (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  UNIQUE(page_id, label)
);

CREATE INDEX idx_pages_project ON pages(project_id);
CREATE INDEX idx_pages_parent ON pages(parent_id);
CREATE INDEX idx_page_versions_page ON page_versions(page_id, version DESC);
```

**API** (`src/routes/pages.ts`):
```
GET    /pages                - List pages (tree structure)
POST   /pages                - Create page
GET    /pages/:id            - Get page with content
PATCH  /pages/:id            - Update page
DELETE /pages/:id            - Delete page (soft delete)

GET    /pages/:id/versions   - Version history
POST   /pages/:id/restore/:version - Restore version
POST   /pages/:id/duplicate  - Clone page
POST   /pages/:id/move       - Move to new parent
POST   /pages/:id/convert-to-ticket - Create ticket from page
```

**UI** (`ui/src/features/pages/`):
- TipTap editor with extensions (similar to Plane)
- Sidebar tree navigation
- Version comparison view
- AI content generation (integrate with chat)

---

## Implementation Sequence

### Sprint 1: Phase A UI (2 weeks)
1. `EstimateSelect` component + integration
2. Relations UI in TicketDetail
3. Assignees multi-select UI
4. Watchers UI widget
5. Attachments upload UI
6. Reactions picker UI
7. Bulk action toolbar in list view

### Sprint 2: Saved Views (2 weeks)
1. Backend: `saved_views` table + API
2. `ViewSelector` dropdown
3. `ViewFiltersPanel` with all filter options
4. `CreateViewModal`
5. View persistence in URL

### Sprint 3: Modules (2 weeks)
1. Backend: `modules` tables + API
2. `ModuleList` and `ModuleDetail` views
3. Add tickets to modules UI
4. Module progress tracking
5. Module timeline view

### Sprint 4: Notifications (2 weeks)
1. Backend: `notifications` table + API
2. Notification creation service (hooks into ticket/comment changes)
3. `NotificationBell` with dropdown
4. `NotificationCenter` page
5. SSE integration for real-time
6. Preferences UI

### Sprint 5: Webhooks (1 week)
1. Backend: `webhooks` table + API
2. Webhook delivery service (BullMQ job)
3. Webhook management UI
4. Test delivery + logs

### Sprint 6: Calendar & Gantt (2 weeks)
1. Calendar view component (use react-big-calendar or similar)
2. Gantt view component (use gantt-task-react or similar)
3. Layout switcher in ticket views
4. Date range filters

### Sprint 7: Pages/Wiki (3 weeks)
1. Backend: `pages` tables + API
2. TipTap editor setup with extensions
3. Page tree sidebar
4. Version history UI
5. AI content generation

---

## Dependencies

### NPM Packages to Add

```json
{
  "dependencies": {
    "react-big-calendar": "^1.x",     // Calendar view
    "gantt-task-react": "^0.x",       // Gantt chart
    "date-fns": "^4.x",               // Already have
    "@tiptap/react": "^2.x",          // Already have
    "@tiptap/extension-collaboration": "^2.x" // Real-time editing
  }
}
```

### Backend Services to Create

1. `src/notifications/` - Notification creation + delivery
2. `src/webhooks/` - Webhook management + delivery
3. `src/views/` - View CRUD + filter application
4. `src/modules/` - Module CRUD + ticket association
5. `src/pages/` - Page CRUD + versioning

---

## Success Metrics

| Feature | Metric | Target |
|---------|--------|--------|
| Saved Views | Views created per user | 3+ |
| Modules | Tickets organized in modules | 50%+ |
| Notifications | Notification open rate | 30%+ |
| Calendar View | Users switching to calendar | 20%+ |
| Pages | Pages per project | 5+ |

---

## What NOT to Build (Stay AI-Native)

These features exist in Plane but we should NOT build them — our AI handles them better:

| Feature | Why Not |
|---------|---------|
| **Manual issue templates** | AI auto-categorizes |
| **Complex workflow rules** | AI applies context-aware logic |
| **Time tracking (manual)** | AI estimates based on history |
| **Priority scoring algorithms** | AI determines priority from content |
| **Duplicate detection (manual)** | AI finds similar tickets automatically |

Our AI-native advantage: These are "free" via AI instead of complex rule engines.

---

## References

- [Plane Source Analysis](./research/PLANE_COMPARISON.md)
- [UI Guidelines](./UI_GUIDELINES.md)
- [CLAUDE.md](../CLAUDE.md)
