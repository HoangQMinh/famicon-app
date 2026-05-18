import { InviteScreenClient } from '@/components/features/invite-screen-client';

/**
 * /invite — Page wrapper.
 * Server Component — fetches nothing (auth guard in middleware),
 * delegates all interactive logic to the Client Component.
 */
export default function InvitePage() {
  return <InviteScreenClient />;
}
