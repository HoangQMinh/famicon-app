/**
 * Profile loading skeleton — shown by Next.js while the Server Component
 * fetches profile data. Uses shimmer animation (no plain white spinner).
 */
export default function ProfileLoading() {
  return (
    <div className="profile-page">
      {/* Header skeleton */}
      <div className="profile-header--skeleton">
        <div className="skeleton-row skeleton-row--medium" style={{ height: 24, width: 80 }} />
      </div>

      <div className="profile-body">
        {/* Main info card skeleton */}
        <div className="fc-card" style={{ padding: 18 }}>
          {/* Avatar + name row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div
              className="skeleton-avatar"
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'linear-gradient(90deg, var(--color-neutral-100) 25%, var(--color-neutral-200) 50%, var(--color-neutral-100) 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="skeleton-row" style={{ height: 18, width: '60%' }} />
              <div className="skeleton-row skeleton-row--short" style={{ height: 14 }} />
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--border-hairline)', margin: '14px 0' }} />

          {/* Kids section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            <div className="skeleton-row skeleton-row--short" style={{ height: 14 }} />
            <div className="skeleton-row skeleton-row--medium" style={{ height: 16 }} />
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--border-hairline)', margin: '14px 0' }} />

          {/* Help tags section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            <div className="skeleton-row skeleton-row--short" style={{ height: 14 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="skeleton-row" style={{ height: 28, width: 80, borderRadius: 'var(--radius-full)' }} />
              <div className="skeleton-row" style={{ height: 28, width: 72, borderRadius: 'var(--radius-full)' }} />
            </div>
          </div>

          {/* Edit button */}
          <div className="skeleton-btn" style={{ height: 44, borderRadius: 'var(--radius-md)' }} />
        </div>

        {/* Members row skeleton */}
        <div className="fc-card" style={{ padding: 16 }}>
          <div className="skeleton-row skeleton-row--medium" style={{ height: 20 }} />
        </div>

        {/* Settings row skeleton */}
        <div className="fc-card" style={{ padding: 16 }}>
          <div className="skeleton-row skeleton-row--short" style={{ height: 20 }} />
        </div>
      </div>
    </div>
  );
}
