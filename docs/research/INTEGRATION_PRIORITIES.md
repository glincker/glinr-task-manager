# Integration Platform Priorities

> **Decision:** Focus on GitHub first, then Linear, then Jira
> **Rationale:** OAuth already GitHub-based, most users use GitHub

---

## Platform Priority Matrix

| Platform | Priority | Why | Effort |
|----------|----------|-----|--------|
| **GitHub** | P0 - Now | OAuth ready, Projects V2 unique | 80% done |
| **Linear** | P1 - Soon | GraphQL client ready, popular with startups | 70% done |
| **Jira** | P2 - Later | Enterprise market, complex API | 10% done |
| **Plane** | P3 - Future | Self-hosted alternative | Schema only |
| **Asana** | P4 - Consider | Personal/team use | Not started |
| **Notion** | P5 - Explore | Database sync | Not started |

---

## GitHub (Priority: NOW)

### Current State: 80% Complete

**Done:**
- OAuth + PAT authentication
- Projects V2 GraphQL client (list, preview, items)
- Import wizard UI (5-step flow)
- Issue sync adapter (bidirectional)
- Webhook signature verification
- Field mapping (status, priority, type)

**Remaining:**
- [ ] Complete ticket creation in import
- [ ] Comment sync tracking
- [ ] Repository sync state
- [ ] Webhook → ticket update (not just create)
- [ ] Push changes back to GitHub

### Unique Value
- **GitHub Projects V2 import** - Plane doesn't have this
- **Iteration → Sprint mapping**
- **Native OAuth** - Already the auth method

### Recommended Actions
1. Complete import execute endpoint (2-4 hours)
2. Add comment sync table + handling (2-3 hours)
3. Enhance webhook for updates (2-3 hours)
4. Test end-to-end sync (1-2 hours)

---

## Linear (Priority: SOON)

### Current State: 70% Complete

**Done:**
- GraphQL API client with queries/mutations
- Team/workspace mapping
- Issue CRUD operations
- Status/priority mapping
- Webhook parsing

**Remaining:**
- [ ] Import wizard UI (copy GitHub pattern)
- [ ] Cycle sync (iterations)
- [ ] Label sync
- [ ] Comment sync
- [ ] OAuth (currently API key only)

### Unique Value
- **Popular with startups/dev teams**
- **Clean API** - GraphQL, well-documented
- **Cycles match sprints** - Natural mapping

### Recommended Actions
1. Create Linear import wizard (copy GitHub) - 3-4 hours
2. Add OAuth flow (Linear supports OAuth) - 2-3 hours
3. Wire cycle sync - 1-2 hours

---

## Jira (Priority: LATER)

### Current State: 10% Complete

**Done:**
- Webhook signature verification (basic)
- Schema references for external links

**Remaining:**
- [ ] Jira API client (REST, complex auth)
- [ ] Issue sync adapter
- [ ] Project mapping
- [ ] Sprint sync
- [ ] Custom field mapping
- [ ] Import wizard UI

### Challenges
- **OAuth 2.0 (3LO)** - Complex setup with Atlassian Connect
- **API complexity** - JQL, custom fields, workflows
- **Rate limiting** - Strict limits on cloud
- **On-prem variations** - Server vs Data Center vs Cloud

### Recommended Actions
1. Defer until GitHub + Linear complete
2. Start with Jira Cloud only
3. Consider using Atlassian Connect framework

---

## Feature Comparison: Sync Capabilities

| Feature | GitHub | Linear | Jira |
|---------|--------|--------|------|
| **Auth** | | | |
| OAuth | ✅ Done | 🔄 Planned | ❌ Complex |
| API Key/PAT | ✅ Done | ✅ Done | ❌ Tokens |
| **Data** | | | |
| Issues/Tickets | ✅ Bidirectional | ✅ Bidirectional | ❌ Not started |
| Comments | 🔄 Partial | 🔄 Partial | ❌ Not started |
| Labels | ❌ Need labels | ❌ Need labels | ❌ Not started |
| Sprints/Cycles | ✅ Import only | 🔄 Planned | ❌ Not started |
| **Sync** | | | |
| Webhooks in | ✅ Done | ✅ Done | ⚠️ Basic |
| Push out | 🔄 Partial | 🔄 Partial | ❌ Not started |
| Conflict detection | ✅ Done | ✅ Done | ❌ Not started |

---

## Integration Architecture

All integrations follow the same pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                    Integration Layer                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ GitHub       │  │ Linear       │  │ Jira         │       │
│  │ Adapter      │  │ Adapter      │  │ Adapter      │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│         │                 │                 │                │
│         └────────────┬────┴────────────────┘                │
│                      │                                       │
│              ┌───────▼───────┐                              │
│              │  Base Adapter │                              │
│              │  Interface    │                              │
│              └───────────────┘                              │
│                      │                                       │
│              ┌───────▼───────┐                              │
│              │  Sync Engine  │                              │
│              └───────────────┘                              │
│                      │                                       │
│              ┌───────▼───────┐                              │
│              │ Ticket Service│                              │
│              └───────────────┘                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Adapter Interface

