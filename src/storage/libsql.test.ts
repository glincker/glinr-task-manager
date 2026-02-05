import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { LibSQLAdapter } from './libsql.js';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

describe('LibSQLAdapter', () => {
  let adapter: LibSQLAdapter;
  const testDbPath = ':memory:';

  beforeAll(async () => {
    adapter = new LibSQLAdapter({ dbPath: testDbPath });
    await adapter.connect();
  });

  describe('Tasks', () => {
    const testTask = {
      id: randomUUID(),
      title: 'Test Task',
      description: 'Test Description',
      prompt: 'Do something',
      source: 'unit-test',
      priority: 2,
    };

    it('should create and get a task', async () => {
      await adapter.createTask(testTask as any);
      const retrieved = await adapter.getTask(testTask.id);
      expect(retrieved).toMatchObject(testTask);
    });

    it('should update task status', async () => {
      await adapter.updateTask(testTask.id, { 
        status: 'completed', 
        result: 'All done',
        completedAt: new Date()
      });
      const retrieved = await adapter.getTask(testTask.id);
      expect(retrieved?.status).toBe('completed');
      expect(retrieved?.result).toBe('All done');
      expect(retrieved?.completedAt).toBeDefined();
    });

    it('should query tasks with filters', async () => {
      await adapter.createTask({
        id: randomUUID(),
        title: 'Another Task',
        prompt: 'Task 2',
        source: 'unit-test',
        status: 'pending',
      } as any);

      const { tasks: allTasks, total } = await adapter.getTasks();
      expect(allTasks.length).toBeGreaterThanOrEqual(2);
      expect(total).toBeGreaterThanOrEqual(2);

      const { tasks: pendingTasks } = await adapter.getTasks({ status: 'pending' });
      expect(pendingTasks.every(t => t.status === 'pending')).toBe(true);
    });
  });

  describe('Summaries', () => {
    it('should create and query summaries', async () => {
      const taskId = randomUUID();
      await adapter.createTask({
        id: taskId,
        title: 'Task for Summary',
        prompt: '...',
        source: 'test'
      } as any);

      const summaryInput = {
        taskId,
        agent: 'claude',
        title: 'Build success',
        whatChanged: 'Added tests',
        filesChanged: [{ path: 'test.ts', action: 'added' }],
        decisions: ['Use vitest'],
        blockers: [],
        artifacts: [],
      };

      const created = await adapter.createSummary(summaryInput as any);
      expect(created.id).toBeDefined();
      expect(created.title).toBe(summaryInput.title);

      const results = await adapter.querySummaries({ taskId });
      expect(results.total).toBe(1);
      expect(results.summaries[0].taskId).toBe(taskId);
    });
  });

  describe('Task Events', () => {
    it('should record and retrieve task events', async () => {
      const taskId = randomUUID();
      // Must create task first due to FK constraint
      await adapter.createTask({
        id: taskId,
        title: 'Event Task',
        prompt: '...',
        source: 'test'
      } as any);

      await adapter.recordTaskEvent({
        taskId,
        type: 'info',
        message: 'Starting task',
        agentId: 'test-agent'
      });

      const events = await adapter.getTaskEvents(taskId);
      expect(events.length).toBe(1);
      expect(events[0].message).toBe('Starting task');
    });
  });

  describe('Projects & Sprints', () => {
    const projectId = randomUUID();
    
    it('should create and get a project', async () => {
      const projectInput = {
        id: projectId,
        key: 'PRJ',
        name: 'Test Project',
        description: 'Testing projects',
        status: 'active' as const,
      };
      
      await (adapter as any).createProject(projectInput);
      const retrieved = await (adapter as any).getProject(projectId);
      expect(retrieved?.name).toBe('Test Project');
    });

    it('should create and get a sprint', async () => {
      const sprintId = randomUUID();
      const sprintInput = {
        id: sprintId,
        projectId,
        name: 'Sprint 1',
        status: 'active' as const,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
      };

      await (adapter as any).createSprint(sprintInput);
      const sprints = await (adapter as any).getProjectSprints(projectId);
      expect(sprints.length).toBe(1);
      expect(sprints[0].name).toBe('Sprint 1');
    });
  });

  describe('Tickets', () => {
    it('should create and update a ticket', async () => {
      const ticketId = randomUUID();
      const ticketInput = {
        id: ticketId,
        title: 'Fix issue',
        description: 'Broken tests',
        priority: 'high',
        status: 'todo',
        type: 'bug',
      };

      await (adapter as any).createTicket(ticketInput);
      const retrieved = await (adapter as any).getTicket(ticketId);
      expect(retrieved?.title).toBe('Fix issue');

      await (adapter as any).updateTicket(ticketId, { status: 'in-progress' });
      const updated = await (adapter as any).getTicket(ticketId);
      expect(updated?.status).toBe('in-progress');
    });

    it('should handle ticket comments', async () => {
      const ticketId = randomUUID();
      await (adapter as any).createTicket({ id: ticketId, title: 'Comment Test' });

      await (adapter as any).createTicketComment({
        ticketId,
        content: 'Test comment',
        authorName: 'Tester',
        authorType: 'human',
        authorPlatform: 'web'
      });

      const comments = await (adapter as any).getTicketComments(ticketId);
      expect(comments.length).toBe(1);
      expect(comments[0].content).toBe('Test comment');
    });
  });

  describe('Stats & Analytics', () => {
    it('should return health check info', async () => {
      const health = await adapter.healthCheck();
      expect(health.healthy).toBe(true);
      expect(health.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('should aggregate agent stats', async () => {
      const stats = await adapter.getAgentStats();
      expect(stats).toBeDefined();
    });
  });
});
