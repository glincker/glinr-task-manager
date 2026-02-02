import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initStorage, getStorage } from '../storage/index.js';
import { createSummary, getSummary, querySummaries } from './storage.js';
import { randomUUID } from 'crypto';

describe('Persistent Summary Storage', () => {
  beforeAll(async () => {
    // Initialize in-memory SQLite for testing
    process.env.STORAGE_TIER = 'memory';
    await initStorage();
  });

  it('should create and retrieve a summary', async () => {
    const taskId = randomUUID();
    
    // Create task first to satisfy foreign key
    const storage = await getStorage();
    await storage.createTask({
      id: taskId,
      title: 'Test Task',
      prompt: 'Test prompt',
      source: 'test',
    } as any);

    const input = {
      taskId,
      agent: 'test-agent',
      title: 'Test Summary',
      whatChanged: 'Changed some things',
      filesChanged: [{ path: 'test.ts', action: 'modified' as const }],
      decisions: [],
      blockers: [],
      artifacts: [],
    };

    const created = await createSummary(input);
    expect(created.id).toBeDefined();
    expect(created.title).toBe(input.title);

    const retrieved = await getSummary(created.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.title).toBe(input.title);
    expect(retrieved?.taskId).toBe(taskId);
  });

  it('should query summaries by taskId', async () => {
    const taskId = randomUUID();
    const storage = await getStorage();
    await storage.createTask({
      id: taskId,
      title: 'Task for query',
      prompt: '...',
      source: 'test',
    } as any);

    await createSummary({
      taskId,
      agent: 'agent-1',
      title: 'Task Summary',
      whatChanged: '...',
    });

    const result = await querySummaries({ taskId });
    expect(result.total).toBe(1);
    expect(result.summaries[0].taskId).toBe(taskId);
  });

  it('should search summaries by text', async () => {
    const uniqueTitle = `Unique Title ${randomUUID()}`;
    await createSummary({
      agent: 'search-agent',
      title: uniqueTitle,
      whatChanged: 'Target content',
    });

    const result = await querySummaries({ search: 'Target content' });
    expect(result.summaries.some(s => s.title === uniqueTitle)).toBe(true);
  });
});
