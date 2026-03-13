import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../utils/logger.js', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { AuditLogger, type AuditEntry } from '../audit.js';

describe('AuditLogger', () => {
  let audit: AuditLogger;

  beforeEach(() => {
    audit = new AuditLogger();
  });

  // ===========================================================================
  // logExecution
  // ===========================================================================

  describe('logExecution', () => {
    it('records a successful execution', () => {
      const entry = audit.logExecution({
        toolName: 'exec',
        toolCallId: 'tc-1',
        conversationId: 'conv-1',
        userId: 'user-1',
        success: true,
        durationMs: 250,
        exitCode: 0,
      });

      expect(entry.id).toBeDefined();
      expect(entry.eventType).toBe('tool_execution');
      expect(entry.toolName).toBe('exec');
      expect(entry.success).toBe(true);
      expect(entry.durationMs).toBe(250);
      expect(entry.timestamp).toBeGreaterThan(0);
    });

    it('records a failed execution', () => {
      const entry = audit.logExecution({
        toolName: 'exec',
        toolCallId: 'tc-2',
        conversationId: 'conv-1',
        success: false,
        error: 'Process exited with code 1',
        exitCode: 1,
      });

      expect(entry.success).toBe(false);
      expect(entry.exitCode).toBe(1);
    });

    it('truncates output for storage', () => {
      const entry = audit.logExecution({
        toolName: 'exec',
        toolCallId: 'tc-3',
        conversationId: 'conv-1',
        success: true,
        output: 'X'.repeat(1000),
      });

      expect(entry.outputPreview).toBeDefined();
      // 500 chars + '...[truncated]' suffix
      expect(entry.outputPreview!.length).toBeLessThanOrEqual(520);
    });
  });

  // ===========================================================================
  // logApprovalRequested / logApprovalDecision
  // ===========================================================================

  describe('approval logging', () => {
    it('logs approval request', () => {
      const entry = audit.logApprovalRequested({
        toolName: 'exec',
        toolCallId: 'tc-1',
        conversationId: 'conv-1',
        approvalId: 'apr-1',
        securityLevel: 'moderate',
      });

      expect(entry.eventType).toBe('approval_requested');
      expect(entry.approvalId).toBe('apr-1');
      expect(entry.securityLevel).toBe('moderate');
    });

    it('logs approval granted', () => {
      const entry = audit.logApprovalDecision({
        toolName: 'exec',
        toolCallId: 'tc-1',
        conversationId: 'conv-1',
        approvalId: 'apr-1',
        decision: 'allow-once',
      });

      expect(entry.eventType).toBe('approval_granted');
      expect(entry.approvalDecision).toBe('allow-once');
    });

    it('logs approval denied', () => {
      const entry = audit.logApprovalDecision({
        toolName: 'exec',
        toolCallId: 'tc-1',
        conversationId: 'conv-1',
        approvalId: 'apr-1',
        decision: 'deny',
      });

      expect(entry.eventType).toBe('approval_denied');
    });

    it('logs approval expired', () => {
      const entry = audit.logApprovalExpired({
        toolName: 'exec',
        toolCallId: 'tc-1',
        conversationId: 'conv-1',
        approvalId: 'apr-1',
      });

      expect(entry.eventType).toBe('approval_expired');
    });
  });

  // ===========================================================================
  // logSecurityDenied / logRateLimited / logTimeout / logError
  // ===========================================================================

  describe('security and rate limit logging', () => {
    it('logs security denial', () => {
      const entry = audit.logSecurityDenied({
        toolName: 'exec',
        toolCallId: 'tc-1',
        conversationId: 'conv-1',
        securityMode: 'deny',
        reason: 'Tool execution disabled',
      });

      expect(entry.eventType).toBe('security_denied');
      expect(entry.denialReason).toBe('Tool execution disabled');
      expect(entry.securityMode).toBe('deny');
    });

    it('logs rate limiting', () => {
      const entry = audit.logRateLimited({
        toolName: 'exec',
        toolCallId: 'tc-1',
        conversationId: 'conv-1',
        limit: 100,
        remaining: 0,
        resetAt: Date.now() + 60000,
      });

      expect(entry.eventType).toBe('rate_limited');
      expect(entry.rateLimit).toBeDefined();
      expect(entry.rateLimit!.limit).toBe(100);
      expect(entry.rateLimit!.remaining).toBe(0);
    });

    it('logs timeout', () => {
      const entry = audit.logTimeout({
        toolName: 'exec',
        toolCallId: 'tc-1',
        conversationId: 'conv-1',
        durationMs: 300_000,
      });

      expect(entry.eventType).toBe('timeout');
      expect(entry.durationMs).toBe(300_000);
    });

    it('logs error', () => {
      const entry = audit.logError({
        toolName: 'exec',
        toolCallId: 'tc-1',
        conversationId: 'conv-1',
        error: 'Spawn failed',
      });

      expect(entry.eventType).toBe('error');
      expect(entry.error).toBe('Spawn failed');
    });
  });

  // ===========================================================================
  // query
  // ===========================================================================

  describe('query', () => {
    beforeEach(() => {
      audit.logExecution({
        toolName: 'exec',
        toolCallId: 'tc-1',
        conversationId: 'conv-1',
        userId: 'user-1',
        success: true,
      });
      audit.logExecution({
        toolName: 'file-ops',
        toolCallId: 'tc-2',
        conversationId: 'conv-2',
        userId: 'user-2',
        success: false,
      });
      audit.logSecurityDenied({
        toolName: 'exec',
        toolCallId: 'tc-3',
        conversationId: 'conv-1',
        securityMode: 'deny',
        reason: 'disabled',
      });
    });

    it('returns all entries without filter', () => {
      const results = audit.query();
      expect(results).toHaveLength(3);
    });

    it('filters by event type', () => {
      const results = audit.query({ eventTypes: ['tool_execution'] });
      expect(results).toHaveLength(2);
    });

    it('filters by tool name', () => {
      const results = audit.query({ toolName: 'exec' });
      expect(results).toHaveLength(2);
    });

    it('filters by conversation', () => {
      const results = audit.query({ conversationId: 'conv-1' });
      expect(results).toHaveLength(2);
    });

    it('filters by user', () => {
      const results = audit.query({ userId: 'user-2' });
      expect(results).toHaveLength(1);
      expect(results[0].userId).toBe('user-2');
    });

    it('filters by success', () => {
      const results = audit.query({ success: true });
      expect(results).toHaveLength(1);
    });

    it('sorts by timestamp descending', () => {
      const results = audit.query();
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].timestamp).toBeGreaterThanOrEqual(results[i].timestamp);
      }
    });

    it('applies pagination with offset and limit', () => {
      const page1 = audit.query({ limit: 2, offset: 0 });
      const page2 = audit.query({ limit: 2, offset: 2 });

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(1);
    });
  });

  // ===========================================================================
  // getEntry
  // ===========================================================================

  describe('getEntry', () => {
    it('returns entry by id', () => {
      const created = audit.logExecution({
        toolName: 'exec',
        toolCallId: 'tc-1',
        conversationId: 'conv-1',
        success: true,
      });

      const found = audit.get(created.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(created.id);
    });

    it('returns undefined for unknown id', () => {
      expect(audit.get('nonexistent')).toBeUndefined();
    });
  });

  // ===========================================================================
  // getStats
  // ===========================================================================

  describe('getStats', () => {
    it('computes statistics over entries', () => {
      audit.logExecution({
        toolName: 'exec',
        toolCallId: 'tc-1',
        conversationId: 'conv-1',
        success: true,
        durationMs: 100,
      });
      audit.logExecution({
        toolName: 'exec',
        toolCallId: 'tc-2',
        conversationId: 'conv-1',
        success: true,
        durationMs: 200,
      });
      audit.logExecution({
        toolName: 'file-ops',
        toolCallId: 'tc-3',
        conversationId: 'conv-1',
        success: false,
        durationMs: 50,
      });

      const stats = audit.getStats();
      expect(stats.totalEvents).toBe(3);
      expect(stats.byTool['exec']).toBe(2);
      expect(stats.byTool['file-ops']).toBe(1);
      expect(stats.byEventType['tool_execution']).toBe(3);
    });
  });

  // ===========================================================================
  // subscribe / unsubscribe
  // ===========================================================================

  describe('subscribe', () => {
    it('notifies listeners on new entries', () => {
      const entries: AuditEntry[] = [];
      const unsub = audit.subscribe((entry) => entries.push(entry));

      audit.logExecution({
        toolName: 'exec',
        toolCallId: 'tc-1',
        conversationId: 'conv-1',
        success: true,
      });

      expect(entries).toHaveLength(1);
      expect(entries[0].eventType).toBe('tool_execution');

      unsub();

      audit.logExecution({
        toolName: 'exec',
        toolCallId: 'tc-2',
        conversationId: 'conv-1',
        success: true,
      });

      // Should not receive second event
      expect(entries).toHaveLength(1);
    });
  });

  // ===========================================================================
  // clear
  // ===========================================================================

  describe('clear', () => {
    it('removes all entries', () => {
      audit.logExecution({
        toolName: 'exec',
        toolCallId: 'tc-1',
        conversationId: 'conv-1',
        success: true,
      });

      audit.clear();
      expect(audit.query()).toHaveLength(0);
    });
  });
});
