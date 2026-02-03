# GitHub Integration Completion Plan

> **Focus:** Complete the GitHub integration to production quality
> **Dependencies:** Labels system (for label sync), ticket service enhancements
> **Last Updated:** 2026-02-02

---

## Current State Assessment

### What Works (Updated 2026-02-02)

| Component | Status | Location |
|-----------|--------|----------|
| GitHub OAuth | ✅ Complete | `src/auth/github-oauth.ts` |
| PAT token storage | ✅ Complete | `githubTokens` table |
| Projects V2 GraphQL | ✅ Complete | `src/integrations/github-projects.ts` |
| Import wizard UI | ✅ Complete | `ui/src/features/projects/components/ImportWizard.tsx` |
| Token validation | ✅ Complete | `/api/import/github/validate-token` |
| Project list API | ✅ Complete | `/api/import/github/projects` |
| Project preview API | ✅ Complete | `/api/import/github/projects/:id/preview` |
| Webhook signature | ✅ Complete | `src/integrations/github.ts` |
| Issue sync adapter | ✅ Complete | `src/sync/adapters/github.ts` |
| Sync engine | ✅ Complete | `src/sync/engine.ts` |
| **Import execute** | ✅ Complete | `src/routes/import.ts` - creates tickets + external links |
| **Labels system** | ✅ Complete | `src/labels/index.ts`, `src/routes/labels.ts` |
| **Comment sync table** | ✅ Complete | `githubCommentSyncs` in schema |
| **Repo sync state table** | ✅ Complete | `githubRepositorySyncs` in schema |
| **Webhook → ticket update** | ✅ Complete | `src/integrations/github-ticket-sync.ts` |

### What's Remaining

| Component | Status | Issue |
|-----------|--------|-------|
| Push changes to GitHub | ⚠️ Partial | Adapter exists, needs ticket service wiring |
| Labels UI | ❌ Missing | Need label picker component |
| Sync status UI | ❌ Missing | Need sync status indicator |
| Conflict resolution UI | ❌ Missing | Need conflict management modal |

---

## Implementation Tasks

### Task 1: Complete Import Execute Endpoint

**File:** `src/routes/import.ts`

```typescript
// Current (stubbed):
app.post('/api/import/github/projects/:projectId/execute', async (c) => {
  // Creates project
  // Creates sprints (basic)
  // Tickets: "TODO: implement"
});

// Needed:
app.post('/api/import/github/projects/:projectId/execute', async (c) => {
  const { projectId } = c.req.param();
  const body = await c.req.json();

  // 1. Fetch full project data from GitHub
  const projectData = await githubProjects.getProjectPreview(token, projectId);

  // 2. Create GLINR project
  const project = await projectService.createProject({
    key: body.projectKey,
    name: body.projectName,
    icon: body.icon,
    color: body.color,
  });

  // 3. Create project external link
  await db.insert(projectExternalLinks).values({
    id: generateId(),
    projectId: project.id,
    platform: 'github',
    externalId: projectId,
    externalUrl: projectData.project.url,
    syncEnabled: body.enableSync ?? true,
    syncDirection: 'bidirectional',
  });

  // 4. Create sprints from iterations
  const sprintMap = new Map<string, string>(); // GitHub iteration ID → GLINR sprint ID
  if (body.importIterations && projectData.iterations) {
    for (const iteration of projectData.iterations) {
      const sprint = await sprintService.createSprint({
        projectId: project.id,
        name: iteration.title,
        startDate: new Date(iteration.startDate),
        endDate: addDays(new Date(iteration.startDate), iteration.duration),
        status: 'planning',
      });
      sprintMap.set(iteration.id, sprint.id);
    }
  }

  // 5. Create tickets from items
  const ticketResults = [];
  for (const item of projectData.items) {
    // Map fields using user-provided mappings
    const status = body.fieldMappings?.status?.[item.status] ?? 'backlog';
    const priority = body.fieldMappings?.priority?.[item.priority] ?? 'medium';
    const type = body.fieldMappings?.type?.[item.type] ?? 'task';

    // Create ticket
    const ticket = await ticketService.createTicket({
      projectId: project.id,
      title: item.title,
      description: item.body,
      status,
      priority,
      type,
      // labels: item.labels, // Requires labels system
    });

    // Create external link
    await db.insert(ticketExternalLinks).values({
      id: generateId(),
      ticketId: ticket.id,
      platform: 'github',
      externalId: item.id,
      externalUrl: item.url,
      externalKey: item.number ? `#${item.number}` : undefined,
      syncEnabled: true,
      syncDirection: 'bidirectional',
    });

    // Assign to sprint if has iteration
    if (item.iteration && sprintMap.has(item.iteration)) {
      await sprintService.addTicketToSprint(
        sprintMap.get(item.iteration)!,
        ticket.id
      );
    }

    ticketResults.push(ticket);
  }

  return c.json({
    success: true,
    project,
    summary: {
      projectCreated: true,
      sprintsCreated: sprintMap.size,
      ticketsCreated: ticketResults.length,
    },
  });
});
```

### Task 2: Add GitHub Repository Sync Table

**File:** `src/storage/schema.ts`

```typescript
export const githubRepositorySyncs = sqliteTable('github_repository_syncs', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),

  // GitHub repository info
  repositoryId: integer('repository_id').notNull(),
  repositoryName: text('repository_name').notNull(),
  owner: text('owner').notNull(),
  defaultBranch: text('default_branch').default('main'),

  // Sync configuration
  syncIssues: integer('sync_issues', { mode: 'boolean' }).default(true),
  syncPRs: integer('sync_prs', { mode: 'boolean' }).default(false),
  autoLabelId: text('auto_label_id').references(() => labels.id),

  // Sync state
  lastSyncAt: integer('last_sync_at', { mode: 'timestamp' }),
  lastSyncStatus: text('last_sync_status').default('idle'), // idle, syncing, success, error
  lastSyncError: text('last_sync_error'),
  itemsSynced: integer('items_synced').default(0),

  // Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});
