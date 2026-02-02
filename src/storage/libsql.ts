import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { eq, and, gte, lte, like, desc, asc, count, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';

import type { StorageAdapter } from './adapter.js';
import * as schema from './schema.js';
import type { Task, CreateTaskInput } from '../types/task.js';
import type { Summary, CreateSummaryInput, SummaryQuery, SummaryStats } from '../types/summary.js';

export class LibSQLAdapter implements StorageAdapter {
  private db: any;
  private client: any;
  private readonly dbUrl: string;

  constructor(config: { dbPath?: string } = {}) {
    const dbPath = config.dbPath || path.resolve(process.cwd(), 'data', 'glinr.db');
    this.dbUrl = `file:${dbPath}`;
  }

  async connect(): Promise<void> {
    const dbPath = this.dbUrl.replace('file:', '');
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir) && dbPath !== ':memory:') {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.client = createClient({ url: this.dbUrl });
    this.db = drizzle(this.client, { schema });

    // Ensure tables exist (POC auto-migration)
    await this.initDatabase();
  }

  private async initDatabase(): Promise<void> {
    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        prompt TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        priority INTEGER NOT NULL DEFAULT 3,
        source TEXT NOT NULL,
        source_id TEXT,
        source_url TEXT,
        repository TEXT,
        branch TEXT,
        labels TEXT NOT NULL DEFAULT '[]',
        assigned_agent TEXT,
        assigned_agent_id TEXT,
        created_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP,
        started_at INTEGER,
        completed_at INTEGER,
        metadata TEXT NOT NULL DEFAULT '{}',
        result TEXT,
        attempts INTEGER NOT NULL DEFAULT 0,
        max_attempts INTEGER NOT NULL DEFAULT 3
      )
    `);

    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS summaries (
        id TEXT PRIMARY KEY,
        task_id TEXT REFERENCES tasks(id),
        session_id TEXT,
        agent TEXT NOT NULL,
        model TEXT,
        title TEXT NOT NULL,
        what_changed TEXT NOT NULL,
        why_changed TEXT,
        how_changed TEXT,
        files_changed TEXT NOT NULL DEFAULT '[]',
        decisions TEXT NOT NULL DEFAULT '[]',
        blockers TEXT NOT NULL DEFAULT '[]',
        artifacts TEXT NOT NULL DEFAULT '[]',
        tokens_used TEXT,
        cost TEXT,
        task_type TEXT,
        component TEXT,
        labels TEXT NOT NULL DEFAULT '[]',
        linked_issue TEXT,
        linked_pr TEXT,
        repository TEXT,
        branch TEXT,
        raw_output TEXT,
        created_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT
      )
    `);
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
    }
  }

  // === Tasks ===

  async createTask(input: CreateTaskInput): Promise<Task> {
    const id = (input as any).id || randomUUID();
    const now = new Date();
    
    const newTask = {
      ...input,
      id,
      status: 'pending' as const,
      createdAt: now,
      updatedAt: now,
      attempts: 0,
      maxAttempts: 3,
    };

    await this.db.insert(schema.tasks).values(newTask);
    return newTask as Task;
  }

  async getTask(id: string): Promise<Task | null> {
    const results = await this.db.select().from(schema.tasks).where(eq(schema.tasks.id, id));
    return (results[0] as Task) || null;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const now = new Date();
    await this.db.update(schema.tasks)
      .set({ ...updates, updatedAt: now })
      .where(eq(schema.tasks.id, id));
    
    const updated = await this.getTask(id);
    if (!updated) throw new Error(`Task ${id} not found after update`);
    return updated;
  }

  async deleteTask(id: string): Promise<boolean> {
    const result = await this.db.delete(schema.tasks).where(eq(schema.tasks.id, id));
    // LibSQL results might be different from better-sqlite3
    return true; 
  }

  async getTasks(query?: { limit?: number; offset?: number; status?: string }): Promise<{ tasks: Task[]; total: number }> {
    let whereClause = undefined;
    if (query?.status) {
      whereClause = eq(schema.tasks.status, query.status);
    }

    const tasks = await this.db.select()
      .from(schema.tasks)
      .where(whereClause)
      .limit(query?.limit || 50)
      .offset(query?.offset || 0)
      .orderBy(desc(schema.tasks.createdAt));

    const totalRes = await this.db.select({ value: count() }).from(schema.tasks).where(whereClause);
    
    return {
      tasks: tasks as Task[],
      total: totalRes[0].value,
    };
  }

  // === Summaries ===

  async createSummary(input: CreateSummaryInput): Promise<Summary> {
    const id = randomUUID();
    const now = new Date();

    const newSummary: typeof schema.summaries.$inferInsert = {
      ...input,
      id,
      createdAt: now,
      filesChanged: input.filesChanged || [],
      decisions: input.decisions || [],
      blockers: input.blockers || [],
      artifacts: input.artifacts || [],
      labels: input.labels || [],
    };

    await this.db.insert(schema.summaries).values(newSummary);
    return { ...newSummary, createdAt: now } as Summary;
  }

  async getSummary(id: string): Promise<Summary | null> {
    const results = await this.db.select().from(schema.summaries).where(eq(schema.summaries.id, id));
    return (results[0] as Summary) || null;
  }

  async getTaskSummaries(taskId: string): Promise<Summary[]> {
    return await this.db.select()
      .from(schema.summaries)
      .where(eq(schema.summaries.taskId, taskId))
      .orderBy(desc(schema.summaries.createdAt));
  }

  async querySummaries(query: Partial<SummaryQuery>): Promise<{ summaries: Summary[]; total: number }> {
    const conditions = [];

    if (query.taskId) conditions.push(eq(schema.summaries.taskId, query.taskId));
    if (query.sessionId) conditions.push(eq(schema.summaries.sessionId, query.sessionId));
    if (query.agent) conditions.push(eq(schema.summaries.agent, query.agent));
    if (query.taskType) conditions.push(eq(schema.summaries.taskType, query.taskType));
    if (query.component) conditions.push(eq(schema.summaries.component, query.component));
    if (query.repository) conditions.push(eq(schema.summaries.repository, query.repository));
    
    if (query.from) conditions.push(gte(schema.summaries.createdAt, query.from));
    if (query.to) conditions.push(lte(schema.summaries.createdAt, query.to));

    if (query.search) {
      const searchPattern = `%${query.search}%`;
      conditions.push(sql`(${schema.summaries.title} LIKE ${searchPattern} OR ${schema.summaries.whatChanged} LIKE ${searchPattern} OR ${schema.summaries.whyChanged} LIKE ${searchPattern} OR ${schema.summaries.howChanged} LIKE ${searchPattern} OR ${schema.summaries.rawOutput} LIKE ${searchPattern})`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const summaries = await this.db.select()
      .from(schema.summaries)
      .where(whereClause)
      .limit(query.limit || 50)
      .offset(query.offset || 0)
      .orderBy(query.sortOrder === 'asc' ? asc(schema.summaries.createdAt) : desc(schema.summaries.createdAt));

    const totalRes = await this.db.select({ value: count() }).from(schema.summaries).where(whereClause);

    return {
      summaries: summaries as Summary[],
      total: totalRes[0].value,
    };
  }

  async deleteSummary(id: string): Promise<boolean> {
    await this.db.delete(schema.summaries).where(eq(schema.summaries.id, id));
    return true;
  }

  async getSummaryStats(): Promise<SummaryStats> {
    const all = await this.db.select().from(schema.summaries);
    
    const byAgent: Record<string, number> = {};
    const byTaskType: Record<string, number> = {};
    const byComponent: Record<string, number> = {};
    let totalTokens = 0;
    let totalCost = 0;
    let filesChangedCount = 0;

    for (const s of all) {
      byAgent[s.agent] = (byAgent[s.agent] || 0) + 1;
      if (s.taskType) byTaskType[s.taskType] = (byTaskType[s.taskType] || 0) + 1;
      if (s.component) byComponent[s.component] = (byComponent[s.component] || 0) + 1;
      if (s.tokensUsed) totalTokens += (s.tokensUsed as any).total || 0;
      if (s.cost) totalCost += (s.cost as any).amount || 0;
      filesChangedCount += (s.filesChanged as any[]).length;
    }

    return {
      totalCount: all.length,
      byAgent,
      byTaskType,
      byComponent,
      totalTokens,
      totalCost,
      averageDuration: 0, 
      filesChangedCount,
    };
  }

  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number }> {
    const start = Date.now();
    try {
      await this.client.execute('SELECT 1');
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (error) {
      return { healthy: false, latencyMs: Date.now() - start };
    }
  }
}
