import Link from 'next/link';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TopHeaderProps {
  title: string;
  sub?: string;
  rightHref?: string;
}

// ---------------------------------------------------------------------------
// Bell SVG icon
// ---------------------------------------------------------------------------

function IconBell() {
  return (
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
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// TopHeader — Server Component (no interactivity needed)
// ---------------------------------------------------------------------------

/**
 * TopHeader — sticky app header.
 *
 * Props:
 *   title     — main heading (e.g. circle name)
 *   sub       — subtitle below title (e.g. "12 gia đình")
 *   rightHref — href for the bell icon; defaults to /notifications
 */
export function TopHeader({ title, sub, rightHref = '/notifications' }: TopHeaderProps) {
  return (
    <header className="top-header">
      <div className="top-header__text">
        <h1 className="top-header__title">{title}</h1>
        {sub && <p className="top-header__sub">{sub}</p>}
      </div>

      <Link
        href={rightHref}
        className="top-header__right"
        aria-label="Thông báo"
      >
        <IconBell />
      </Link>
    </header>
  );
}
