import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCircleMembers } from '@/app/actions/members';
import { MembersClient } from '@/components/features/members-client';

/**
 * Circle Members page — Server Component.
 *
 * Responsibilities:
 *   1. Auth guard — redirect to /auth if not logged in
 *   2. Call getCircleMembers(id) — RLS enforces circle membership
 *   3. If not a member → redirect (handled by getCircleMembers returning error)
 *   4. Render MembersClient with members data, circleId, currentUserId
 *
 * URL: /circles/[id]/members
 * Protected by middleware.
 */

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MembersPage({ params }: PageProps) {
  const { id } = await params;

  // --- 1. Auth guard ---
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // --- 2. Fetch members ---
  const result = await getCircleMembers(id);

  if (!result.success) {
    // Throw so error.tsx boundary catches it with retry button
    throw new Error(result.error);
  }

  const { members } = result.data;

  return (
    <MembersClient
      members={members}
      circleId={id}
      currentUserId={user.id}
    />
  );
}
