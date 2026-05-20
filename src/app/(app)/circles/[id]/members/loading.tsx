/**
 * Members loading skeleton — shimmer animation for 3-4 MemberRow placeholders.
 * InviteCTA renders immediately (no fetch needed).
 */
export default function MembersLoading() {
  return (
    <div className="members-page">
      {/* Header skeleton */}
      <div className="members-header">
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-neutral-100)',
            flexShrink: 0,
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          <div className="skeleton-row" style={{ height: 20, width: 100 }} />
          <div className="skeleton-row skeleton-row--short" style={{ height: 14, width: 60 }} />
        </div>
      </div>

      <div className="members-body">
        {/* InviteCTA placeholder */}
        <div
          style={{
            height: 52,
            borderRadius: 'var(--radius-md)',
            border: '1.5px dashed var(--border-soft)',
            background: 'var(--color-neutral-50)',
          }}
        />

        {/* Member row skeletons */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="fc-card"
            style={{
              padding: 14,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            {/* Avatar placeholder */}
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'linear-gradient(90deg, var(--color-neutral-100) 25%, var(--color-neutral-200) 50%, var(--color-neutral-100) 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
                flexShrink: 0,
              }}
            />
            {/* Content placeholder */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="skeleton-row" style={{ height: 16, width: '55%' }} />
              <div className="skeleton-row skeleton-row--short" style={{ height: 13 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="skeleton-row" style={{ height: 26, width: 72, borderRadius: 'var(--radius-full)' }} />
                <div className="skeleton-row" style={{ height: 26, width: 64, borderRadius: 'var(--radius-full)' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
