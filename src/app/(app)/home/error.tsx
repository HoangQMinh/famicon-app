'use client';

/**
 * Error boundary for Circle Home.
 * Shown when the Server Component throws (e.g. unexpected Supabase error).
 * Provides a friendly message + retry action.
 */
export default function HomeError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="circle-home">
      <div className="empty-state" role="alert" aria-live="assertive">
        <span className="empty-state__icon" aria-hidden="true">😕</span>
        <h2 className="empty-state__heading">Không tải được</h2>
        <p className="empty-state__body">
          Không kết nối được. Kiểm tra mạng và thử lại nhé.
        </p>
        <button
          type="button"
          className="fc-btn fc-btn--primary"
          onClick={reset}
          style={{ marginTop: 'var(--space-4)' }}
        >
          Thử lại
        </button>
      </div>
    </div>
  );
}
