'use client';

import { useState, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createOffer } from '@/app/actions/offers';
import { InfoBlock } from '@/components/ui/info-block';
import type { RequestDetail } from '@/lib/types';

// ---------------------------------------------------------------------------
// Category helpers (mirrors request-card.tsx)
// ---------------------------------------------------------------------------

const CATEGORY_EMOJI: Record<string, string> = {
  pickup:    '🚸',
  ride:      '🚗',
  childcare: '👶',
  borrow:    '📦',
  other:     '💬',
};

const CATEGORY_LABEL: Record<string, string> = {
  pickup:    'Đón con',
  ride:      'Đi nhờ xe',
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
// Time formatting (mirrors request-card.tsx formatScheduledAt)
// ---------------------------------------------------------------------------

function formatScheduledAt(isoString: string | null): string {
  if (!isoString) return 'Chưa xác định';

  const date = new Date(isoString);
  // Guard against invalid date
  if (isNaN(date.getTime())) return isoString;

  const now = new Date();
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

  const diffDays = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays >= -6 && diffDays <= 6) {
    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return `${dayNames[date.getDay()]} lúc ${HHmm}`;
  }

  const day = date.getDate();
  const month = date.getMonth() + 1;
  return `${day}/${month} lúc ${HHmm}`;
}

// ---------------------------------------------------------------------------
// Inline SVG icons (20px, consistent with design spec)
// ---------------------------------------------------------------------------

function IconClock() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function IconMapPin() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function IconMsgCircle() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

function IconArrowLeft() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Toast state
// ---------------------------------------------------------------------------

type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

// ---------------------------------------------------------------------------
// Button state machine
// ---------------------------------------------------------------------------

/**
 * Determines the CTA button appearance based on request status.
 * Constitution P3: never reveal who helped / who declined.
 * Sprint 7 spec: expired state maps to cancelled/closed (D-032).
 */
