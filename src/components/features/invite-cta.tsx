'use client';

// ---------------------------------------------------------------------------
// InviteCTA — dashed border button to invite new circle members
// ---------------------------------------------------------------------------

function IconUserPlus() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
}

interface InviteCtaProps {
  onClick: () => void;
}

/**
 * InviteCTA — dashed border button shown at the top of the Members list.
 *
 * Tapping navigates to the invite flow via the onClick prop.
 * Style: fc-invite class (dashed border, transparent background).
 */
export function InviteCta({ onClick }: InviteCtaProps) {
  return (
    <button
      type="button"
      className="fc-invite"
      onClick={onClick}
      aria-label="Mời thành viên mới vào vòng"
    >
      <IconUserPlus />
      <span>Mời thành viên mới</span>
    </button>
  );
}
