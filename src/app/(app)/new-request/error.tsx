'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary for /new-request.
 * Shown when the Server Component throws (e.g. DB connection failure).
 * Form data is not preserved here — this is a fatal render error.
 */
export default function NewRequestError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to monitoring in production
    console.error('[new-request] render error:', error);
  }, [error]);

  return (
    <div className="new-request-page">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-12) var(--space-6)',
          textAlign: 'center',
          gap: 'var(--space-4)',
          flex: 1,
        }}
        role="alert"
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
          Có chuyện bên trong rồi
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
          Không mở được form nhờ giúp. Thử lại sau vài giây nhé.
        </p>
        <button
          type="button"
          className="fc-btn fc-btn--primary"
          onClick={reset}
          style={{ marginTop: 'var(--space-2)' }}
        >
          Thử lại
        </button>
      </div>
    </div>
  );
}
