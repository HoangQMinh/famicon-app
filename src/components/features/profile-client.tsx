'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { EditProfileModal } from './edit-profile-modal';
import type { ProfileData } from '@/lib/types';

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function IconMapPin() {
  return (
    <svg
      width="14"
      height="14"
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

function IconBaby() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="7" r="4" />
      <path d="M12 14c-5 0-8 2.5-8 4v1h16v-1c0-1.5-3-4-8-4z" />
    </svg>
  );
}

function IconHeart() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

function IconUser() {
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
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function IconSettings() {
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
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

function IconChevronRight() {
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
      <polyline points="9 18 15 12 9 6" />
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
// ProfileClient props
// ---------------------------------------------------------------------------

interface ProfileClientProps {
  profile: ProfileData;
  circleId: string;
  currentUserId: string;
}

/**
 * ProfileClient — main profile screen client component.
 *
 * Handles:
 * - Displaying avatar (image or emoji fallback), name, location, kids_desc, help_tags
 * - Incomplete state (missing kids_desc or help_tags) → prompt + primary CTA
 * - "Chỉnh sửa hồ sơ" button → opens EditProfileModal
 * - "Thành viên vòng tròn" row → navigates to /circles/[id]/members
 * - "Cài đặt" row → disabled (Settings deferred to Sprint 9+)
 * - BottomNav with active="profile"
 *
 * Constitution:
 * - No contribution counts (Principle 2)
 * - No admin/founder badges (Principle 7)
 */
export function ProfileClient({ profile, circleId, currentUserId: _currentUserId }: ProfileClientProps) {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const isIncomplete =
    !profile.kids_desc?.trim() || !profile.help_tags || profile.help_tags.length === 0;

  const helpTags = profile.help_tags ?? [];

  return (
    <>
      <div className="profile-page">
        {/* Header */}
        <header className="top-header">
          <div className="top-header__text">
            <h1 className="top-header__title">Hồ sơ</h1>
          </div>
          {/* Settings icon — navigate when settings screen is built */}
          <button
            type="button"
            className="top-header__right"
            onClick={() => console.log('settings TBD')}
            aria-label="Cài đặt"
            style={{ border: 'none', background: 'none', cursor: 'pointer' }}
          >
            <IconSettings />
          </button>
        </header>

        <div className="profile-body">
          {/* ── Main info card ── */}
          <div className="fc-card" style={{ padding: 18 }}>
            {/* Avatar + name + location */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="fc-avatar fc-avatar--lg" style={{ flexShrink: 0, position: 'relative' }}>
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={`Ảnh của ${profile.display_name}`}
                    fill
                    sizes="64px"
                    style={{ objectFit: 'cover', borderRadius: '50%' }}
                  />
                ) : (
                  <span style={{ fontSize: 32, lineHeight: 1 }}>
                    {profile.avatar_emoji ?? '👤'}
                  </span>
                )}
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 'var(--font-weight-bold)' as React.CSSProperties['fontWeight'],
                    fontSize: 17,
                    color: 'var(--fg-primary)',
                    lineHeight: 'var(--line-height-tight)',
                  }}
                >
                  {profile.display_name}
                </div>
                {profile.location && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 13,
                      color: 'var(--fg-secondary)',
                      marginTop: 4,
                    }}
                  >
                    <IconMapPin />
                    {profile.location}
                  </div>
                )}
              </div>
            </div>

            {/* Incomplete profile prompt */}
            {isIncomplete && (
              <div
                style={{
                  marginTop: 14,
                  padding: '10px 12px',
                  backgroundColor: 'var(--color-primary-50)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--fg-secondary)',
                  lineHeight: 'var(--line-height-normal)',
                }}
              >
                Hồ sơ của bạn chưa đầy đủ. Thêm thông tin để các thành viên khác biết bạn có thể giúp gì.
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--border-hairline)', margin: '14px 0' }} />

            {/* Con cái section */}
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 13,
                  color: 'var(--fg-secondary)',
                  marginBottom: 6,
                }}
              >
                <IconBaby />
                Con cái
              </div>
              <div style={{ fontSize: 14, color: 'var(--fg-primary)', lineHeight: 'var(--line-height-normal)' }}>
                {profile.kids_desc?.trim() ? (
                  profile.kids_desc
                ) : (
                  <span style={{ color: 'var(--fg-tertiary)', fontStyle: 'italic' }}>
                    Chưa thêm thông tin con cái
                  </span>
                )}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-hairline)', margin: '14px 0' }} />

            {/* Có thể giúp section */}
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 13,
                  color: 'var(--fg-secondary)',
                  marginBottom: 8,
                }}
              >
                <IconHeart />
                Có thể giúp
              </div>
              {helpTags.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {helpTags.map((tag) => (
                    <span key={tag} className="fc-pill">
                      {getHelpTagLabel(tag)}
                    </span>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 14, color: 'var(--fg-tertiary)', fontStyle: 'italic' }}>
                  Chưa thêm khả năng có thể giúp
                </div>
              )}
            </div>

            <div style={{ marginTop: 14 }}>
              <button
                type="button"
                className={`fc-btn fc-btn--block ${isIncomplete ? 'fc-btn--primary' : 'fc-btn--secondary'}`}
                onClick={() => setIsEditOpen(true)}
              >
                Chỉnh sửa hồ sơ
              </button>
            </div>
          </div>

          {/* ── Thành viên row ── */}
          <button
            type="button"
            className="fc-card"
            style={{
              padding: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              border: '1px solid var(--border-hairline)',
              width: '100%',
              textAlign: 'left',
              cursor: 'pointer',
              background: 'none',
              backgroundColor: 'var(--bg-card)',
            }}
            onClick={() => router.push(`/circles/${circleId}/members`)}
          >
            <span style={{ color: 'var(--fg-primary)', display: 'flex' }}>
              <IconUser />
            </span>
            <div style={{ flex: 1, fontWeight: 600, color: 'var(--fg-primary)' }}>
              Thành viên vòng tròn
            </div>
            <span style={{ color: 'var(--fg-tertiary)', display: 'flex' }}>
              <IconChevronRight />
            </span>
          </button>

          {/* ── Cài đặt row (disabled) ── */}
          <button
            type="button"
            className="fc-card"
            style={{
              padding: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              border: '1px solid var(--border-hairline)',
              width: '100%',
              textAlign: 'left',
              cursor: 'not-allowed',
              background: 'none',
              backgroundColor: 'var(--bg-card)',
              opacity: 0.5,
            }}
            onClick={() => console.log('settings TBD')}
            aria-disabled="true"
          >
            <span style={{ color: 'var(--fg-primary)', display: 'flex' }}>
              <IconSettings />
            </span>
            <div style={{ flex: 1, fontWeight: 600, color: 'var(--fg-primary)' }}>
              Cài đặt
            </div>
            <span style={{ color: 'var(--fg-tertiary)', display: 'flex' }}>
              <IconChevronRight />
            </span>
          </button>
        </div>
      </div>

      {/* Edit profile modal */}
      <EditProfileModal
        profile={profile}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />
    </>
  );
}
