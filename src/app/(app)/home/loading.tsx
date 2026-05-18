/**
 * Loading skeleton for Circle Home.
 * Shown while the Server Component fetches session + circle data.
 * Uses shimmer skeleton cards — no white spinner (per design rules).
 */
export default function HomeLoading() {
  return (
    <div className="circle-home">
      {/* Header placeholder */}
      <div className="top-header">
        <div className="top-header__text">
          <div className="skeleton-row skeleton-row--medium" style={{ height: '18px', borderRadius: '4px' }} />
          <div className="skeleton-row skeleton-row--short" style={{ height: '12px', marginTop: '4px' }} />
        </div>
        <div style={{ width: '44px', height: '44px' }} />
      </div>

      {/* Feed skeleton */}
      <div className="circle-home-skeleton">
        {/* Section heading placeholder */}
        <div className="skeleton-row skeleton-row--short" />

        {/* Card 1 */}
        <div className="skeleton-card">
          <div className="skeleton-row skeleton-row--medium" />
          <div className="skeleton-row skeleton-row--long" />
          <div className="skeleton-row skeleton-row--short" />
        </div>

        {/* Card 2 */}
        <div className="skeleton-card">
          <div className="skeleton-row skeleton-row--medium" />
          <div className="skeleton-row skeleton-row--long" />
          <div className="skeleton-row skeleton-row--short" />
        </div>

        {/* Card 3 */}
        <div className="skeleton-card">
          <div className="skeleton-row skeleton-row--medium" />
          <div className="skeleton-row skeleton-row--long" />
        </div>
      </div>
    </div>
  );
}
