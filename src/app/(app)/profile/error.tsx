'use client';

import { useEffect } from 'react';
import { BottomNav } from '@/components/layout/bottom-nav';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Profile error boundary — shown when the profile Server Component throws.
 * Renders error message + retry button.
 * BottomNav stays visible so user can navigate away.
 */
export default function ProfileError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error for debugging (not shown to user)
    console.error('[ProfilePage] error:', error);
  }, [error]);

  return (
    <div className="app-shell">
      <main className="app-main">
        <div className="profile-page">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              padding: 'var(--space-12) var(--space-6)',
              gap: 'var(--space-4)',
            }}
          >
            <span style={{ fontSize: 48, lineHeight: 1 }}>😕</span>
            <p
              style={{
                fontSize: 'var(--font-size-base)',
                color: 'var(--fg-secondary)',
                lineHeight: 'var(--line-height-normal)',
                margin: 0,
                maxWidth: 280,
              }}
            >
              Không tải được hồ sơ. Kiểm tra mạng và thử lại.
            </p>
            <button
              type="button"
              className="fc-btn fc-btn--secondary"
              onClick={reset}
            >
              Thử lại
            </button>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
