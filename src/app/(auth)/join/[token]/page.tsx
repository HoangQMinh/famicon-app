import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getInviteState, acceptInvite } from '@/app/actions/invites';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface JoinPageProps {
  params: Promise<{ token: string }>;
}

// ---------------------------------------------------------------------------
// Page — Server Component
// ---------------------------------------------------------------------------

/**
 * /join/[token] — handles invite link landing.
 *
 * States:
 *   A — Valid token, user NOT logged in  → show circle info + CTA to /auth
 *   A' — Valid token, user IS logged in  → acceptInvite server-side → redirect
 *   B — Token expired or revoked         → expired message
 *   C — Token invalid (bad format)       → invalid message
 */
export default async function JoinPage({ params }: JoinPageProps) {
  const { token } = await params;

  // 1. Validate token and determine invite state
  const inviteState = await getInviteState(token);

  // 2. If valid — check if user is already logged in
  if (inviteState.state === 'valid') {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Logged-in user: accept invite immediately, then redirect
      const result = await acceptInvite(token);

      if (!result.success) {
        // Invite could not be accepted (already used, race condition, etc.)
        // Fall through to render the valid state — user will see the join screen
        // which is slightly misleading, but safer than a blank error.
        // In practice this path is rare; the getInviteState check above guards it.
      } else {
        if (result.data.is_returning_member) {
          redirect('/home');
        } else {
          redirect('/onboarding');
        }
      }
    }
  }

  // 3. Render appropriate state
  return (
    <main className="auth-page join-page">
      {inviteState.state === 'valid' && (
        <ValidInviteView
          circleName={inviteState.circle_name}
          token={inviteState.token}
        />
      )}
      {inviteState.state === 'expired' && <ExpiredInviteView />}
      {inviteState.state === 'invalid' && <InvalidInviteView />}
    </main>
  );
}

// ---------------------------------------------------------------------------
// Sub-views
// ---------------------------------------------------------------------------

interface ValidInviteViewProps {
  circleName: string;
  token: string;
}

function ValidInviteView({ circleName, token }: ValidInviteViewProps) {
  return (
    <div className="join-state">
      <div className="join-icon" aria-hidden="true">
        🎉
      </div>

      <h1 className="auth-heading" style={{ textAlign: 'center' }}>
        Bạn được mời vào
      </h1>
      <p
        className="join-circle-name"
        aria-label={`Vòng tròn: ${circleName}`}
      >
        {circleName}
      </p>
      <p className="auth-subtext" style={{ textAlign: 'center' }}>
        Đăng nhập để tham gia vòng tròn cùng mọi người nhé.
      </p>

      <Link
        href={`/auth?invite_token=${encodeURIComponent(token)}`}
        className="auth-btn"
        style={{ display: 'flex', textDecoration: 'none', marginTop: 'var(--space-4)' }}
      >
        Tiếp tục
      </Link>
    </div>
  );
}

function ExpiredInviteView() {
  return (
    <div className="join-state">
      <div className="join-icon" aria-hidden="true">
        ⏰
      </div>

      <h1 className="auth-heading" style={{ textAlign: 'center' }}>
        Link mời đã hết hạn
      </h1>
      <p className="auth-subtext" style={{ textAlign: 'center' }}>
        Link này không còn hiệu lực. Nhờ người mời bạn gửi link mới nhé.
      </p>

      <Link
        href="/"
        className="auth-btn"
        style={{
          display: 'flex',
          textDecoration: 'none',
          marginTop: 'var(--space-4)',
          background: 'var(--bg-card)',
          color: 'var(--fg-primary)',
          border: '1.5px solid var(--border-soft)',
          boxShadow: 'none',
        }}
      >
        Về trang chủ
      </Link>
    </div>
  );
}

function InvalidInviteView() {
  return (
    <div className="join-state">
      <div className="join-icon" aria-hidden="true">
        ❓
      </div>

      <h1 className="auth-heading" style={{ textAlign: 'center' }}>
        Link mời không hợp lệ
      </h1>
      <p className="auth-subtext" style={{ textAlign: 'center' }}>
        Link này không đúng hoặc đã bị xóa. Kiểm tra lại link trong tin nhắn nhé.
      </p>

      <Link
        href="/"
        className="auth-btn"
        style={{
          display: 'flex',
          textDecoration: 'none',
          marginTop: 'var(--space-4)',
          background: 'var(--bg-card)',
          color: 'var(--fg-primary)',
          border: '1.5px solid var(--border-soft)',
          boxShadow: 'none',
        }}
      >
        Về trang chủ
      </Link>
    </div>
  );
}
