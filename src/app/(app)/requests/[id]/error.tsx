'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Error boundary for /requests/[id]
// ---------------------------------------------------------------------------

/**
 * Error boundary for Request Detail page.
 *
 * Shown when:
 *   - getRequestDetail() throws (network error, DB error)
 *   - User not a circle member (RLS rejection)
 *   - Any unexpected server error
 *
 * Per screen spec State 6 — Error:
 *   - Text: "Không tải được yêu cầu này. Kiểm tra mạng và thử lại."
 *   - Button "Thử lại" — calls reset() to retry Server Component
 *   - Back button — navigates away without retry
 */
export default function RequestDetailError({ error, reset }: ErrorProps) {
  const router = useRouter();

  useEffect(() => {
    // Log to error monitoring in production
    console.error('[request-detail] render error:', error);
  }, [error]);

  function handleBack() {
    router.back();
  }

  return (
    <div className="request-detail">
      {/* Header with back button — always functional even in error state */}
      <header className="request-detail__header" role="banner">
        <button
          type="button"
          className="request-detail__back-btn"
          onClick={handleBack}
          aria-label="Quay lại"
        >
          {/* Inline ArrowLeft icon */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <h1 className="request-detail__title">Chi tiết yêu cầu</h1>
        <div className="request-detail__header-placeholder" aria-hidden="true" />
      </header>

      {/* Error body */}
      <div
        className="request-detail__body"
        role="alert"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: 'var(--space-12) var(--space-6)',
          gap: 'var(--space-4)',
          flex: 1,
        }}
      >
        <span style={{ fontSize: 48, lineHeight: 1 }} aria-hidden="true">
          😔
        </span>
        <h2
          style={{
            fontSize: 'var(--font-size-md)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--fg-primary)',
            margin: 0,
          }}
        >
          Không tải được yêu cầu
        </h2>
        <p
          style={{
            fontSize: 'var(--font-size-base)',
            color: 'var(--fg-secondary)',
            lineHeight: 'var(--line-height-normal)',
            margin: 0,
            maxWidth: 280,
          }}
        >
          Không tải được yêu cầu này. Kiểm tra mạng và thử lại.
        </p>
        <button
          type="button"
          className="fc-btn fc-btn--secondary"
          onClick={reset}
          style={{ marginTop: 'var(--space-2)' }}
        >
          Thử lại
        </button>
      </div>
    </div>
  );
}
