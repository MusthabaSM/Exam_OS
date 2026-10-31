import prisma from '@/lib/db/prisma';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Returns the currently authenticated Prisma User.
 * If the user is authenticated via Supabase but not in Prisma, it creates the Prisma User.
 * If the user is not authenticated, returns null.
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();

  if (error || !supabaseUser) {
    return null;
  }

  // Map Supabase User to Prisma User
  // We use the Supabase User ID as the Prisma User ID for 1:1 mapping, 
  // or we can just look up by email. Let's look up by email or id.
  let prismaUser = await prisma.user.findUnique({
    where: { id: supabaseUser.id },
  });

  if (!prismaUser) {
    // Check if a user with this email exists (like the demo user or someone who signed up differently)
    // Actually, to be safe and isolate properly, we should upsert based on the Supabase ID.
    // If the email exists but with a different ID, we might need to handle it, but
    // usually we just create a new record.
    const email = supabaseUser.email || '';
    
    // Check if email already exists to avoid unique constraint violations
    const existingByEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingByEmail) {
      // If the email exists, we return it. We might want to update the ID to match Supabase 
      // but Prisma doesn't easily allow changing primary keys if there are relations.
      // So we just return the existing user.
      prismaUser = existingByEmail;
    } else {
      // Create new user
      prismaUser = await prisma.user.create({
        data: {
          id: supabaseUser.id, // Use Supabase ID directly
          email: email,
          name: supabaseUser.user_metadata?.full_name || email.split('@')[0],
        },
      });
    }
  }

  return prismaUser;
}

/**
 * Returns the ID of the currently authenticated user.
 * Throws an error if not authenticated.
 */
export async function getCurrentUserId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user.id;
}

/**
 * Ensures the user is authenticated. If not, redirects to /login.
 */
export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}
