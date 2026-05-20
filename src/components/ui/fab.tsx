import Link from 'next/link';

// ---------------------------------------------------------------------------
// FAB — Floating Action Button
// ---------------------------------------------------------------------------

/**
 * FAB — coral floating action button.
 * Position: fixed bottom-right, above BottomNav (CSS handles safe-area).
 * Tap → navigate to /new-request.
 *
 * Server Component: no interactivity, just a link.
 */
export function Fab() {
  return (
    <Link
      href="/new-request"
      className="fab"
      aria-label="Đăng nhờ giúp"
    >
      {/* Plus icon */}
      <svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
    </Link>
  );
}
