'use client';

import { useRouter } from 'next/navigation';
import { MemberRow } from './member-row';
import { InviteCta } from './invite-cta';
import type { MemberProfile } from '@/lib/types';

// ---------------------------------------------------------------------------
// Inline SVG — back arrow
// ---------------------------------------------------------------------------

function IconArrowLeft() {
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
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// MembersClient props
// ---------------------------------------------------------------------------

interface MembersClientProps {
  members: MemberProfile[];
  circleId: string;
  currentUserId: string;
}

/**
 * MembersClient — circle members list screen.
 *
 * Layout:
 *   - Custom header with back button + title + member count subtitle
 *   - InviteCTA dashed button at top of list
 *   - MemberRow for each member (joined_at ASC order from server)
 *   - Empty state if only current user (or no other members)
 *
 * No BottomNav — this screen is entered from Profile, exit = back button.
 *
 * Constitution:
 * - No admin/founder special row (Principle 7)
 * - No contribution counts in MemberRow (Principle 2)
 */
export function MembersClient({ members, circleId: _circleId, currentUserId }: MembersClientProps) {
  const router = useRouter();

  // Filter out current user from "other members" for empty state check
  const otherMembers = members.filter((m) => m.id !== currentUserId);
  const hasOtherMembers = otherMembers.length > 0;

  const memberCount = members.length;

  return (
    <div className="members-page">
      {/* Custom header — no BottomNav on this screen */}
      <header className="members-header">
        <button
          type="button"
          className="members-back-btn"
          onClick={() => router.back()}
          aria-label="Quay lại"
        >
          <IconArrowLeft />
        </button>
        <div className="members-header__text">
          <h1 className="members-header__title">Thành viên</h1>
          <p className="members-header__sub">{memberCount} gia đình</p>
        </div>
      </header>

      {/* Content body */}
      <div className="members-body">
        {/* InviteCTA always shown at top */}
        <InviteCta onClick={() => router.push('/invite')} />

        {/* Members list or empty state */}
        {hasOtherMembers ? (
          <div className="members-list">
            {members.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                isCurrentUser={member.id === currentUserId}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-state__icon">👥</span>
            <h2 className="empty-state__heading">Chưa có ai khác</h2>
            <p className="empty-state__body">
              Vòng của bạn chưa có thành viên nào khác. Mời bạn bè và gia đình Việt xung quanh nhé!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
