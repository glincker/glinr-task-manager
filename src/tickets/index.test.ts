import { describe, it, expect, beforeAll } from 'vitest';
import { initStorage } from '../storage/index.js';
import { 
  createTicket, 
  getTicket, 
  getTicketWithRelations, 
  updateTicket, 
  queryTickets, 
  bulkUpdateTickets, 
  deleteTicket 
} from './index.js';
import { createProject } from '../projects/index.js';
import { randomUUID } from 'crypto';

describe('Ticket Service', () => {
  let projectId: string;

  beforeAll(async () => {
    process.env.STORAGE_TIER = 'memory';
    await initStorage();
    const project = await createProject({ key: 'TKT', name: 'Ticket Project' });
    projectId = project.id;
  });

  describe('CRUD Operations', () => {
    it('should create and retrieve a ticket', async () => {
      const input = {
        projectId,
        title: 'Test Ticket',
        description: 'Testing tickets',
        priority: 'high' as const,
        type: 'bug' as const
      };

      const ticket = await createTicket(input);
      expect(ticket.id).toBeDefined();
      expect(ticket.title).toBe(input.title);

      const retrieved = await getTicket(ticket.id);
      expect(retrieved?.id).toBe(ticket.id);
    });

    it('should update a ticket', async () => {
      const ticket = await createTicket({ projectId, title: 'Old Title' });
      const updated = await updateTicket(ticket.id, { title: 'New Title', status: 'in_progress' });
      expect(updated?.title).toBe('New Title');
      expect(updated?.status).toBe('in_progress');
      expect(updated?.startedAt).toBeDefined();
    });

    it('should delete a ticket', async () => {
      const ticket = await createTicket({ projectId, title: 'To Delete' });
      const success = await deleteTicket(ticket.id);
      expect(success).toBe(true);
      const retrieved = await getTicket(ticket.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('Queries and Bulk Operations', () => {
    it('should query tickets with filters', async () => {
      await createTicket({ projectId, title: 'Query 1', status: 'backlog' });
      await createTicket({ projectId, title: 'Query 2', status: 'todo' });

      const { tickets, total } = await queryTickets({ projectId, status: 'todo' });
      expect(total).toBeGreaterThanOrEqual(1);
      expect(tickets.every(t => t.status === 'todo')).toBe(true);
    });

    it('should bulk update tickets', async () => {
      const t1 = await createTicket({ projectId, title: 'Bulk 1' });
      const t2 = await createTicket({ projectId, title: 'Bulk 2' });

      const result = await bulkUpdateTickets({
        ids: [t1.id, t2.id],
        updates: { status: 'done' }
      });

      expect(result.updated.length).toBe(2);
      expect(result.updated.every(t => t.status === 'done')).toBe(true);
    });
  });

  describe('Relations and History', () => {
    it('should get a ticket with full relations', async () => {
      const ticket = await createTicket({ projectId, title: 'Full Ticket' });
      const withRelations = await getTicketWithRelations(ticket.id);
      expect(withRelations).not.toBeNull();
      expect(withRelations?.history).toBeDefined();
      expect(withRelations?.comments).toBeDefined();
    });
  });

  describe('Comments, Watchers, and Assignees', () => {
    it('should handle ticket comments', async () => {
      const ticket = await createTicket({ projectId, title: 'Comment Test' });
      const commentInput = {
        ticketId: ticket.id,
        content: 'Test comment',
        authorName: 'Tester',
        authorType: 'human' as const,
        authorPlatform: 'glinr'
      };

      const comment = await (import('./index.js').then(m => m.addComment(ticket.id, commentInput)));
      expect(comment.content).toBe('Test comment');

      const comments = await (import('./index.js').then(m => m.getComments(ticket.id)));
      expect(comments.length).toBe(1);

      await (import('./index.js').then(m => m.updateComment(comment.id, { content: 'Updated comment' })));
      const updated = await (import('./index.js').then(m => m.getComments(ticket.id)));
      expect(updated[0].content).toBe('Updated comment');

      await (import('./index.js').then(m => m.deleteComment(comment.id)));
      const deleted = await (import('./index.js').then(m => m.getComments(ticket.id)));
      expect(deleted.length).toBe(0);
    });

    it('should handle watchers and secondary assignees', async () => {
      const ticket = await createTicket({ projectId, title: 'Subsidiary Test' });
      
      await (import('./index.js').then(m => m.addWatcher(ticket.id, 'user-1')));
      const watchers = await (import('./index.js').then(m => m.getTicketWatchers(ticket.id)));
      expect(watchers.length).toBe(1);

      await (import('./index.js').then(m => m.addAssignee(ticket.id, 'user-2')));
      const assignees = await (import('./index.js').then(m => m.getTicketAssignees(ticket.id)));
      expect(assignees.length).toBe(1);
    });
  });

  describe('Ticket Relations', () => {
    it('should link tickets with relations', async () => {
      const t1 = await createTicket({ projectId, title: 'Source' });
      const t2 = await createTicket({ projectId, title: 'Target' });

      const relation = await (import('./index.js').then(m => m.createTicketRelation(t1.id, t2.id, 'blocks' as any)));
      expect(relation.relationType).toBe('blocks');

      const relations = await (import('./index.js').then(m => m.getTicketRelations(t1.id)));
      expect(relations.length).toBe(1);
    });
  });
});
