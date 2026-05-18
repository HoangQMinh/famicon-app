import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCircleRequests, getCircleInfo } from '@/app/actions/requests';
import { CircleHomeClient } from './circle-home-client';
import { NotificationPermissionPrompt } from '@/components/features/notification-permission-prompt';
import { IOSInstallGuide } from '@/components/features/ios-install-guide';
import { LINEConnectCard } from '@/components/features/line-connect-card';

/**
 * Circle Home page — Server Component.
 *
 * Responsibilities:
 *   1. Verify session — redirect to /auth if not logged in
 *   2. Look up user's active circle membership (first active circle)
 *   3. If no membership → redirect to /onboarding
 *   4. Fetch circle info, open requests, and user profile server-side (SSR for fast first paint)
 *   5. Pass data to CircleHomeClient for Realtime updates + interactivity
 *   6. Render notification opt-in components (non-blocking, after main content)
 *
 * This page is protected by middleware (PROTECTED_ROUTES includes /home).
 * The auth check here is defense-in-depth.
 */
export default async function HomePage() {
  // --- 1. Auth guard ---
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // --- 2. Fetch user's active circle membership ---
  // Supabase RLS "members_select_same_circle" applies.
  const { data: memberships, error: memberError } = await supabase
    .from('circle_members')
    .select('circle_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1);

  if (memberError) {
    // Redirect to onboarding — safer than showing an error on the home screen
    redirect('/onboarding');
  }

  if (!memberships || memberships.length === 0) {
    // User has no active circle — send to onboarding to complete setup
    redirect('/onboarding');
  }

  const circleId = memberships[0].circle_id;

  // --- 3. Fetch circle info, open requests, and user profile in parallel ---
  const [circleInfoResult, requestsResult, profileResult] = await Promise.all([
    getCircleInfo(circleId),
    getCircleRequests(circleId),
    // Fetch line_user_id from profile to decide whether to show LINEConnectCard
    supabase
      .from('profiles')
      .select('line_user_id')
      .eq('id', user.id)
      .single(),
  ]);

  // If circle info fails, redirect rather than crash.
  if (!circleInfoResult.success) {
    redirect('/onboarding');
  }

  // If requests fail, render the page with an empty list — the Realtime
  // subscription may recover, and the empty-state UX handles this gracefully.
  const initialRequests = requestsResult.success ? requestsResult.data : [];

  const { name: circleName, member_count: memberCount } = circleInfoResult.data;

  // Extract line_user_id — graceful fallback if profile fetch fails
  const lineUserId: string | null = profileResult.data?.line_user_id ?? null;
  const hasLineUserId = lineUserId !== null && lineUserId !== '';

  // VAPID public key — undefined if not configured (graceful degradation)
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  // --- 4. Render client shell with SSR data ---
  return (
    <>
      {/*
       * Notification opt-in prompts — shown after main content, non-blocking.
       *
       * Order of precedence (per spec F5.3):
       *   - NotificationPermissionPrompt shown first (Web Push opt-in)
       *   - IOSInstallGuide shown below (for iOS users to enable Web Push via PWA)
       *   - LINEConnectCard shown last (LINE fallback for iOS without Web Push)
       *
       * Each component manages its own visibility via Notification.permission
       * and localStorage — renders null when not applicable.
       */}
      {vapidPublicKey && (
        <NotificationPermissionPrompt vapidPublicKey={vapidPublicKey} />
      )}
      <IOSInstallGuide />
      <LINEConnectCard hasLineUserId={hasLineUserId} isIOS={false} />
      {/*
       * Note on isIOS above: LINEConnectCard receives isIOS={false} as a static prop
       * from the Server Component. The actual iOS detection must happen client-side
       * (navigator.userAgent). LINEConnectCard handles this internally via a
       * useState initializer that reads isIOS prop and also checks its own detection.
       *
       * For Sprint 5, isIOS detection is deferred to the client: the component
       * uses the prop as a hint but performs its own check in useState(() => {...}).
       * Passing false here means "Server does not know — let component decide."
       * TODO Sprint 6: extract isIOS to a shared client hook.
       */}

      <CircleHomeClient
        initialRequests={initialRequests}
        circleId={circleId}
        circleName={circleName}
        memberCount={memberCount}
      />
    </>
  );
}
