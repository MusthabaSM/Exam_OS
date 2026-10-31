/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { getCurrentUserId, getCurrentUser, requireCurrentUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db/prisma';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('@/lib/db/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('Auth Helpers', () => {
  it('should return null if not authenticated', async () => {
    (createClient as any).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    });

    const user = await getCurrentUser();
    expect(user).toBeNull();
  });

  it('should map Supabase user to Prisma user successfully', async () => {
    const mockSupabaseUser = { id: 'uuid-123', email: 'test@example.com' };
    const mockPrismaUser = { id: 'uuid-123', email: 'test@example.com', name: 'Test User' };

    (createClient as any).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockSupabaseUser }, error: null }),
      },
    });

    (prisma.user.findUnique as any).mockResolvedValue(mockPrismaUser);

    const user = await getCurrentUser();
    expect(user).toEqual(mockPrismaUser);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'uuid-123' } });
  });

  it('should create Prisma user if one does not exist', async () => {
    const mockSupabaseUser = { id: 'uuid-new', email: 'new@example.com', user_metadata: { full_name: 'New User' } };
    const mockNewPrismaUser = { id: 'uuid-new', email: 'new@example.com', name: 'New User' };

    (createClient as any).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockSupabaseUser }, error: null }),
      },
    });

    // first findUnique returns null (no id match)
    // second findUnique returns null (no email match)
    (prisma.user.findUnique as any).mockResolvedValue(null);
    (prisma.user.create as any).mockResolvedValue(mockNewPrismaUser);

    const user = await getCurrentUser();
    expect(user).toEqual(mockNewPrismaUser);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        id: 'uuid-new',
        email: 'new@example.com',
        name: 'New User',
      },
    });
  });
});