function getButtonState(status: RequestDetail['status']): {
  text: string;
  disabled: boolean;
  statusNote: string | null;
} {
  switch (status) {
    case 'open':
      return { text: 'Tôi giúp được — Nhắn tin', disabled: false, statusNote: null };
    case 'matched':
      // Constitution P3: do NOT show who is helping
      return { text: 'Đã có người giúp', disabled: true, statusNote: 'Yêu cầu này đã được nhận.' };
    case 'cancelled':
      // D-032: expired requests land here
      return { text: 'Yêu cầu đã đóng', disabled: true, statusNote: 'Yêu cầu đã hết hạn.' };
    case 'closed':
      return { text: 'Yêu cầu đã đóng', disabled: true, statusNote: 'Yêu cầu này đã đóng.' };
    default:
      return { text: 'Yêu cầu đã đóng', disabled: true, statusNote: null };
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RequestDetailClientProps {
  request: RequestDetail;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * RequestDetailClient — interactive shell for /requests/[id].
 *
 * Constitution compliance:
 *   - P3: no disclosure of who declined or who is helping (matched state)
 *   - P2: no counter / ledger in "Người nhờ" info block
 *   - P6: no matching logic visible to user
 *   - P12 / D-012: "Tôi giúp được" opens LINE deeplink — no in-app chat
 *
 * "Không lần này" — local dismiss only, no DB call, no notification (P3).
 * Tap "Tôi giúp được" — calls createOffer(), then window.open LINE deeplink.
 */
export function RequestDetailClient({ request }: RequestDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dismissed, setDismissed] = useState(false);
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '', type: 'info' });

  const emoji = categoryEmoji(request.category);
  const label = categoryLabel(request.category);
  const when = formatScheduledAt(request.scheduled_at);
  const { text: btnText, disabled: btnDisabled, statusNote } = getButtonState(request.status);

  // ---------------------------------------------------------------------------
  // Toast helpers
  // ---------------------------------------------------------------------------

  const showToast = useCallback((message: string, type: ToastType, durationMs = 3500) => {
    setToast({ visible: true, message, type });
    const timer = setTimeout(() => setToast((t) => ({ ...t, visible: false })), durationMs);
    return () => clearTimeout(timer);
  }, []);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function handleBack() {
    router.back();
  }

  /**
   * "Không lần này" — local dismiss only.
   * Per Constitution P3: no DB write, no notification to asker.
   * User navigates back after dismiss — no need to persist state.
   */
  function handleDismiss() {
    setDismissed(true);
    // Navigate back — the request stays visible to others
    router.back();
  }

  /**
   * "Tôi giúp được — Nhắn tin":
   *   1. Call createOffer() Server Action
   *   2. On success: open LINE deeplink + show toast
   *   3. On error: show toast with error message
   */
  function handleOfferHelp() {
    startTransition(async () => {
      const result = await createOffer(request.id);

      if (result.success) {
        showToast('Đang chuyển sang LINE...', 'success');
        // Open LINE in new tab — hand-off per D-012
        window.open(result.data.line_handoff_url, '_blank', 'noopener,noreferrer');
      } else {
        showToast(result.error, 'error', 5000);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="request-detail">
      {/* Toast notification */}
      {toast.visible && (
        <div
          className={`nr-toast nr-toast--${toast.type === 'success' ? 'success' : toast.type === 'error' ? 'error' : 'success'}`}
          role="status"
          aria-live="polite"
          onClick={() => setToast((t) => ({ ...t, visible: false }))}
        >
          {toast.message}
        </div>
      )}

      {/* Header with back button */}
      <header className="request-detail__header" role="banner">
        <button
          type="button"
          className="request-detail__back-btn"
          onClick={handleBack}
          aria-label="Quay lại"
        >
          <IconArrowLeft />
        </button>
        <h1 className="request-detail__title">Chi tiết yêu cầu</h1>
        {/* Right placeholder to visually center the title */}
        <div className="request-detail__header-placeholder" aria-hidden="true" />
      </header>

      {/* Scrollable body */}
      <div className="request-detail__body">
        {/* Category row: IconTile lg + category label + UrgentPill */}
        <div className="request-detail__category-row">
          <div
            className="fc-icon-tile fc-icon-tile--lg"
            aria-hidden="true"
          >
            {emoji}
          </div>
          <div className="request-detail__category-text">
            <span className="request-detail__category-label">{label}</span>
            {request.is_urgent && (
              <div
                className="urgent-pill"
                role="status"
                aria-label="Yêu cầu gấp"
                style={{ marginTop: 4, marginBottom: 0 }}
              >
                Gấp
              </div>
            )}
          </div>
        </div>

        {/* Description card — full text, no truncation */}
        <div className="fc-card" style={{ padding: 'var(--space-4)' }}>
          <div className="fc-field__label" style={{ marginBottom: 6 }}>Chi tiết</div>
          <p className="request-detail__desc">{request.description}</p>
        </div>

        {/* Info blocks */}
        <div className="request-detail__info-blocks">
          <InfoBlock
            icon={<IconClock />}
            label="Thời gian"
            value={when}
          />
          <InfoBlock
            icon={<IconMapPin />}
            label="Địa điểm"
            value={request.location_text ?? 'Chưa xác định'}
          />
          {/* Constitution P2: only show name — no counter of past requests */}
          <InfoBlock
            icon={<IconUser />}
            label="Người nhờ"
            value={request.requester_name}
          />
        </div>

        {/* Status note (matched / closed) */}
        {statusNote && (
          <p className="request-detail__status-note" aria-live="polite">
            {statusNote}
          </p>
        )}

        {/* CTA section */}
        <div className="request-detail__actions">
          {/* Primary CTA — state-driven */}
          <button
            type="button"
            className={`fc-btn fc-btn--primary fc-btn--block${btnDisabled ? ' fc-btn--disabled' : ''}`}
            onClick={btnDisabled ? undefined : handleOfferHelp}
            disabled={btnDisabled || isPending}
            aria-disabled={btnDisabled || isPending}
            aria-busy={isPending}
          >
            {isPending ? (
              <>
                <span className="nr-spinner" aria-hidden="true" />
                Đang xử lý...
              </>
            ) : (
              <>
                {!btnDisabled && (
                  <span className="request-detail__btn-icon" aria-hidden="true">
                    <IconMsgCircle />
                  </span>
                )}
                {btnText}
              </>
            )}
          </button>

          {/* "Không lần này" — only shown when request is open */}
          {request.status === 'open' && !dismissed && (
            <button
              type="button"
              className="fc-btn fc-btn--secondary fc-btn--block"
              onClick={handleDismiss}
              aria-label="Không lần này"
              style={{ marginTop: 'var(--space-2)' }}
            >
              Không lần này
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
