# Session Spawn & Messaging

> **Phase 23** - Parallel Agent Sessions with Inter-Session Messaging

## Overview

Session Spawn enables AI agents to create child sessions for parallel work within a conversation. This allows:

- **Parallel task execution**: Spawn multiple children to analyze different parts of a codebase simultaneously
- **Hierarchical work delegation**: Parent sessions can delegate subtasks to specialized children
- **Inter-session communication**: Sessions communicate via a mailbox pattern with priority-based messaging

## Architecture

```
Root Session (depth 0)
├── Child Session A (depth 1)
│   ├── Grandchild A1 (depth 2)
│   └── Grandchild A2 (depth 2)
└── Child Session B (depth 1)
    └── Grandchild B1 (depth 2)
```

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Schema | `src/storage/schema.ts` | Database tables for sessions & messages |
| Config | `src/chat/execution/session-spawn/config.ts` | Configuration loading |
| Manager | `src/chat/execution/session-spawn/manager.ts` | Session lifecycle & messaging |
| Tools | `src/chat/execution/tools/session-spawn.ts` | AI-callable tools |

## Configuration

### Settings File (`config/settings.yml`)

```yaml
sessionSpawn:
  # Enable/disable session spawn feature
  enabled: true

  # Maximum depth of session hierarchy (0 = root only, 3 = up to 3 levels deep)
  maxDepth: 3

  # Maximum children a single session can spawn
  maxChildrenPerSession: 5

  # Default token budget for child sessions
  defaultBudget: 20000

  # Default max steps (tool calls) for child sessions
  defaultSteps: 20

  # Root session multiplier (root gets N times the child defaults)
  rootMultiplier: 5

  # Default message priority (1-10, 10 = highest)
  defaultMessagePriority: 5

  # Auto-cleanup settings
  cleanup:
    enabled: true
    intervalMs: 3600000      # 1 hour
    maxAgeMs: 86400000       # 24 hours
```

### Environment Variable Overrides

All settings can be overridden via environment variables:

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `SESSION_SPAWN_ENABLED` | `true` | Enable/disable feature |
| `SESSION_SPAWN_MAX_DEPTH` | `3` | Maximum session hierarchy depth |
| `SESSION_SPAWN_MAX_CHILDREN` | `5` | Max children per session |
| `SESSION_SPAWN_DEFAULT_BUDGET` | `20000` | Default token budget |
| `SESSION_SPAWN_DEFAULT_STEPS` | `20` | Default max tool calls |
| `SESSION_SPAWN_ROOT_MULTIPLIER` | `5` | Root session limit multiplier |
| `SESSION_SPAWN_MESSAGE_PRIORITY` | `5` | Default message priority |
| `SESSION_SPAWN_CLEANUP_INTERVAL` | `3600000` | Cleanup interval (ms) |
| `SESSION_SPAWN_MAX_AGE` | `86400000` | Max age for completed sessions |

### Example: High-Performance Configuration

```bash
# Allow deeper hierarchies and more parallelism
export SESSION_SPAWN_MAX_DEPTH=5
export SESSION_SPAWN_MAX_CHILDREN=10
export SESSION_SPAWN_DEFAULT_BUDGET=50000
export SESSION_SPAWN_DEFAULT_STEPS=50
```

### Example: Conservative Configuration

```bash
# Limit resource usage
export SESSION_SPAWN_MAX_DEPTH=2
export SESSION_SPAWN_MAX_CHILDREN=3
export SESSION_SPAWN_DEFAULT_BUDGET=10000
```

## Tools Reference

### `spawn_session`

Create a child session to work on a subtask in parallel.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Short name for the session |
| `goal` | string | Yes | Clear description of what to accomplish |
| `description` | string | No | Optional longer description |
| `maxSteps` | number | No | Max tool calls (default from config) |
| `maxBudget` | number | No | Token budget (default from config) |
| `allowedTools` | string[] | No | Whitelist of allowed tools |
| `disallowedTools` | string[] | No | Blacklist of forbidden tools |

**Example:**

```json
{
  "name": "Route Analyzer",
  "goal": "Analyze all route handlers in src/routes/ and report API patterns",
  "maxSteps": 15,
  "allowedTools": ["read_file", "search_files", "grep"]
}
```

### `send_message`

Send a message to other sessions (parent, children, siblings, or specific ID).

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `target` | string | Yes | `"parent"`, `"children"`, `"siblings"`, or session ID |
| `type` | string | No | `message`, `result`, `request`, `notification`, `error` |
| `subject` | string | No | Message subject |
| `content` | object | Yes | Message content (JSON) |
| `priority` | number | No | 1-10 (default from config) |
| `ttlMs` | number | No | Time-to-live in milliseconds |
| `replyToMessageId` | string | No | ID of message being replied to |

**Example:**

```json
{
  "target": "parent",
  "type": "result",
  "subject": "Analysis Complete",
  "content": {
    "filesAnalyzed": 15,
    "issues": ["Missing error handling in routes/auth.ts"],
    "summary": "Found 15 route handlers with 3 potential issues"
  },
  "priority": 8
}
```

### `receive_messages`

Poll your mailbox for messages from other sessions.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `types` | string[] | No | Filter by message types |
| `fromSessionId` | string | No | Filter by sender |
| `minPriority` | number | No | Minimum priority threshold |
| `markAsRead` | boolean | No | Mark as read (default: true) |
| `limit` | number | No | Max messages to return (default: 20) |

**Example:**

```json
{
  "types": ["result"],
  "minPriority": 5,
  "markAsRead": true,
  "limit": 10
}
```