```

### Task 3: Add Comment Sync Table

**File:** `src/storage/schema.ts`

```typescript
export const githubCommentSyncs = sqliteTable('github_comment_syncs', {
  id: text('id').primaryKey(),

  // Links
  ticketExternalLinkId: text('ticket_external_link_id')
    .notNull()
    .references(() => ticketExternalLinks.id),
  commentId: text('comment_id')
    .notNull()
    .references(() => ticketComments.id),

  // GitHub IDs
  githubCommentId: integer('github_comment_id').notNull(),

  // Metadata
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});
```

### Task 4: Enhance Webhook Handler

**File:** `src/integrations/github.ts`

```typescript
// Add to existing webhook handler

async function handleIssueEvent(payload: GitHubWebhookPayload): Promise<WebhookResult> {
  const { action, issue, repository } = payload;

  // Find existing sync
  const existingLink = await db.query.ticketExternalLinks.findFirst({
    where: and(
      eq(ticketExternalLinks.platform, 'github'),
      eq(ticketExternalLinks.externalId, issue.id.toString()),
    ),
  });

  if (existingLink) {
    // UPDATE existing ticket
    if (action === 'edited' || action === 'reopened' || action === 'closed') {
      await ticketService.updateTicket(existingLink.ticketId, {
        title: issue.title,
        description: issue.body,
        status: mapGitHubIssueState(issue.state, issue.state_reason),
      });

      return {
        action: 'updated',
        ticketId: existingLink.ticketId,
      };
    }

    if (action === 'labeled' || action === 'unlabeled') {
      // Sync labels (requires labels system)
      const labels = issue.labels.map(l => l.name);
      await ticketService.updateTicketLabels(existingLink.ticketId, labels);

      return {
        action: 'labels_updated',
        ticketId: existingLink.ticketId,
      };
    }

    if (action === 'assigned' || action === 'unassigned') {
      const assignee = issue.assignees?.[0]?.login;
      await ticketService.updateTicket(existingLink.ticketId, {
        assignee,
      });

      return {
        action: 'assignee_updated',
        ticketId: existingLink.ticketId,
      };
    }
  } else {
    // CREATE new ticket (only if meets criteria)
    if (shouldCreateTicket(issue)) {
      // Existing task creation logic
    }
  }

  return { action: 'ignored' };
}

