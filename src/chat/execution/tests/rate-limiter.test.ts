import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../utils/logger.js', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { RateLimiter } from '../rate-limiter.js';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    limiter?.destroy?.();
    vi.useRealTimers();
  });

  // ===========================================================================
  // Disabled limiter
  // ===========================================================================

  describe('disabled', () => {
    it('allows everything when disabled', () => {
      limiter = new RateLimiter({ enabled: false });

      const result = limiter.check({
        userId: 'user-1',
        conversationId: 'conv-1',
        toolName: 'exec',
      });

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(Infinity);
    });
  });

  // ===========================================================================
  // Global limit
  // ===========================================================================

  describe('global limit', () => {
    it('enforces global rate limit', () => {
      limiter = new RateLimiter({
        enabled: true,
        globalLimit: 3,
        globalWindowMs: 60_000,
        userLimit: 1000,
        conversationLimit: 1000,
        defaultToolLimit: 1000,
      });

      const ctx = { userId: 'u1', conversationId: 'c1', toolName: 'exec' };

      expect(limiter.check(ctx).allowed).toBe(true);
      expect(limiter.check(ctx).allowed).toBe(true);
      expect(limiter.check(ctx).allowed).toBe(true);

      const fourth = limiter.check(ctx);
      expect(fourth.allowed).toBe(false);
      expect(fourth.limitType).toBe('global');
      expect(fourth.remaining).toBe(0);
    });

    it('resets after window expires', () => {
      limiter = new RateLimiter({
        enabled: true,
        globalLimit: 1,
        globalWindowMs: 10_000,
        userLimit: 1000,
        conversationLimit: 1000,
        defaultToolLimit: 1000,
      });

      const ctx = { userId: 'u1', conversationId: 'c1', toolName: 'exec' };

      expect(limiter.check(ctx).allowed).toBe(true);
      expect(limiter.check(ctx).allowed).toBe(false);

      // Advance past window
      vi.advanceTimersByTime(10_001);

      expect(limiter.check(ctx).allowed).toBe(true);
    });
  });

  // ===========================================================================
  // User limit
  // ===========================================================================

  describe('user limit', () => {
    it('enforces per-user rate limit', () => {
      limiter = new RateLimiter({
        enabled: true,
        userLimit: 2,
        userWindowMs: 60_000,
        globalLimit: 1000,
        conversationLimit: 1000,
        defaultToolLimit: 1000,
      });

      expect(limiter.check({ userId: 'u1', conversationId: 'c1', toolName: 'exec' }).allowed).toBe(true);
      expect(limiter.check({ userId: 'u1', conversationId: 'c1', toolName: 'exec' }).allowed).toBe(true);

      const third = limiter.check({ userId: 'u1', conversationId: 'c1', toolName: 'exec' });
      expect(third.allowed).toBe(false);
      expect(third.limitType).toBe('user');
    });

    it('tracks users independently', () => {
      limiter = new RateLimiter({
        enabled: true,
        userLimit: 1,
        userWindowMs: 60_000,
        globalLimit: 1000,
        conversationLimit: 1000,
        defaultToolLimit: 1000,
      });

      expect(limiter.check({ userId: 'u1', conversationId: 'c1', toolName: 'exec' }).allowed).toBe(true);
      expect(limiter.check({ userId: 'u2', conversationId: 'c1', toolName: 'exec' }).allowed).toBe(true);

      // u1 exhausted, u2 still fine
      expect(limiter.check({ userId: 'u1', conversationId: 'c1', toolName: 'exec' }).allowed).toBe(false);
    });
  });

  // ===========================================================================
  // Conversation limit
  // ===========================================================================

  describe('conversation limit', () => {
    it('enforces per-conversation rate limit', () => {
      limiter = new RateLimiter({
        enabled: true,
        conversationLimit: 2,
        conversationWindowMs: 60_000,
        globalLimit: 1000,
        userLimit: 1000,
        defaultToolLimit: 1000,
      });

      expect(limiter.check({ conversationId: 'c1', toolName: 'exec' }).allowed).toBe(true);
      expect(limiter.check({ conversationId: 'c1', toolName: 'exec' }).allowed).toBe(true);

      const third = limiter.check({ conversationId: 'c1', toolName: 'exec' });
      expect(third.allowed).toBe(false);
      expect(third.limitType).toBe('conversation');
    });

    it('tracks conversations independently', () => {
      limiter = new RateLimiter({
        enabled: true,
        conversationLimit: 1,
        conversationWindowMs: 60_000,
        globalLimit: 1000,
        userLimit: 1000,
        defaultToolLimit: 1000,
      });

      expect(limiter.check({ conversationId: 'c1', toolName: 'exec' }).allowed).toBe(true);
      expect(limiter.check({ conversationId: 'c2', toolName: 'exec' }).allowed).toBe(true);
      expect(limiter.check({ conversationId: 'c1', toolName: 'exec' }).allowed).toBe(false);
    });
  });

  // ===========================================================================
  // Tool limit
  // ===========================================================================

  describe('tool limit', () => {
    it('enforces per-tool rate limit', () => {
      limiter = new RateLimiter({
        enabled: true,
        defaultToolLimit: 2,
        defaultToolWindowMs: 60_000,
        globalLimit: 1000,
        userLimit: 1000,
        conversationLimit: 1000,
      });

      expect(limiter.check({ conversationId: 'c1', toolName: 'exec' }).allowed).toBe(true);
      expect(limiter.check({ conversationId: 'c1', toolName: 'exec' }).allowed).toBe(true);

      const third = limiter.check({ conversationId: 'c1', toolName: 'exec' });
      expect(third.allowed).toBe(false);
      expect(third.limitType).toBe('tool');
    });

    it('tracks tools independently', () => {
      limiter = new RateLimiter({
        enabled: true,
        defaultToolLimit: 1,
        defaultToolWindowMs: 60_000,
        globalLimit: 1000,
        userLimit: 1000,
        conversationLimit: 1000,
      });

      expect(limiter.check({ conversationId: 'c1', toolName: 'exec' }).allowed).toBe(true);
      expect(limiter.check({ conversationId: 'c1', toolName: 'file-ops' }).allowed).toBe(true);
      expect(limiter.check({ conversationId: 'c1', toolName: 'exec' }).allowed).toBe(false);
    });
  });

  // ===========================================================================
  // Tool overrides
  // ===========================================================================

  describe('tool overrides', () => {
    it('uses custom limit for specific tools', () => {
      limiter = new RateLimiter({
        enabled: true,
        defaultToolLimit: 10,
        defaultToolWindowMs: 60_000,
        globalLimit: 1000,
        userLimit: 1000,
        conversationLimit: 1000,
      });

      limiter.setToolLimit('dangerous-tool', 1, 60_000);

      expect(limiter.check({ conversationId: 'c1', toolName: 'dangerous-tool' }).allowed).toBe(true);
      expect(limiter.check({ conversationId: 'c1', toolName: 'dangerous-tool' }).allowed).toBe(false);

      // Default tools still have higher limit
      expect(limiter.check({ conversationId: 'c1', toolName: 'exec' }).allowed).toBe(true);
    });
  });

  // ===========================================================================
  // Result fields
  // ===========================================================================

  describe('result fields', () => {
    it('returns resetAt in the future', () => {
      limiter = new RateLimiter({
        enabled: true,
        globalLimit: 1,
        globalWindowMs: 30_000,
        userLimit: 1000,
        conversationLimit: 1000,
        defaultToolLimit: 1000,
      });

      limiter.check({ conversationId: 'c1', toolName: 'exec' });
      const result = limiter.check({ conversationId: 'c1', toolName: 'exec' });

      expect(result.allowed).toBe(false);
      expect(result.resetAt).toBeGreaterThan(Date.now());
    });

    it('returns remaining count', () => {
      limiter = new RateLimiter({
        enabled: true,
        globalLimit: 3,
        globalWindowMs: 60_000,
        userLimit: 1000,
        conversationLimit: 1000,
        defaultToolLimit: 1000,
      });

      const first = limiter.check({ conversationId: 'c1', toolName: 'exec' });
      expect(first.remaining).toBe(2);

      const second = limiter.check({ conversationId: 'c1', toolName: 'exec' });
      expect(second.remaining).toBe(1);
    });
  });

  // ===========================================================================
  // Sliding window cleanup
  // ===========================================================================

  describe('cleanup', () => {
    it('cleans up expired timestamps', () => {
      limiter = new RateLimiter({
        enabled: true,
        globalLimit: 1000,
        globalWindowMs: 10_000,
        userLimit: 1,
        userWindowMs: 10_000,
        conversationLimit: 1000,
        defaultToolLimit: 1000,
      });

      // Exhaust user limit
      expect(limiter.check({ userId: 'u1', conversationId: 'c1', toolName: 'exec' }).allowed).toBe(true);
      expect(limiter.check({ userId: 'u1', conversationId: 'c1', toolName: 'exec' }).allowed).toBe(false);

      // Advance past window + cleanup interval
      vi.advanceTimersByTime(70_000);

      // Should be allowed again after cleanup
      expect(limiter.check({ userId: 'u1', conversationId: 'c1', toolName: 'exec' }).allowed).toBe(true);
    });
  });
});
