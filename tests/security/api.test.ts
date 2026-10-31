/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as parseNotificationRoute } from '@/app/api/exams/parse-notification/route';
import { GET as revalidateRoute } from '@/app/api/revalidate/route';
import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}));

// Mock Next.js headers/cookies if needed
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('API Security Tests', () => {
  describe('parse-notification', () => {
    it('401 without authentication', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);
      const req = new NextRequest('http://localhost/api/exams/parse-notification', { method: 'POST' });
      const res = await parseNotificationRoute(req);
      expect(res.status).toBe(401);
    });
  });

  describe('revalidate', () => {
    beforeEach(() => {
      process.env.REVALIDATE_SECRET = 'secret123';
    });
    
    it('rejected without secret', async () => {
      const req = new Request('http://localhost/api/revalidate');
      const res = await revalidateRoute(req);
      expect(res.status).toBe(401);
    });

    it('rejected with incorrect secret', async () => {
      const req = new Request('http://localhost/api/revalidate', {
        headers: { authorization: 'Bearer wrong' }
      });
      const res = await revalidateRoute(req);
      expect(res.status).toBe(401);
    });

    it('succeeds with correct server-side secret', async () => {
      const req = new Request('http://localhost/api/revalidate', {
        headers: { authorization: 'Bearer secret123' }
      });
      const res = await revalidateRoute(req);
      expect(res.status).toBe(200);
    });
  });
});
