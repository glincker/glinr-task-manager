# GLINR Task Manager - Development Guidelines

> **For AI Agents:** Also read `AGENTS.md` for detailed workflow instructions.
> **For UI Development:** See `docs/UI_GUIDELINES.md` for complete UI standards.
> **Other AI Tools:** See `.cursorrules`, `.windsurfrules` for tool-specific rules.

---

## CRITICAL: Validate Before Implementing

You CAN create new code. VALIDATE your approach first:

1. **New APIs** → Research via Context7 or docs first
2. **New files** → Follow existing directory structure
3. **New deps** → Justify in PR, propose before adding
4. **New types** → Check `src/types/` first, create if needed

**Workflow: RESEARCH → VALIDATE → IMPLEMENT → VERIFY**

Use Context7 for library validation:
```
"BullMQ delayed jobs use context7"
"Hono error handling middleware use context7"
```

---

## Project Overview

Task queue orchestrator for AI agents (OpenClaw, Claude Code, Jules). Routes tasks from GitHub/Jira/Linear to appropriate AI agents.

## Tech Stack

- **Runtime**: Node.js 22+ with ES modules
- **Language**: TypeScript 5.x (strict mode)
- **Framework**: Hono (lightweight, fast)
- **Queue**: BullMQ + Redis
- **Package Manager**: pnpm

## Quick Commands

```bash
pnpm install          # Install dependencies
pnpm build            # TypeScript compile
pnpm dev              # Development with watch
pnpm test             # Run tests
pnpm lint             # ESLint check
pnpm format           # Prettier format
```

## Architecture

```
src/
├── adapters/         # AI agent adapters (OpenClaw, Claude, etc.)
├── cron/             # Scheduled jobs (polling, heartbeat)
├── integrations/     # External services (GitHub, Jira, Linear)
├── queue/            # BullMQ task queue logic
├── types/            # TypeScript types/interfaces
└── server.ts         # Hono HTTP server
```

## Code Style

### TypeScript

- Use `type` for object shapes, `interface` for extendable contracts
- Prefer `const` assertions for literal types
- Always use explicit return types on exported functions
- Use `Record<string, T>` instead of `{ [key: string]: T }`

```typescript
// Good
export function processTask(task: Task): Promise<TaskResult> { }

// Bad
export function processTask(task) { }
```

### Imports

- Use `.js` extension for local imports (ES modules)
- Group imports: external → internal → types
- Use `import type` for type-only imports

```typescript
import { Queue, Worker } from 'bullmq';
import { getAgentRegistry } from '../adapters/registry.js';
import type { Task, TaskResult } from '../types/task.js';
```

### Error Handling

- Always catch and handle errors explicitly
- Use typed error responses
- Log errors with context

```typescript
try {
  const result = await adapter.executeTask(task);
} catch (error) {
  console.error(`[Task ${task.id}] Execution failed:`, error);
  return {
    success: false,
    error: {
      code: 'EXECUTION_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    },
  };
}
```

## Performance Guidelines

1. **Avoid regex recompilation** - Define patterns at module scope
2. **Use async notifications** - Don't block task processing
3. **Cache computed values** - Hoist invariant calculations out of loops
4. **Skip unnecessary logging** - Exclude health checks from logs

## Testing

- Place tests next to source files: `foo.ts` → `foo.test.ts`
- Use descriptive test names
- Include benchmarks for performance-critical code

```typescript
describe('TaskQueue', () => {
  it('should process high-priority tasks first', async () => {
    // ...
  });
});
```

## Git Conventions

### Branches

- `main` - Production-ready code
- `feat/*` - New features
- `fix/*` - Bug fixes
- `perf/*` - Performance improvements

### Commits

Use conventional commits:

```
feat: Add Linear webhook integration
fix: Handle null task descriptions
perf: Cache registry adapter types
refactor: Extract notification queue
docs: Update API documentation
test: Add Jira webhook tests
```

### Pull Requests

- Keep PRs focused and atomic
- Include benchmarks for perf changes
- Reference issue numbers: `Closes #123`

## Agent-Specific Notes

### OpenClaw Adapter

- Uses REST API to gateway
- Builds autonomous prompts with workflow steps
- Extracts artifacts (commits, PRs, files) from responses

### Claude Code Adapter

