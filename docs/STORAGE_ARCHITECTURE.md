# Storage Architecture: Local-First with Vector Embeddings

> **Status:** Planning | **Target:** Phase 10 (Database Integration)
> **Last Updated:** 2026-02-01

## Vision

GLINR Task Manager as "Jira for AI Agents" - a local-first application where:
- **Free Tier**: Runs entirely locally with SQLite + sqlite-vec
- **Premium Tier**: Optional cloud sync with PostgreSQL + pgvector
- **Enterprise**: Bring Your Own Database (BYODB)

---

## Research Findings

### Vector Database Options

| Option | Pros | Cons | Use Case |
|--------|------|------|----------|
| **sqlite-vec** | Zero setup, runs anywhere, 30MB memory, SIMD-optimized | Limited to device hardware | Local/Free tier |
| **libSQL (Turso)** | Native vectors, no extensions needed, cloud sync | Newer, less ecosystem | Local + Cloud hybrid |
| **pgvector** | Mature, powerful, great for scale | Requires Postgres, memory-heavy | Cloud/Premium tier |
| **Dedicated Vector DB** | Purpose-built (Pinecone, Weaviate) | Extra infra, sync pain | Not recommended |

### Recommendation

**Use Drizzle ORM** with adapter pattern:
- Single schema definition works across SQLite and PostgreSQL
- Type-safe migrations
- Easy to swap storage backends

```
┌─────────────────────────────────────────────────────────────┐
│                    Storage Abstraction                       │
├─────────────────────────────────────────────────────────────┤
│                    Drizzle ORM Layer                         │
│                    (Unified Schema)                          │
├─────────────┬─────────────┬─────────────┬──────────────────┤
│   SQLite    │   libSQL    │  PostgreSQL │   User-Provided   │
│ + sqlite-vec│   (Turso)   │ + pgvector  │   (BYODB)         │
│   [FREE]    │   [HYBRID]  │  [PREMIUM]  │   [ENTERPRISE]    │
└─────────────┴─────────────┴─────────────┴──────────────────┘
```

---

## Architecture

### Storage Adapter Interface

```typescript
// src/storage/adapter.ts
export interface StorageAdapter {
  // Core CRUD
  connect(): Promise<void>;
  disconnect(): Promise<void>;

  // Tasks
  createTask(input: CreateTaskInput): Promise<Task>;
  getTask(id: string): Promise<Task | null>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task>;
  queryTasks(query: TaskQuery): Promise<{ tasks: Task[]; total: number }>;

  // Summaries
  createSummary(input: CreateSummaryInput): Promise<Summary>;
  getSummary(id: string): Promise<Summary | null>;
  querySummaries(query: SummaryQuery): Promise<{ summaries: Summary[]; total: number }>;

  // Vector operations (for semantic search)
  storeEmbedding(id: string, embedding: number[], metadata?: Record<string, unknown>): Promise<void>;
  searchSimilar(embedding: number[], limit?: number, threshold?: number): Promise<SimilarityResult[]>;

  // Health
  healthCheck(): Promise<{ healthy: boolean; latencyMs: number }>;
}
```

### Tier Configuration

```typescript
// src/storage/config.ts
export type StorageTier = 'local' | 'cloud' | 'byodb';

export interface StorageConfig {
  tier: StorageTier;

  // Local tier (SQLite)
  local?: {
    dbPath: string;  // e.g., ~/.glinr/data.db
    enableVectors: boolean;
  };

  // Cloud tier (managed PostgreSQL)
  cloud?: {
    apiKey: string;
    endpoint: string;
    syncInterval?: number;
  };

  // Enterprise (user-provided)
  byodb?: {
    type: 'postgres' | 'mysql' | 'sqlite';
    connectionString: string;
  };
}
```

---

## Implementation Plan

### Phase 10A: SQLite Foundation (Free Tier)
1. Add dependencies: `better-sqlite3`, `drizzle-orm`
2. Create Drizzle schema for all entities
3. Implement `SQLiteAdapter`
4. Migrate in-memory storage to SQLite
5. Add migrations system

### Phase 10B: Vector Search (AI Features)
1. Add `sqlite-vec` extension
2. Create embeddings table
3. Implement `storeEmbedding()` and `searchSimilar()`
4. Add semantic search to summaries/tasks

### Phase 10C: Cloud Sync (Premium)
1. Add libSQL/Turso integration
2. Implement sync engine
3. Add conflict resolution (CRDT-based)
4. Create cloud API endpoints