### `list_sessions`

List child or sibling sessions to check their status and progress.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `scope` | string | No | `"children"`, `"siblings"`, `"all"` (default: children) |
| `includeCompleted` | boolean | No | Include completed sessions (default: true) |

## Database Schema

### `agent_sessions` Table

```sql
CREATE TABLE agent_sessions (
  id TEXT PRIMARY KEY,
  parent_session_id TEXT REFERENCES agent_sessions(id),
  conversation_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  goal TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  depth INTEGER NOT NULL DEFAULT 0,
  current_step INTEGER NOT NULL DEFAULT 0,
  max_steps INTEGER NOT NULL DEFAULT 20,
  used_budget INTEGER NOT NULL DEFAULT 0,
  max_budget INTEGER NOT NULL DEFAULT 20000,
  final_result TEXT,
  stop_reason TEXT,
  allowed_tools TEXT,
  disallowed_tools TEXT,
  created_at INTEGER NOT NULL,
  started_at INTEGER,
  completed_at INTEGER,
  updated_at INTEGER NOT NULL,
  metadata TEXT DEFAULT '{}'
);
```

### `session_messages` Table

```sql
CREATE TABLE session_messages (
  id TEXT PRIMARY KEY,
  from_session_id TEXT NOT NULL REFERENCES agent_sessions(id),
  to_session_id TEXT NOT NULL REFERENCES agent_sessions(id),
  type TEXT NOT NULL DEFAULT 'message',
  subject TEXT,
  content TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'pending',
  reply_to_message_id TEXT REFERENCES session_messages(id),
  expires_at INTEGER,
  created_at INTEGER NOT NULL,
  delivered_at INTEGER,
  read_at INTEGER
);
```

## Usage Examples

### Example 1: Parallel Code Analysis

```
Parent: "Analyze the authentication system"

Parent Session:
  1. spawn_session("Auth Routes", "Analyze src/routes/auth.ts")
  2. spawn_session("Auth Service", "Analyze src/services/auth.ts")
  3. spawn_session("Auth Middleware", "Analyze src/middleware/auth.ts")
  4. [Continue with other work...]
  5. receive_messages(types=["result"])
  6. [Compile findings from all children]
```

### Example 2: Coordinating Siblings

```
Child Session A:
  1. [Discovers shared dependency]
  2. send_message(target="siblings", type="notification", content={
       "found": "shared-utils.ts",
       "relevance": "Contains auth helpers used across modules"
     })

Child Session B:
  1. receive_messages()
  2. [Uses sibling's discovery to inform analysis]
```

### Example 3: Request/Response Pattern

```
Child Session:
  1. [Needs clarification from parent]
  2. send_message(target="parent", type="request", content={
       "question": "Should I include deprecated endpoints?",
       "context": "Found 3 deprecated routes"
     })

Parent Session:
  1. receive_messages(types=["request"])
  2. send_message(target="<child-session-id>", type="message", content={
       "answer": "Skip deprecated endpoints, focus on active ones"
     })
```

## API Reference (Programmatic)

### Manager API

```typescript
import { getAgentSessionManager } from './session-spawn';

const manager = getAgentSessionManager();

// Create root session
const root = await manager.createRootSession('conv-123', 'Root', 'Main task');

// Spawn child
const child = await manager.spawn({
  parentSessionId: root.id,
  name: 'Analyzer',
  goal: 'Analyze routes',
  maxSteps: 15,
});

// Send message
await manager.send({
  fromSessionId: child.id,
  target: 'parent',
  type: 'result',
  content: { summary: 'Done' },
});

// Receive messages
const messages = await manager.receive({
  sessionId: root.id,
  types: ['result'],
  markAsRead: true,
});

// Cleanup old sessions
await manager.cleanup({ olderThanMs: 86400000 });
```

### Config API

```typescript
import {
  getSessionSpawnConfig,
  getRootSessionLimits,
  clearSessionSpawnConfigCache
} from './session-spawn';

// Get current config
const config = getSessionSpawnConfig();
console.log(config.maxDepth); // 3

// Get computed root limits
const rootLimits = getRootSessionLimits();
console.log(rootLimits.maxBudget); // 100000 (20000 * 5)

// Clear cache (for testing or config reload)
clearSessionSpawnConfigCache();
```

## Best Practices

1. **Use clear, specific goals**: Child sessions work autonomously; vague goals lead to poor results
2. **Limit tool access**: Use `allowedTools` to restrict children to only necessary tools
3. **Check for results**: Periodically poll with `receive_messages` to collect child outputs
4. **Handle failures gracefully**: Children may fail; parent should have fallback strategies
5. **Mind the depth**: Deeply nested sessions add complexity; keep hierarchies shallow when possible
6. **Use priorities**: High-priority messages (8-10) for urgent results, lower for informational

## Troubleshooting

### Session not spawning
- Check if `sessionSpawn.enabled` is `true`
- Verify depth hasn't exceeded `maxDepth`
- Ensure parent hasn't reached `maxChildrenPerSession`

### Messages not received
- Check if messages have expired (TTL)
- Verify target session ID is correct
- Ensure `markAsRead` isn't filtering out already-read messages

### High memory usage
- Enable cleanup: `sessionSpawn.cleanup.enabled: true`
- Reduce `maxAgeMs` to clean up faster
- Lower `maxChildrenPerSession` to limit parallelism

## Future Enhancements

- [ ] Real-time message notifications (WebSocket)
- [ ] Session result caching
- [ ] Cross-conversation session sharing
- [ ] Session templates/presets
- [ ] Visual session hierarchy in UI
