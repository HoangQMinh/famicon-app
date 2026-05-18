'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ---------------------------------------------------------------------------
// SVG icons — inline to keep bundle small, no icon library needed
// ---------------------------------------------------------------------------

function IconHome({ active }: { active: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      stroke={active ? 'var(--color-primary-500)' : 'var(--color-neutral-400)'}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

function IconPlusCircle({ active }: { active: boolean }) {
  const color = active ? 'var(--color-primary-500)' : 'var(--color-neutral-400)';
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

function IconUser({ active }: { active: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      stroke={active ? 'var(--color-primary-500)' : 'var(--color-neutral-400)'}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// BottomNav
// ---------------------------------------------------------------------------

/**
 * BottomNav — 3 visible tabs + 1 hidden Discovery slot (D-022).
 *
 * Discovery slot is rendered in DOM with aria-hidden="true" and display:none
 * so it reserves no space and is invisible to sighted users and screen readers.
 * It will be made visible in Sprint 11.
 */
export function BottomNav() {
  const pathname = usePathname();

  const isHome = pathname === '/home' || pathname.startsWith('/home/');
  const isNew = pathname === '/requests/new' || pathname.startsWith('/requests/new');
  const isProfile = pathname === '/profile' || pathname.startsWith('/profile');

  return (
    <nav className="bottom-nav" aria-label="Điều hướng chính">
      {/* Tab: Vòng của tôi */}
      <Link
        href="/home"
        className={`bottom-nav__tab${isHome ? ' bottom-nav__tab--active' : ''}`}
        aria-current={isHome ? 'page' : undefined}
      >
        <IconHome active={isHome} />
        <span className="bottom-nav__label">Vòng của tôi</span>
      </Link>

      {/* Tab: Nhờ giúp */}
      <Link
        href="/requests/new"
        className={`bottom-nav__tab${isNew ? ' bottom-nav__tab--active' : ''}`}
        aria-current={isNew ? 'page' : undefined}
      >
        <IconPlusCircle active={isNew} />
        <span className="bottom-nav__label">Nhờ giúp</span>
      </Link>

      {/* Tab: Hồ sơ */}
      <Link
        href="/profile"
        className={`bottom-nav__tab${isProfile ? ' bottom-nav__tab--active' : ''}`}
        aria-current={isProfile ? 'page' : undefined}
      >
        <IconUser active={isProfile} />
        <span className="bottom-nav__label">Hồ sơ</span>
      </Link>

      {/*
       * Discovery slot — D-022: render in DOM but NOT visible.
       * Sprint 11 will remove aria-hidden and display:none.
       * No tooltip "Sắp có" — not visible at all.
       */}
      <div
        className="bottom-nav__tab"
        aria-hidden="true"
        style={{ display: 'none' }}
      >
        <span>Discovery</span>
      </div>
    </nav>
  );
}