async function handleIssueCommentEvent(payload: GitHubWebhookPayload): Promise<WebhookResult> {
  const { action, comment, issue } = payload;

  // Find linked ticket
  const ticketLink = await db.query.ticketExternalLinks.findFirst({
    where: and(
      eq(ticketExternalLinks.platform, 'github'),
      eq(ticketExternalLinks.externalId, issue.id.toString()),
    ),
  });

  if (!ticketLink) {
    return { action: 'ignored', reason: 'ticket_not_synced' };
  }

  if (action === 'created') {
    // Check if comment already synced
    const existingSync = await db.query.githubCommentSyncs.findFirst({
      where: eq(githubCommentSyncs.githubCommentId, comment.id),
    });

    if (!existingSync) {
      // Create comment
      const newComment = await ticketService.addComment(ticketLink.ticketId, {
        content: comment.body,
        author: comment.user.login,
        source: 'github',
      });

      // Track sync
      await db.insert(githubCommentSyncs).values({
        id: generateId(),
        ticketExternalLinkId: ticketLink.id,
        commentId: newComment.id,
        githubCommentId: comment.id,
      });

      return { action: 'comment_created', commentId: newComment.id };
    }
  }

  if (action === 'edited') {
    const syncRecord = await db.query.githubCommentSyncs.findFirst({
      where: eq(githubCommentSyncs.githubCommentId, comment.id),
    });

    if (syncRecord) {
      await ticketService.updateComment(syncRecord.commentId, {
        content: comment.body,
      });

      return { action: 'comment_updated', commentId: syncRecord.commentId };
    }
  }

  if (action === 'deleted') {
    const syncRecord = await db.query.githubCommentSyncs.findFirst({
      where: eq(githubCommentSyncs.githubCommentId, comment.id),
    });

    if (syncRecord) {
      await ticketService.deleteComment(syncRecord.commentId);
      await db.delete(githubCommentSyncs).where(
        eq(githubCommentSyncs.id, syncRecord.id)
      );

      return { action: 'comment_deleted' };
    }
  }

  return { action: 'ignored' };
}

function mapGitHubIssueState(state: string, stateReason?: string): TicketStatus {
  if (state === 'open') return 'todo';
  if (state === 'closed') {
    if (stateReason === 'completed') return 'done';
    if (stateReason === 'not_planned') return 'cancelled';
    return 'done';
  }
  return 'backlog';
}
```

### Task 5: Push Changes to GitHub

**File:** `src/sync/adapters/github.ts` - Already implemented, verify it works

```typescript
// Existing implementation should handle:
// - createIssue(ticket) → Create issue on GitHub
// - updateIssue(ticket) → Update issue on GitHub
// - deleteIssue(ticket) → Close issue on GitHub

// Need to add to ticket service:
// - After ticket update, call sync push if enabled

// In src/tickets/index.ts (or wherever ticket service is):
async function updateTicket(ticketId: string, updates: TicketUpdates) {
  // ... update ticket in DB ...

  // Check for sync-enabled external links
  const links = await db.query.ticketExternalLinks.findMany({
    where: and(
      eq(ticketExternalLinks.ticketId, ticketId),
      eq(ticketExternalLinks.syncEnabled, true),
      eq(ticketExternalLinks.syncDirection, 'bidirectional'),
    ),
  });

  for (const link of links) {
    if (link.platform === 'github') {
      await syncEngine.pushTicketToGitHub(ticketId, link);
    }
  }

  return updatedTicket;
}
```

---

## Integration Flow Diagrams

### Import Flow (One-time)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        GitHub Import Flow                            │
└─────────────────────────────────────────────────────────────────────┘

User clicks "Import from GitHub"
        │
        ▼
┌───────────────────┐
│ Step 1: Connect   │ → Enter PAT or OAuth redirect
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Step 2: Select    │ → GET /api/import/github/projects
│ GitHub Project    │   Returns: [{ id, title, itemCount }]
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Step 3: Preview   │ → GET /api/import/github/projects/:id/preview
│ & Map Fields      │   Returns: { items, iterations, fieldMappings }
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Step 4: Configure │ → User sets project key, name, icon
│ GLINR Project     │
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Step 5: Execute   │ → POST /api/import/github/projects/:id/execute
│                   │   Creates: project, tickets, sprints, links
└───────────────────┘
        │
        ▼
┌───────────────────┐
│ Done! View new    │ → Navigate to /projects/:newProjectId
│ project           │
└───────────────────┘
```

