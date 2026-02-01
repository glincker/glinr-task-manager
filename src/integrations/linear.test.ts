import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleLinearWebhook, verifyLinearSignature } from './linear';
import { createHmac } from 'crypto';

// Mock process.env
vi.stubEnv('LINEAR_WEBHOOK_SECRET', 'test-secret');

describe('Linear Integration', () => {
  const secret = 'test-secret';

  describe('verifyLinearSignature', () => {
    it('should return true for valid signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const signature = createHmac('sha256', secret).update(payload).digest('hex');
      expect(verifyLinearSignature(payload, signature)).toBe(true);
    });

    it('should return false for invalid signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      expect(verifyLinearSignature(payload, 'invalid')).toBe(false);
    });

    it('should return false for missing signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      expect(verifyLinearSignature(payload, undefined)).toBe(false);
    });
  });

  describe('handleLinearWebhook', () => {
    let mockContext: any;

    beforeEach(() => {
        mockContext = {
            req: {
                header: vi.fn(),
                text: vi.fn()
            }
        };
    });

    it('should handle Issue create event with AI prefix', async () => {
      const payload = {
        action: 'create',
        type: 'Issue',
        createdAt: new Date().toISOString(),
        webhookTimestamp: Date.now(),
        url: 'https://linear.app/issue/LIN-123',
        data: {
          id: 'issue-id',
          title: 'AI: Fix this bug',
          description: 'Bug details',
          priority: 2,
          number: 123,
          state: { name: 'Todo' }
        }
      };

      const rawBody = JSON.stringify(payload);
      const signature = createHmac('sha256', secret).update(rawBody).digest('hex');

      mockContext.req.header.mockImplementation((name: string) => {
        if (name === 'Linear-Event') return 'Issue';
        if (name === 'Linear-Signature') return signature;
        return '';
      });
      mockContext.req.text.mockResolvedValue(rawBody);

      const result = await handleLinearWebhook(mockContext);

      expect(result).not.toBeNull();
      expect(result?.title).toBe('AI: Fix this bug');
      expect(result?.source).toBe('linear');
      expect(result?.priority).toBe(2); // High -> High
    });

    it('should ignore Issue create event without AI prefix', async () => {
        const payload = {
          action: 'create',
          type: 'Issue',
          createdAt: new Date().toISOString(),
          webhookTimestamp: Date.now(),
          url: 'https://linear.app/issue/LIN-123',
          data: {
            id: 'issue-id',
            title: 'Fix this bug',
            description: 'Bug details',
            priority: 2,
            number: 123,
            state: { name: 'Todo' }
          }
        };

        const rawBody = JSON.stringify(payload);
        const signature = createHmac('sha256', secret).update(rawBody).digest('hex');

        mockContext.req.header.mockImplementation((name: string) => {
          if (name === 'Linear-Event') return 'Issue';
          if (name === 'Linear-Signature') return signature;
          return '';
        });
        mockContext.req.text.mockResolvedValue(rawBody);

        const result = await handleLinearWebhook(mockContext);

        expect(result).toBeNull();
      });

    it('should handle Comment create event with /ai command', async () => {
      const payload = {
        action: 'create',
        type: 'Comment',
        createdAt: new Date().toISOString(),
        webhookTimestamp: Date.now(),
        url: 'https://linear.app/issue/LIN-123#comment-1',
        data: {
          id: 'comment-id',
          body: '/ai fix this please',
          issueId: 'issue-id',
          userId: 'user-id'
        }
      };

      const rawBody = JSON.stringify(payload);
      const signature = createHmac('sha256', secret).update(rawBody).digest('hex');

      mockContext.req.header.mockImplementation((name: string) => {
        if (name === 'Linear-Event') return 'Comment';
        if (name === 'Linear-Signature') return signature;
        return '';
      });
      mockContext.req.text.mockResolvedValue(rawBody);

      const result = await handleLinearWebhook(mockContext);

      expect(result).not.toBeNull();
      expect(result?.title).toBe('Linear Task from Comment');
      expect(result?.prompt).toBe('fix this please');
    });

    it('should throw error for invalid signature', async () => {
        const payload = { test: 'data' };
        const rawBody = JSON.stringify(payload);

        mockContext.req.header.mockImplementation((name: string) => {
          if (name === 'Linear-Event') return 'Issue';
          if (name === 'Linear-Signature') return 'invalid';
          return '';
        });
        mockContext.req.text.mockResolvedValue(rawBody);

        await expect(handleLinearWebhook(mockContext)).rejects.toThrow('Invalid webhook signature');
    });
  });
});
