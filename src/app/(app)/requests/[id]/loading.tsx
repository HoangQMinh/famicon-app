/**
 * Loading skeleton for /requests/[id] — shown while Server Component fetches request detail.
 * Uses shimmer skeleton, no spinner (agent rules).
 *
 * Matches RequestDetailClient layout:
 *   Header → Category row → Description card → 3 InfoBlocks → Button
 */
export default function RequestDetailLoading() {
  const shimmerStyle: React.CSSProperties = {
    background: 'linear-gradient(90deg, var(--color-neutral-100) 25%, var(--color-neutral-200) 50%, var(--color-neutral-100) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    borderRadius: 'var(--radius-sm)',
  };

  return (
    <div className="request-detail" aria-busy="true" aria-label="Đang tải yêu cầu...">
      {/* Header skeleton */}
      <header className="request-detail__header">
        {/* Back button placeholder */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-neutral-100)',
            flexShrink: 0,
          }}
          aria-hidden="true"
        />
        {/* Title placeholder */}
        <div
          style={{
            ...shimmerStyle,
            flex: 1,
            height: 20,
            marginLeft: 'var(--space-2)',
            marginRight: 'var(--space-2)',
          }}
          aria-hidden="true"
        />
        <div style={{ width: 44, height: 44, flexShrink: 0 }} aria-hidden="true" />
      </header>

      <div className="request-detail__body">
        {/* Category row skeleton: IconTile lg + 2 text lines */}
        <div className="request-detail__category-row">
          {/* IconTile lg placeholder */}
          <div
            style={{
              ...shimmerStyle,
              width: 64,
              height: 64,
              borderRadius: 'var(--radius-md)',
              flexShrink: 0,
            }}
            aria-hidden="true"
          />
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', flex: 1 }}
            aria-hidden="true"
          >
            <div style={{ ...shimmerStyle, height: 22, width: '50%' }} />
            <div style={{ ...shimmerStyle, height: 18, width: '28%' }} />
          </div>
        </div>

        {/* Description card skeleton */}
        <div
          className="fc-card"
          style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}
          aria-hidden="true"
        >
          <div style={{ ...shimmerStyle, height: 14, width: '25%' }} />
          <div style={{ ...shimmerStyle, height: 16, width: '100%' }} />
          <div style={{ ...shimmerStyle, height: 16, width: '90%' }} />
          <div style={{ ...shimmerStyle, height: 16, width: '70%' }} />
        </div>

        {/* 3 InfoBlock skeletons */}
        <div className="request-detail__info-blocks" aria-hidden="true">
          {[
            { label: 40 },
            { label: 40 },
            { label: 40 },
          ].map((_, i) => (
            <div key={i} className="fc-info-block">
              {/* Icon placeholder */}
              <div
                style={{
                  ...shimmerStyle,
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-full)',
                  flexShrink: 0,
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                <div style={{ ...shimmerStyle, height: 12, width: '35%' }} />
                <div style={{ ...shimmerStyle, height: 16, width: '55%' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Button placeholder */}
        <div style={{ ...shimmerStyle, height: 52, borderRadius: 'var(--radius-md)', marginTop: 'var(--space-2)' }} aria-hidden="true" />
      </div>
    </div>
  );
}
