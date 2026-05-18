/**
 * Loading skeleton for /new-request — shown while Server Component fetches circle_id.
 * Uses shimmer skeleton (no spinner per agent rules).
 */
export default function NewRequestLoading() {
  return (
    <div className="new-request-page">
      {/* Header skeleton */}
      <header className="new-request-header">
        <div
          className="new-request-back-btn"
          style={{ background: 'var(--color-neutral-100)', borderRadius: 'var(--radius-full)' }}
          aria-hidden="true"
        />
        <div
          style={{
            flex: 1,
            height: 20,
            borderRadius: 'var(--radius-sm)',
            background: 'linear-gradient(90deg, var(--color-neutral-100) 25%, var(--color-neutral-200) 50%, var(--color-neutral-100) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
          }}
          aria-hidden="true"
        />
        <div style={{ width: 44, height: 44 }} aria-hidden="true" />
      </header>

      {/* Body skeleton */}
      <div className="new-request-body" aria-busy="true" aria-label="Đang tải…">
        {/* Category tiles skeleton */}
        <div className="nr-field">
          <div className="skeleton-row skeleton-row--medium" style={{ marginBottom: 'var(--space-2)' }} />
          <div className="nr-cat-grid">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                style={{
                  minHeight: 72,
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(90deg, var(--color-neutral-100) 25%, var(--color-neutral-200) 50%, var(--color-neutral-100) 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s infinite',
                }}
              />
            ))}
          </div>
        </div>

        {/* Textarea skeleton */}
        <div className="nr-field">
          <div className="skeleton-row skeleton-row--short" />
          <div
            style={{
              height: 96,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(90deg, var(--color-neutral-100) 25%, var(--color-neutral-200) 50%, var(--color-neutral-100) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
            }}
          />
        </div>

        {/* Input skeletons */}
        {[...Array(2)].map((_, i) => (
          <div className="nr-field" key={i}>
            <div className="skeleton-row skeleton-row--short" />
            <div
              style={{
                height: 52,
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(90deg, var(--color-neutral-100) 25%, var(--color-neutral-200) 50%, var(--color-neutral-100) 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
              }}
            />
          </div>
        ))}

        {/* Urgent + submit skeletons */}
        <div className="nr-field">
          <div className="skeleton-row skeleton-row--short" />
          <div style={{ display: 'flex', gap: 10 }}>
            <div
              style={{
                flex: 1,
                height: 44,
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(90deg, var(--color-neutral-100) 25%, var(--color-neutral-200) 50%, var(--color-neutral-100) 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
              }}
            />
            <div
              style={{
                flex: 1,
                height: 44,
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(90deg, var(--color-neutral-100) 25%, var(--color-neutral-200) 50%, var(--color-neutral-100) 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
              }}
            />
          </div>
        </div>

        <div
          style={{
            height: 52,
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(90deg, var(--color-neutral-100) 25%, var(--color-neutral-200) 50%, var(--color-neutral-100) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
          }}
        />
      </div>
    </div>
  );
}
