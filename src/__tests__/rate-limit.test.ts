import { describe, it, expect } from 'vitest';
import { checkRateLimit } from '@/lib/rate-limit';

describe('Rate Limiter Defense', () => {
  it('allows requests within the configured limit', () => {
    const key = `test-user-${Date.now()}`;
    const limit = 5;

    for (let i = 0; i < limit; i++) {
      const result = checkRateLimit(key, limit, 60000);
      expect(result.isAllowed).toBe(true);
      expect(result.remaining).toBe(limit - 1 - i);
    }
  });

  it('blocks requests exceeding the configured limit', () => {
    const key = `brute-force-${Date.now()}`;
    const limit = 3;

    // First 3 should succeed
    checkRateLimit(key, limit, 60000);
    checkRateLimit(key, limit, 60000);
    checkRateLimit(key, limit, 60000);

    // 4th should be blocked
    const blocked = checkRateLimit(key, limit, 60000);
    expect(blocked.isAllowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetInMs).toBeGreaterThan(0);
  });

  it('maintains independent limits for different keys', () => {
    const keyA = `user-a-${Date.now()}`;
    const keyB = `user-b-${Date.now()}`;

    // Exhaust user A
    checkRateLimit(keyA, 1, 60000);
    const blockedA = checkRateLimit(keyA, 1, 60000);
    expect(blockedA.isAllowed).toBe(false);

    // User B should still be allowed
    const allowedB = checkRateLimit(keyB, 1, 60000);
    expect(allowedB.isAllowed).toBe(true);
  });
});