- Spawns CLI subprocess
- Collects stdout/stderr as Buffers (not strings)
- Handles multi-byte characters across chunks

## Environment Variables

Required:
- `REDIS_URL` - Redis connection string
- `PORT` - HTTP server port (default: 3000)

Optional:
- `OPENCLAW_BASE_URL` - OpenClaw gateway URL
- `OPENCLAW_GATEWAY_TOKEN` - Gateway auth token
- `GITHUB_TOKEN` - GitHub API access
- `JIRA_WEBHOOK_SECRET` - Jira signature verification

## UI Development (Quick Reference)

> Full guidelines in `docs/UI_GUIDELINES.md`

**Stack**: React 19 + Vite + TypeScript + Tailwind v4 + shadcn/ui

**Architecture**: Feature-based (group by domain, not file type)
```
ui/src/features/tasks/      # All task-related code together
ui/src/features/summaries/  # All summary-related code together
```

**Key Rules**:
1. **Use shadcn/ui components** - Don't reinvent buttons, cards, dialogs
2. **Tailwind only** - No inline styles, no CSS modules
3. **Lucide icons only** - Consistent iconography
4. **TanStack Query** - For all server state (no Redux for API data)
5. **Feature folders** - Components, hooks, views co-located
6. **Dark mode required** - Use CSS variables, test both themes

**Styling Quick Reference**:
```tsx
// Use theme colors, not hardcoded values
<Card className="bg-card text-card-foreground shadow-soft">

// Ordering: layout → size → typography → visual → interactive
<div className="flex items-center gap-4 p-4 text-sm bg-muted rounded-lg hover:bg-accent">
```

**Don't (UI-specific)**:
- Don't use `style={{}}` inline styles
- Don't create new icon sets (use Lucide)
- Don't skip loading/error states
- Don't forget keyboard navigation
- Don't use index as list keys

## Don't (General)

- Don't use `any` type
- Don't commit `.env` files
- Don't block the event loop
- Don't ignore TypeScript errors
- Don't skip tests for new features
- **Don't hardcode limits/thresholds** - Use environment variables for tunables

## Environment Variables (Tunables)

Performance settings that can be overridden without code changes:

| Variable | Default | Description |
|----------|---------|-------------|
| `POOL_MAX_CONCURRENT` | 50 | Max concurrent tool executions |
| `POOL_MAX_QUEUE_SIZE` | 200 | Max pending executions in queue |
| `POOL_TIMEOUT_MS` | 300000 | Tool execution timeout (5 min) |
| `POOL_QUEUE_TIMEOUT_MS` | 30000 | Max time waiting in queue (30s) |
| `STREAM_CHUNK_BATCH_SIZE` | 64 | Batch size before flushing stream |
| `STREAM_CHUNK_BATCH_TIME_MS` | 30 | Max time before flushing batch |

---

## Reference: OpenClaw Device/Session Management Patterns

> Source: `/Users/gdsks/G-Development/GLINR-V3/openclaw-reference/src/`

### 1. Device Identity (`infra/device-identity.ts`)

Uses ED25519 key pairs for cryptographic device identification:

```typescript
type DeviceIdentity = {
  deviceId: string;       // SHA256 hash of public key
  publicKeyPem: string;   // PEM-encoded public key
  privateKeyPem: string;  // PEM-encoded private key (secret)
};

// Pattern: Load or create on first use
function loadOrCreateDeviceIdentity(filePath = "~/.openclaw/identity/device.json"): DeviceIdentity;

// Pattern: Sign payloads for verification
function signDevicePayload(privateKeyPem: string, payload: string): string;

// Pattern: Verify signatures from other devices
function verifyDeviceSignature(publicKey: string, payload: string, signature: string): boolean;
```

**Key Features:**
- DeviceId derived from public key (deterministic, can be verified)
- Secure file storage with `chmod 0o600`
- Base64URL encoding for transport-safe signatures
- ED25519 for fast, small signatures

### 2. Device Auth Store (`infra/device-auth-store.ts`)

Token storage per device with role-based access:

```typescript
type DeviceAuthEntry = {
  token: string;
  role: string;
  scopes: string[];
  updatedAtMs: number;
};

type DeviceAuthStore = {
  version: 1;
  deviceId: string;
  tokens: Record<string, DeviceAuthEntry>;  // keyed by role
};

// Pattern: Load token for specific role
function loadDeviceAuthToken(params: {
  deviceId: string;
  role: string;
}): DeviceAuthEntry | null;

// Pattern: Store token with scopes
function storeDeviceAuthToken(params: {
  deviceId: string;
  role: string;
  token: string;
  scopes?: string[];
}): DeviceAuthEntry;
```

**Key Features:**
- Multiple tokens per device (different roles/services)
- Scopes for fine-grained permissions
- File storage with 0o600 permissions
- Version field for future migrations

### 3. Pairing Store (`pairing/pairing-store.ts`)

Human-friendly pairing codes for new device authorization:

```typescript
type PairingRequest = {
  id: string;            // User/device identifier
  code: string;          // 8-char human-friendly code
  createdAt: string;
  lastSeenAt: string;
  meta?: Record<string, string>;
};

// Constants
const PAIRING_CODE_LENGTH = 8;
const PAIRING_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No 0O1I
const PAIRING_PENDING_TTL_MS = 60 * 60 * 1000;  // 1 hour
const PAIRING_PENDING_MAX = 3;  // Max concurrent pending requests

// Pattern: Request pairing (creates code)
async function upsertChannelPairingRequest(params: {
  channel: PairingChannel;
  id: string;
  meta?: Record<string, string>;
}): Promise<{ code: string; created: boolean }>;

// Pattern: Approve code (adds to allow-list)
async function approveChannelPairingCode(params: {
  channel: PairingChannel;
  code: string;
}): Promise<{ id: string; entry?: PairingRequest } | null>;
```

**Key Features:**
- File locking with `proper-lockfile` for concurrency
- Automatic TTL expiration of pending requests
- Allow-list stored separately per channel
- No ambiguous characters in codes (0/O, 1/I removed)

### 4. Node Pairing (`infra/node-pairing.ts`)

Multi-node management with request/approve workflow:

```typescript
type NodePairingPendingRequest = {
  requestId: string;
  nodeId: string;
  displayName?: string;
  platform?: string;      // "macos", "linux", etc.
  version?: string;
  deviceFamily?: string;  // "MacBookPro", etc.
  caps?: string[];        // Capabilities
  commands?: string[];    // Supported commands
  permissions?: Record<string, boolean>;
  isRepair?: boolean;     // Re-pairing existing node
  ts: number;
};

type NodePairingPairedNode = {
  nodeId: string;
  token: string;          // Auth token after approval
  // ...metadata
  createdAtMs: number;
  approvedAtMs: number;
  lastConnectedAtMs?: number;
};

// Pattern: Request pairing
async function requestNodePairing(req: {
  nodeId: string;
  displayName?: string;
  platform?: string;
  caps?: string[];
}): Promise<{ status: "pending"; request: NodePairingPendingRequest; created: boolean }>;

// Pattern: Approve request (generates token)
async function approveNodePairing(requestId: string): Promise<{
  requestId: string;
  node: NodePairingPairedNode;
} | null>;

// Pattern: Verify node token
async function verifyNodeToken(nodeId: string, token: string): Promise<{
  ok: boolean;
  node?: NodePairingPairedNode;
}>;
```

**Key Features:**
- 5-minute TTL on pending requests
- Atomic file writes with temp file + rename
- Capability/permission tracking per node
- Last connected timestamp for activity monitoring
- In-memory lock for concurrency safety

### Implementation Notes for GLINR

When implementing similar patterns:

1. **Database-backed storage** - Use SQLite/LibSQL instead of file-based for multi-user deployments
2. **Token rotation** - Add refresh token support for OAuth flows
3. **Rate limiting** - Add brute-force protection on pairing codes
4. **Audit logging** - Log all auth events (login, pair, approve, reject)
5. **Session management** - Track active sessions per user/device

Example schema additions:
```sql
-- Device registry
CREATE TABLE devices (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  name TEXT,
  platform TEXT,
  device_family TEXT,
  last_ip TEXT,
  last_seen_at INTEGER,
  created_at INTEGER,
  status TEXT DEFAULT 'active'
);

-- Pending pairing requests
CREATE TABLE pairing_requests (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  user_id TEXT,
  device_info TEXT,  -- JSON
  expires_at INTEGER NOT NULL,
  created_at INTEGER
);
```
