import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getMyProfile } from '@/app/actions/profiles';
import { ProfileClient } from '@/components/features/profile-client';

/**
 * Profile page — Server Component.
 *
 * Responsibilities:
 *   1. Auth guard — redirect to /auth if not logged in
 *   2. Fetch user's active circle membership
 *   3. Call getMyProfile() to load profile data
 *   4. Render ProfileClient with profile + circleId + currentUserId
 *
 * Protected by middleware (PROTECTED_ROUTES includes /profile).
 * The auth check here is defense-in-depth.
 */
export default async function ProfilePage() {
  // --- 1. Auth guard ---
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // --- 2. Fetch active circle membership ---
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

  // --- 3. Fetch profile data ---
  const profileResult = await getMyProfile();

  if (!profileResult.success) {
    // Throw so error.tsx boundary catches it with retry option
    throw new Error(profileResult.error);
  }

  // --- 4. Render client component ---
  return (
    <ProfileClient
      profile={profileResult.data}
      circleId={circleId}
      currentUserId={user.id}
    />
  );
}