```typescript
interface SyncAdapter {
  // Identity
  platform: 'github' | 'linear' | 'jira';

  // Auth
  validateCredentials(): Promise<boolean>;
  getAuthUrl?(): string;  // For OAuth

  // Read
  listIssues(options: ListOptions): Promise<ExternalIssue[]>;
  getIssue(externalId: string): Promise<ExternalIssue>;

  // Write
  createIssue(ticket: Ticket): Promise<ExternalIssue>;
  updateIssue(ticket: Ticket, externalId: string): Promise<ExternalIssue>;
  deleteIssue(externalId: string): Promise<void>;

  // Comments
  listComments(externalIssueId: string): Promise<ExternalComment[]>;
  createComment(content: string, externalIssueId: string): Promise<ExternalComment>;

  // Mapping
  mapStatusToLocal(externalStatus: string): TicketStatus;
  mapStatusToExternal(localStatus: TicketStatus): string;
  mapPriorityToLocal(externalPriority: string): TicketPriority;
  mapPriorityToExternal(localPriority: TicketPriority): string;

  // Webhooks
  parseWebhookPayload(payload: unknown, headers: Headers): WebhookEvent;
  verifyWebhookSignature(payload: string, signature: string): boolean;
}
```

---

## Data Model Alignment

### External Links Table (Exists)

```sql
-- Already in schema.ts
ticketExternalLinks:
  - ticketId → tickets.id
  - platform: 'github' | 'linear' | 'jira' | 'plane'
  - externalId: Platform's ID
  - externalUrl: Link to external issue
  - externalKey: Display key (#42, LIN-123, JIRA-456)
  - syncEnabled: boolean
  - syncDirection: 'inbound' | 'outbound' | 'bidirectional'
  - lastSyncAt: timestamp
  - syncStatus: 'synced' | 'pending' | 'error'
```

### Platform-Specific Sync Tables (Needed)

```sql
-- GitHub (to add)
github_repository_syncs:
  - repositoryId, owner, repo
  - lastSyncAt, syncStatus
  - autoLabelId (for imported issues)

github_comment_syncs:
  - ticketExternalLinkId
  - commentId (GLINR)
  - githubCommentId

-- Linear (to add)
linear_team_syncs:
  - teamId, teamName
  - lastSyncAt, syncStatus
  - defaultStateMapping

linear_comment_syncs:
  - ticketExternalLinkId
  - commentId (GLINR)
  - linearCommentId

-- Jira (future)
jira_project_syncs:
  - projectKey, projectName
  - issueTypeMapping
  - workflowMapping
```

---

## Webhook Endpoints

| Platform | Endpoint | Events |
|----------|----------|--------|
| GitHub | `/api/sync/webhook/github` | issues, issue_comment, pull_request |
| Linear | `/api/sync/webhook/linear` | Issue, Comment, Cycle |
| Jira | `/api/sync/webhook/jira` | jira:issue_*, comment_* |

All endpoints:
1. Verify signature
2. Parse payload
3. Find/create ticket mapping
4. Update GLINR data
5. Return 200 OK quickly

---

## UI Components to Build

### Import Wizards (Per Platform)

```
ui/src/features/projects/components/
├── ImportWizard.tsx           # GitHub (done)
├── LinearImportWizard.tsx     # To build (copy pattern)
└── JiraImportWizard.tsx       # Future
```

### Integration Settings

```
ui/src/features/settings/views/
├── Settings.tsx               # Main settings
├── IntegrationSettings.tsx    # Connected accounts
├── GitHubSettings.tsx         # GitHub-specific
├── LinearSettings.tsx         # Linear-specific
└── JiraSettings.tsx           # Jira-specific
```

### Sync Status UI

```typescript
// Show in project detail
<SyncStatus projectId={id} />

// Component shows:
// - Connected platforms (icons)
// - Last sync time
// - Sync status (synced/pending/error)
// - Manual sync button
// - Conflict count (if any)
```

---

## Recommended Implementation Order

### Phase 1: Complete GitHub (Week 1)
1. Finish import execute endpoint
2. Add comment sync
3. Enhance webhooks for updates
4. Push changes to GitHub
5. Test end-to-end

### Phase 2: Add Linear Import (Week 2)
1. Create Linear import wizard (copy GitHub)
2. Add Linear OAuth
3. Wire cycle → sprint sync
4. Test bidirectional sync

### Phase 3: Polish & Stabilize (Week 3)
1. Add labels system (needed for both)
2. Improve conflict resolution
3. Add sync history/logging
4. Error recovery improvements

### Phase 4: Jira Foundation (Future)
1. Research Jira Cloud API
2. Build minimal adapter
3. Basic issue sync only
4. OAuth with Atlassian Connect

---

## Success Metrics

| Metric | Target |
|--------|--------|
| GitHub import success rate | >95% |
| Webhook processing time | <500ms |
| Sync conflicts resolved automatically | >80% |
| Linear import ready | Week 2 |
| Full bidirectional sync | Week 3 |

---

*This document guides integration priority and implementation order.*