### Phase 10D: BYODB (Enterprise)
1. Add PostgreSQL adapter with pgvector
2. Add MySQL adapter
3. Connection string validation
4. Schema migration tools

---

## Drizzle Schema (Draft)

```typescript
// src/storage/schema.ts
import { sqliteTable, text, integer, real, blob } from 'drizzle-orm/sqlite-core';

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('pending'),
  priority: integer('priority').notNull().default(5),
  source: text('source').notNull(),
  assignedAgent: text('assigned_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  metadata: text('metadata', { mode: 'json' }),
});

export const summaries = sqliteTable('summaries', {
  id: text('id').primaryKey(),
  taskId: text('task_id').references(() => tasks.id),
  sessionId: text('session_id'),
  agent: text('agent').notNull(),
  title: text('title').notNull(),
  whatChanged: text('what_changed').notNull(),
  whyChanged: text('why_changed'),
  howChanged: text('how_changed'),
  filesChanged: text('files_changed', { mode: 'json' }),
  decisions: text('decisions', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const embeddings = sqliteTable('embeddings', {
  id: text('id').primaryKey(),
  entityType: text('entity_type').notNull(), // 'task' | 'summary'
  entityId: text('entity_id').notNull(),
  embedding: blob('embedding').notNull(), // sqlite-vec format
  model: text('model').notNull(), // e.g., 'text-embedding-3-small'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
```

---

## Vector Embeddings Strategy

### When to Generate Embeddings
1. **Task Creation** - Embed title + description for semantic search
2. **Summary Creation** - Embed whatChanged + decisions for finding related work
3. **Search Queries** - Embed user query for similarity matching

### Embedding Models (configurable)
- **OpenAI**: `text-embedding-3-small` (1536 dimensions, $0.02/1M tokens)
- **Local**: `nomic-embed-text` via Ollama (768 dimensions, free)
- **Cohere**: `embed-english-v3.0` (1024 dimensions)

### sqlite-vec Usage

```typescript
// Example: Store embedding
db.run(`
  INSERT INTO embeddings (id, entity_type, entity_id, embedding, model, created_at)
  VALUES (?, ?, ?, vec_f32(?), ?, ?)
`, [id, 'summary', summaryId, embedding, 'text-embedding-3-small', Date.now()]);

// Example: Similarity search
db.all(`
  SELECT entity_id, vec_distance_cosine(embedding, vec_f32(?)) as distance
  FROM embeddings
  WHERE entity_type = ?
  ORDER BY distance ASC
  LIMIT ?
`, [queryEmbedding, 'summary', 10]);
```

---

## Migration Path

### From In-Memory to SQLite

```typescript
// src/storage/migrate.ts
export async function migrateToSQLite(): Promise<void> {
  const adapter = new SQLiteAdapter({ dbPath: '~/.glinr/data.db' });
  await adapter.connect();

  // Migrate existing in-memory data
  const existingSummaries = getRecentSummaries(1000);
  for (const summary of existingSummaries) {
    await adapter.createSummary(summary);
  }

  console.log(`Migrated ${existingSummaries.length} summaries to SQLite`);
}
```

---

## Testing Strategy

Antigravity and other agents can test using:

```bash
# Run with SQLite (local)
STORAGE_TIER=local pnpm dev

# Run with in-memory (current, for testing)
STORAGE_TIER=memory pnpm dev

# Test vector search
curl -X POST http://localhost:3000/api/search/semantic \
  -H "Content-Type: application/json" \
  -d '{"query": "authentication bug fix", "limit": 5}'
```

---

## Dependencies to Add

```json
{
  "dependencies": {
    "drizzle-orm": "^0.35.0",
    "better-sqlite3": "^11.0.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.0",
    "drizzle-kit": "^0.25.0"
  },
  "optionalDependencies": {
    "sqlite-vec": "^0.1.0"
  }
}
```

---

## References

- [sqlite-vec](https://github.com/asg017/sqlite-vec) - Vector search for SQLite
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [libSQL/Turso](https://turso.tech/) - SQLite with native vectors + sync
- [pgvector](https://github.com/pgvector/pgvector) - PostgreSQL vector extension
- [RxDB](https://rxdb.info/) - Local-first sync patterns

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-01 | Use Drizzle ORM | Multi-DB support, TypeScript-first, lightweight |
| 2026-02-01 | SQLite for free tier | Zero setup, runs anywhere, good enough for 10K+ records |
| 2026-02-01 | sqlite-vec over sqlite-vss | Actively maintained, lower memory, no virtual tables |
| 2026-02-01 | Defer cloud sync to later phase | Focus on local-first experience first |
