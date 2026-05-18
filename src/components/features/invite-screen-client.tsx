'use client';

import { useEffect, useState, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { createLinkInvite, revokeLinkInvites } from '@/app/actions/invites';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type InviteStatus =
  | { phase: 'loading' }
  | { phase: 'ready'; token: string; invite_url: string; expires_at: string }
  | { phase: 'error'; message: string };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatExpiryDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
}

function truncateUrl(url: string, maxLen = 38): string {
  return url.length > maxLen ? url.slice(0, maxLen) + '…' : url;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * InviteScreenClient — /invite page implementation.
 *
 * States:
 *   Loading  — skeleton while createLinkInvite() resolves
 *   Ready    — show link, share/copy/revoke buttons
 *   Error    — failed to load invite, with retry action
 */
export function InviteScreenClient() {
  const [status, setStatus] = useState<InviteStatus>({ phase: 'loading' });
  const [copyLabel, setCopyLabel] = useState<'copy' | 'copied'>('copy');
  const [isPending, startTransition] = useTransition();
  const [showConfirmRevoke, setShowConfirmRevoke] = useState(false);

  // Load (or create) the invite link on mount
  const loadInvite = useCallback(async () => {
    setStatus({ phase: 'loading' });
    try {
      const result = await createLinkInvite();
      if (!result.success) {
        setStatus({ phase: 'error', message: result.error });
        return;
      }
      setStatus({
        phase: 'ready',
        token: result.data.token,
        invite_url: result.data.invite_url,
        expires_at: result.data.expires_at,
      });
    } catch {
      setStatus({
        phase: 'error',
        message: 'Không kết nối được. Kiểm tra mạng và thử lại nhé.',
      });
    }
  }, []);

  useEffect(() => {
    loadInvite();
  }, [loadInvite]);

  // Share via Web Share API, fall back to copy
  function handleShare() {
    if (status.phase !== 'ready') return;
    const shareData = {
      title: 'FAMICON — Vòng Tròn Tương Trợ',
      text: 'Bạn được mời vào vòng tròn hỗ trợ gia đình Việt tại Nhật. Tham gia nhé!',
      url: status.invite_url,
    };
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share(shareData).catch(() => {
        // User dismissed — no action needed
      });
    } else {
      handleCopy();
    }
  }

  // Copy to clipboard
  function handleCopy() {
    if (status.phase !== 'ready') return;
    navigator.clipboard.writeText(status.invite_url).then(() => {
      setCopyLabel('copied');
      setTimeout(() => setCopyLabel('copy'), 2000);
    });
  }

  // Revoke then create a new link
  function handleRevoke() {
    setShowConfirmRevoke(false);
    startTransition(async () => {
      const revokeResult = await revokeLinkInvites();
      if (!revokeResult.success) {
        setStatus({ phase: 'error', message: revokeResult.error });
        return;
      }
      await loadInvite();
    });
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <main className="invite-page">
      {/* Header */}
      <header className="invite-header">
        <Link href="/circle" className="auth-back-btn" aria-label="Quay lại">
          <svg
            className="auth-back-icon"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M12.5 15L7.5 10L12.5 5"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <h1 className="invite-header-title">Mời thành viên mới</h1>
      </header>

      {/* ── Loading state ── */}
      {status.phase === 'loading' && (
        <div aria-live="polite" aria-busy="true" aria-label="Đang tải link mời">
          <div className="invite-card invite-card--skeleton">
            <div className="skeleton-line skeleton-line--short" />
            <div className="skeleton-line skeleton-line--long" />
            <div className="skeleton-line skeleton-line--medium" />
          </div>
          <div className="invite-btn-group">
            <div className="skeleton-btn" />
            <div className="skeleton-btn" />
          </div>
        </div>
      )}

      {/* ── Error state ── */}
      {status.phase === 'error' && (
        <div className="invite-state-error" role="alert" aria-live="assertive">
          <div className="invite-error-icon" aria-hidden="true">😕</div>
          <p className="invite-error-text">{status.message}</p>
          <button
            type="button"
            className="auth-btn"
            onClick={loadInvite}
            style={{ marginTop: 'var(--space-4)' }}
          >
            Thử lại
          </button>
        </div>
      )}

      {/* ── Ready state — main UI ── */}
      {status.phase === 'ready' && (
        <>
          {/* Link card */}
          <div className="invite-card">
            <div className="invite-card-header">
              <span className="invite-card-icon" aria-hidden="true">🔗</span>
              <span className="invite-card-label">Link mời</span>
            </div>

            <p className="invite-link-text" aria-label="Link mời của bạn">
              {truncateUrl(status.invite_url)}
            </p>

            <p className="invite-expiry">
              Hết hạn: {formatExpiryDate(status.expires_at)}
            </p>
          </div>

          {/* Share & Copy buttons */}
          <div className="invite-btn-group">
            <button
              type="button"
              className="auth-btn"
              onClick={handleShare}
              disabled={isPending}
            >
              Chia sẻ link
            </button>

            <button
              type="button"
              className="auth-btn auth-btn--secondary"
              onClick={handleCopy}
              disabled={isPending}
              aria-live="polite"
              aria-atomic="true"
            >
              {copyLabel === 'copied' ? 'Đã sao chép ✓' : 'Sao chép link'}
            </button>
          </div>

          {/* Info section */}
          <div className="invite-info-section">
            <hr className="invite-divider" aria-hidden="true" />
            <p className="invite-info-text">
              ℹ️ Link mời hết hạn sau 7 ngày. Chỉ chia sẻ với người bạn quen biết trong cộng đồng nhé.
            </p>

            {/* Revoke / create new link */}
            {!showConfirmRevoke ? (
              <button
                type="button"
                className="invite-revoke-btn"
                onClick={() => setShowConfirmRevoke(true)}
                disabled={isPending}
              >
                Tạo link mới
              </button>
            ) : (
              <div className="invite-confirm-revoke" role="alertdialog" aria-modal="false">
                <p className="invite-confirm-text">
                  Link cũ sẽ bị vô hiệu hóa. Tiếp tục?
                </p>
                <div className="invite-confirm-btns">
                  <button
                    type="button"
                    className="invite-revoke-btn"
                    onClick={handleRevoke}
                    disabled={isPending}
                    aria-busy={isPending}
                  >
                    {isPending ? 'Đang tạo…' : 'Xác nhận'}
                  </button>
                  <button
                    type="button"
                    className="invite-cancel-btn"
                    onClick={() => setShowConfirmRevoke(false)}
                    disabled={isPending}
                  >
                    Không lần này
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