### Sync Flow (Ongoing)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Bidirectional Sync Flow                          │
└─────────────────────────────────────────────────────────────────────┘

GITHUB → GLINR (Webhooks)
─────────────────────────
GitHub issue updated
        │
        ▼
POST /api/sync/webhook/github
        │
        ▼
Verify signature (HMAC-SHA256)
        │
        ▼
Find ticketExternalLinks by externalId
        │
        ├── Found? → Update GLINR ticket
        │
        └── Not found? → Check criteria → Create new ticket

GLINR → GITHUB (Push)
────────────────────
User updates ticket in UI
        │
        ▼
ticketService.updateTicket()
        │
        ▼
Check ticketExternalLinks (syncEnabled=true)
        │
        ▼
For each GitHub link:
  syncAdapter.updateIssue(ticket, link)
        │
        ▼
GitHub API: PATCH /repos/:owner/:repo/issues/:number
```

---

## Testing Checklist

### Import Testing
```bash
# 1. Validate token
curl -X POST http://localhost:3000/api/import/github/validate-token \
  -H "Content-Type: application/json" \
  -d '{"token": "ghp_xxxxx"}'
# Expected: { valid: true, scopes: ["repo", "read:project"] }

# 2. List projects
curl http://localhost:3000/api/import/github/projects
# Expected: { projects: [{ id, title, itemCount }] }

# 3. Preview
curl http://localhost:3000/api/import/github/projects/PVT_xxxx/preview
# Expected: { project, items[], iterations[], fieldMappings }

# 4. Execute import
curl -X POST http://localhost:3000/api/import/github/projects/PVT_xxxx/execute \
  -H "Content-Type: application/json" \
  -d '{
    "projectKey": "TEST",
    "projectName": "Test Import",
    "importIterations": true,
    "enableSync": true
  }'
# Expected: { success: true, summary: { ticketsCreated: N } }

# 5. Verify data
curl http://localhost:3000/api/projects
curl http://localhost:3000/api/tickets?projectId=xxx
```

### Webhook Testing
```bash
# Simulate GitHub webhook (issue opened)
curl -X POST http://localhost:3000/api/sync/webhook/github \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: issues" \
  -H "X-Hub-Signature-256: sha256=xxxx" \
  -d '{
    "action": "opened",
    "issue": {
      "id": 12345,
      "number": 42,
      "title": "Test issue",
      "body": "Issue description",
      "state": "open"
    },
    "repository": {
      "full_name": "owner/repo"
    }
  }'
```

### Sync Testing
```bash
# Manual sync trigger
curl -X POST http://localhost:3000/api/sync/trigger?platform=github

# Check sync status
curl http://localhost:3000/api/sync/status
```

---

## Dependencies

Before completing GitHub integration:

1. **Labels system** (for label sync)
   - `labels` table
   - `ticket_labels` junction
   - Label CRUD API

2. **Ticket service enhancements**
   - `createTicket()` with external link support
   - `updateTicket()` with sync push
   - `updateTicketLabels()` for label sync

3. **Comment service**
   - `addComment()` with source tracking
   - `updateComment()`
   - `deleteComment()`

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/routes/import.ts` | Complete execute endpoint |
| `src/storage/schema.ts` | Add sync tables |
| `src/storage/libsql.ts` | Add CREATE TABLE |
| `src/integrations/github.ts` | Enhance webhook handler |
| `src/tickets/index.ts` | Add sync push logic |
| `src/sync/integration.ts` | Wire callbacks |

---

## Success Criteria

1. **Import works end-to-end**
   - User can import GitHub Project V2
   - All items become tickets
   - Iterations become sprints
   - External links created

2. **Webhooks update tickets**
   - Issue edit → ticket updated
   - Issue close → status changed
   - Comment add → comment synced

3. **Changes push to GitHub**
   - Ticket title change → issue updated
   - Status change → issue state changed
   - Comment add → comment posted

4. **No data loss**
   - Conflicts detected
   - Duplicate prevention
   - Error recovery

---

*This plan completes the GitHub integration to production quality.*
