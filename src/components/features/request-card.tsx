'use client';

import Link from 'next/link';
import type { AidRequestWithProfile } from '@/lib/types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RequestCardProps {
  req: AidRequestWithProfile;
  onDecline: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Category helpers
// ---------------------------------------------------------------------------

const CATEGORY_EMOJI: Record<string, string> = {
  pickup:    '🚗',
  ride:      '📦',
  childcare: '👶',
  borrow:    '🤝',
  other:     '💬',
};

const CATEGORY_LABEL: Record<string, string> = {
  pickup:    'Đón xe',
  ride:      'Giao đồ',
  childcare: 'Trông bé',
  borrow:    'Mượn đồ',
  other:     'Khác',
};

function categoryEmoji(category: string): string {
  return CATEGORY_EMOJI[category] ?? '💬';
}

function categoryLabel(category: string): string {
  return CATEGORY_LABEL[category] ?? category;
}

// ---------------------------------------------------------------------------
// Description truncation — 80 chars max
// ---------------------------------------------------------------------------

function truncateDesc(text: string, maxLen = 80): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '…';
}

// ---------------------------------------------------------------------------
// Relative time formatting (from microcopy.md)
// ---------------------------------------------------------------------------

function formatScheduledAt(isoString: string | null): string {
  if (!isoString) return '';

  const date = new Date(isoString);
  const now = new Date();

  // Same calendar day
  const todayStr = now.toDateString();
  const dateStr = date.toDateString();

  const HHmm = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  if (dateStr === todayStr) {
    return `Hôm nay lúc ${HHmm}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (dateStr === yesterday.toDateString()) {
    return `Hôm qua lúc ${HHmm}`;
  }

  // Within same week — show day name
  const diffDays = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays >= -6 && diffDays <= 6) {
    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return `${dayNames[date.getDay()]} lúc ${HHmm}`;
  }

  // Older — show date/month
  const day = date.getDate();
  const month = date.getMonth() + 1;
  return `${day}/${month} lúc ${HHmm}`;
}

// ---------------------------------------------------------------------------
// SVG meta icons
// ---------------------------------------------------------------------------

function IconClock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function IconMapPin() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function IconUserSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// RequestCard component
// ---------------------------------------------------------------------------

/**
 * RequestCard — displays a single aid request in the Circle Home feed.
 *
 * Constitution compliance:
 *   - No counter, number of helps, or badge (Principle 2 — no ledger)
 *   - "Không lần này" calls onDecline only — NO DB write, NO notification (Principle 3)
 *   - No chat UI (Principle 9)
 *
 * "Tôi giúp được" navigates to /requests/[id] (detail screen — Sprint 6).
 * "Không lần này" calls onDecline(req.id) — local state only, card stays visible.
 */
export function RequestCard({ req, onDecline }: RequestCardProps) {
  const emoji = categoryEmoji(req.category);
  const label = categoryLabel(req.category);
  const desc = truncateDesc(req.description);
  const when = formatScheduledAt(req.scheduled_at);

  return (
    <article className="request-card" aria-label={`Yêu cầu: ${label}`}>
      {/* Urgent pill — only when is_urgent */}
      {req.is_urgent && (
        <div className="urgent-pill" role="status" aria-label="Yêu cầu gấp">
          Gấp
        </div>
      )}

      {/* Icon + title + desc row (tap area → navigate to detail) */}
      <Link
        href={`/requests/${req.id}`}
        className="request-card__content-link"
        aria-label={`Xem chi tiết: ${label} — ${desc}`}
      >
        <div className="request-card__content">
          {/* Category icon tile */}
          <div className="request-card__icon-tile" aria-hidden="true">
            {emoji}
          </div>

          {/* Title + description */}
          <div className="request-card__text">
            <span className="request-card__title">{label}</span>
            <span className="request-card__desc">{desc}</span>
          </div>
        </div>
      </Link>

      {/* Meta rows */}
      <div className="request-card__meta">
        {when && (
          <div className="request-card__meta-row">
            <span className="request-card__meta-icon" aria-hidden="true">
              <IconClock />
            </span>
            <span className="request-card__meta-text">{when}</span>
          </div>
        )}
        {req.location_text && (
          <div className="request-card__meta-row">
            <span className="request-card__meta-icon" aria-hidden="true">
              <IconMapPin />
            </span>
            <span className="request-card__meta-text">{req.location_text}</span>
          </div>
        )}
        <div className="request-card__meta-row">
          <span className="request-card__meta-icon" aria-hidden="true">
            <IconUserSmall />
          </span>
          <span className="request-card__meta-text">{req.requester_name}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="request-card__actions">
        <Link
          href={`/requests/${req.id}`}
          className="fc-btn fc-btn--primary"
          aria-label={`Tôi giúp được — ${label}`}
        >
          Tôi giúp được
        </Link>

        {/*
         * "Không lần này" — MUST be clearly visible, not hidden or smaller than primary.
         * Calls onDecline only — no DB write, no notification to requester (Constitution P3).
         */}
        <button
          type="button"
          className="fc-btn fc-btn--secondary"
          onClick={() => onDecline(req.id)}
          aria-label="Không lần này"
        >
          Không lần này
        </button>
      </div>
    </article>
  );
}
