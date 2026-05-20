'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Members error boundary — shown when the members Server Component throws.
 * No BottomNav on this screen — user exits via back button.
 */
export default function MembersError({ error, reset }: ErrorProps) {
  const router = useRouter();

  useEffect(() => {
    console.error('[MembersPage] error:', error);
  }, [error]);

  return (
    <div className="members-page">
      <header className="members-header">
        <button
          type="button"
          className="members-back-btn"
          onClick={() => router.back()}
          aria-label="Quay lại"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <div className="members-header__text">
          <h1 className="members-header__title">Thành viên</h1>
        </div>
      </header>

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
          Không tải được danh sách. Kiểm tra mạng và thử lại.
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
  );
}
