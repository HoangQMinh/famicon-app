import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { NewRequestForm } from '@/components/features/new-request-form';

/**
 * New Request page — Server Component wrapper.
 *
 * Responsibilities:
 *   1. Verify session — redirect to /auth if not logged in
 *   2. Look up user's active circle membership to get circle_id
 *   3. Redirect to /onboarding if no active circle
 *   4. Render NewRequestForm (Client Component) with circle_id
 *
 * URL: /new-request (per coding-conventions.md and sprint-4-spec)
 */
export const metadata: Metadata = {
  title: 'Nhờ giúp',
};

export default async function NewRequestPage() {
  // --- 1. Auth guard ---
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // --- 2. Fetch user's active circle membership ---
  const { data: memberships, error: memberError } = await supabase
    .from('circle_members')
    .select('circle_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1);

  if (memberError || !memberships || memberships.length === 0) {
    redirect('/onboarding');
  }

  const circleId = memberships[0].circle_id;

  // --- 3. Render Client Component with circle_id ---
  return <NewRequestForm circleId={circleId} />;
}
