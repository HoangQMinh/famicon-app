'use client';

import Image from 'next/image';
import type { MemberProfile } from '@/lib/types';

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function IconMapPin() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconMsgCircle() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Help tag labels
// ---------------------------------------------------------------------------

const HELP_TAG_LABELS: Record<string, string> = {
  pickup: 'Đón con',
  childcare: 'Trông con',
  ride: 'Chở đi',
  meal: 'Nấu ăn',
  other: 'Khác',
};

function getHelpTagLabel(tag: string): string {
  return HELP_TAG_LABELS[tag] ?? tag;
}

// ---------------------------------------------------------------------------
// MemberRow props
// ---------------------------------------------------------------------------

interface MemberRowProps {
  member: MemberProfile;
  isCurrentUser?: boolean;
}

/**
 * MemberRow — displays a circle member's profile info.
 *
 * Layout: Avatar (emoji or img) | name + location + kids_desc + help_tags | chat icon
 *
 * Chat icon: disabled in Sprint 8 (OQ-007 is OPEN — LINE handoff not yet built).
 * It renders with aria-disabled="true" and title tooltip.
 *
 * Constitution:
 * - No contribution count shown (Principle 2)
 * - No admin/founder badge (Principle 7)
 * - No in-app chat (Forbidden UX — LINE hand-off when OQ-007 resolved)
 */
export function MemberRow({ member, isCurrentUser = false }: MemberRowProps) {
  const helpTags = member.help_tags ?? [];
  const avatarEmoji = member.avatar_emoji ?? '👤';

  return (
    <div
      className="fc-card"
      style={{
        padding: 14,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}
    >
      {/* Avatar */}
      <div className="fc-avatar" style={{ flexShrink: 0, position: 'relative' }}>
        {member.avatar_url ? (
          <Image
            src={member.avatar_url}
            alt={`Ảnh của ${member.display_name}`}
            fill
            sizes="44px"
            style={{ objectFit: 'cover', borderRadius: '50%' }}
          />
        ) : (
          <span style={{ fontSize: 24, lineHeight: 1 }}>{avatarEmoji}</span>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Name */}
        <div
          style={{
            fontWeight: 700,
            fontSize: 15,
            color: 'var(--fg-primary)',
            lineHeight: 'var(--line-height-tight)',
          }}
        >
          {member.display_name}
          {isCurrentUser && (
            <span
              style={{
                marginLeft: 6,
                fontSize: 12,
                color: 'var(--fg-tertiary)',
                fontWeight: 400,
              }}
            >
              (bạn)
            </span>
          )}
        </div>

        {/* Location */}
        {member.location && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 13,
              color: 'var(--fg-secondary)',
              marginTop: 2,
            }}
          >
            <IconMapPin />
            {member.location}
          </div>
        )}

        {/* Kids description */}
        {member.kids_desc && (
          <div
            style={{
              fontSize: 13,
              color: 'var(--fg-secondary)',
              marginTop: 6,
              lineHeight: 'var(--line-height-normal)',
            }}
          >
            {member.kids_desc}
          </div>
        )}

        {/* Help tags chips */}
        {helpTags.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              marginTop: 8,
            }}
          >
            {helpTags.map((tag) => (
              <span key={tag} className="fc-pill">
                {getHelpTagLabel(tag)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Chat icon — disabled, OQ-007 OPEN (LINE handoff not yet built) */}
      <button
        type="button"
        disabled
        aria-label={`Kết nối qua LINE với ${member.display_name} (sắp ra mắt)`}
        title="Kết nối qua LINE sắp ra mắt"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 44,
          height: 44,
          border: 'none',
          background: 'none',
          cursor: 'not-allowed',
          color: 'var(--fg-tertiary)',
          opacity: 0.5,
          flexShrink: 0,
          padding: 12,
          margin: -12,
        }}
      >
        <IconMsgCircle />
      </button>
    </div>
  );
}
