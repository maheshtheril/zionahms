import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock auth module before importing requireAuth
vi.mock('@/auth', () => ({
  auth: vi.fn()
}));

import { auth } from '@/auth';
import { requireAuth, requireAdmin } from '@/lib/require-auth';

describe('API Security Guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('requireAuth', () => {
    it('returns 401 Unauthorized when no session exists', async () => {
      vi.mocked(auth).mockResolvedValue(null as any);

      const result = await requireAuth();
      expect(result.session).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error?.status).toBe(401);
    });

    it('returns 401 Unauthorized when session exists but has no user ID', async () => {
      vi.mocked(auth).mockResolvedValue({ user: {} } as any);

      const result = await requireAuth();
      expect(result.session).toBeNull();
      expect(result.error?.status).toBe(401);
    });

    it('passes and returns session when user is authenticated', async () => {
      const mockSession = { user: { id: 'usr-123', email: 'doctor@hospital.com' } };
      vi.mocked(auth).mockResolvedValue(mockSession as any);

      const result = await requireAuth();
      expect(result.error).toBeNull();
      expect(result.session).toEqual(mockSession);
    });
  });

  describe('requireAdmin', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as any);

      const result = await requireAdmin();
      expect(result.session).toBeNull();
      expect(result.error?.status).toBe(401);
    });

    it('returns 403 Forbidden when user is authenticated but not an admin', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: 'usr-123', isAdmin: false, isTenantAdmin: false }
      } as any);

      const result = await requireAdmin();
      expect(result.session).toBeNull();
      expect(result.error?.status).toBe(403);
    });

    it('passes when user is a super admin (isAdmin = true)', async () => {
      const mockSession = {
        user: { id: 'admin-1', isAdmin: true, isTenantAdmin: false }
      };
      vi.mocked(auth).mockResolvedValue(mockSession as any);

      const result = await requireAdmin();
      expect(result.error).toBeNull();
      expect(result.session).toEqual(mockSession);
    });

    it('passes when user is a tenant admin (isTenantAdmin = true)', async () => {
      const mockSession = {
        user: { id: 'admin-2', isAdmin: false, isTenantAdmin: true }
      };
      vi.mocked(auth).mockResolvedValue(mockSession as any);

      const result = await requireAdmin();
      expect(result.error).toBeNull();
      expect(result.session).toEqual(mockSession);
    });
  });
});
