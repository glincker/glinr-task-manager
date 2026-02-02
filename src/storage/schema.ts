import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * Tasks Table
 */
export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  prompt: text('prompt').notNull(),
  status: text('status').notNull().default('pending'),
  priority: integer('priority').notNull().default(3),
  source: text('source').notNull(),
  sourceId: text('source_id'),
  sourceUrl: text('source_url'),
  repository: text('repository'),
  branch: text('branch'),
  labels: text('labels', { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),
  assignedAgent: text('assigned_agent'),
  assignedAgentId: text('assigned_agent_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  startedAt: integer('started_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, any>>().notNull().default(sql`'{}'`),
  result: text('result', { mode: 'json' }).$type<any>(),
  attempts: integer('attempts').notNull().default(0),
  maxAttempts: integer('max_attempts').notNull().default(3),
});

/**
 * Summaries Table
 */
export const summaries = sqliteTable('summaries', {
  id: text('id').primaryKey(),
  taskId: text('task_id').references(() => tasks.id),
  sessionId: text('session_id'),
  agent: text('agent').notNull(),
  model: text('model'),
  title: text('title').notNull(),
  whatChanged: text('what_changed').notNull(),
  whyChanged: text('why_changed'),
  howChanged: text('how_changed'),
  filesChanged: text('files_changed', { mode: 'json' }).$type<any[]>().notNull().default(sql`'[]'`),
  decisions: text('decisions', { mode: 'json' }).$type<any[]>().notNull().default(sql`'[]'`),
  blockers: text('blockers', { mode: 'json' }).$type<any[]>().notNull().default(sql`'[]'`),
  artifacts: text('artifacts', { mode: 'json' }).$type<any[]>().notNull().default(sql`'[]'`),
  tokensUsed: text('tokens_used', { mode: 'json' }).$type<any>(),
  cost: text('cost', { mode: 'json' }).$type<any>(),
  taskType: text('task_type'),
  component: text('component'),
  labels: text('labels', { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),
  linkedIssue: text('linked_issue'),
  linkedPr: text('linked_pr'),
  repository: text('repository'),
  branch: text('branch'),
  rawOutput: text('raw_output'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, any>>(),
});

/**
 * Embeddings Table (for sqlite-vec)
 */
export const embeddings = sqliteTable('embeddings', {
  id: text('id').primaryKey(),
  entityType: text('entity_type').notNull(), // 'task' | 'summary'
  entityId: text('entity_id').notNull(),
  embedding: blob('embedding').notNull(), // Float32 vector blob
  model: text('model').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
