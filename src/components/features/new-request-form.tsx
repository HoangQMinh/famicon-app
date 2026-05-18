'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createRequest } from '@/app/actions/requests';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Category = 'pickup' | 'borrow' | 'childcare' | 'ride' | 'other';

interface CategoryOption {
  id: Category;
  emoji: string;
  label: string;
}

// ---------------------------------------------------------------------------
// Constants — per screen-spec and microcopy.md
// ---------------------------------------------------------------------------

const CATEGORIES: CategoryOption[] = [
  { id: 'pickup', emoji: '🚸', label: 'Đón con' },
  { id: 'borrow', emoji: '📦', label: 'Mượn đồ' },
  { id: 'childcare', emoji: '👶', label: 'Trông con' },
  { id: 'ride', emoji: '🚗', label: 'Chở đi' },
  { id: 'other', emoji: '💬', label: 'Khác' },
];

const MAX_DESC = 200;

// ---------------------------------------------------------------------------
// Icon components (inline SVG — no external library)
// ---------------------------------------------------------------------------

function IconCalendar() {
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
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconMapPin() {
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
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconArrowLeft() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Toast — simple local state toast (no external library)
// ---------------------------------------------------------------------------

interface ToastState {
  message: string;
  variant: 'success' | 'error';
  visible: boolean;
}

// ---------------------------------------------------------------------------
// CategoryTile — accessible tile button
// ---------------------------------------------------------------------------

interface CategoryTileProps {
  option: CategoryOption;
  selected: boolean;
  onClick: (id: Category) => void;
  disabled?: boolean;
}

function CategoryTile({ option, selected, onClick, disabled }: CategoryTileProps) {
  return (
    <button
      type="button"
      className={`fc-cat-tile${selected ? ' fc-cat-tile--selected' : ''}`}
      onClick={() => onClick(option.id)}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={option.label}
    >
      <span className="fc-cat-tile__emoji" aria-hidden="true">
        {option.emoji}
      </span>
      <span className="fc-cat-tile__label">{option.label}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface NewRequestFormProps {
  circleId: string;
}

// ---------------------------------------------------------------------------
// NewRequestForm — main Client Component
// ---------------------------------------------------------------------------

/**
 * NewRequestForm — client component for /new-request.
 *
 * States:
 *   Empty:   form opens with pickup pre-selected, all text fields empty, submit disabled
 *   Filled:  all required fields filled, submit enabled
 *   Loading: submit in progress — button shows "Đang gửi…", all inputs still editable
 *   Error:   network/server error toast shown, form data preserved, button re-enabled
 *
 * canSubmit: category && description.trim().length >= 5 && scheduled_at.length > 0 && location.length > 0
 * Per constitution: NO confirmation dialog before submit (Principle 3).
 * Per constitution: NO counter/ledger patterns anywhere.
 */
export function NewRequestForm({ circleId }: NewRequestFormProps) {
  const router = useRouter();

  // Form state — pickup pre-selected per AC-4.3
  const [category, setCategory] = useState<Category>('pickup');
  const [detail, setDetail] = useState('');
  const [when, setWhen] = useState('');
  const [place, setPlace] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Toast state
  const [toast, setToast] = useState<ToastState>({
    message: '',
    variant: 'success',
    visible: false,
  });

  // canSubmit — per spec and AC-4.4 / AC-4.5
  // description must be at least 5 chars after trim (matches newRequestSchema)
  const canSubmit =
    !!category &&
    detail.trim().length >= 5 &&
    when.trim().length > 0 &&
    place.trim().length > 0;

  // Show toast — auto-dismiss after duration
  const showToast = useCallback((message: string, variant: 'success' | 'error') => {
    setToast({ message, variant, visible: true });
    const duration = variant === 'error' ? 5000 : 3000;
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, duration);
  }, []);

  // Handle submit — AC-4.8, AC-4.10, AC-4.11
  async function handleSubmit() {
    if (!canSubmit || submitting) return;

    setSubmitting(true);

    const result = await createRequest({
      circle_id: circleId,
      category,
      description: detail.trim(),
      scheduled_at: when.trim(),
      location: place.trim(),
      is_urgent: urgent,
    });

    if (result.success) {
      // Success: navigate to /home with toast message stored in sessionStorage
      // (toast will be shown by CircleHomeClient after navigation)
      // Since we navigate away, show toast here briefly then redirect
      showToast('Đã đăng nhờ. Mọi người trong vòng sẽ thấy ngay.', 'success');
      // Short delay so toast is briefly visible before navigation
      setTimeout(() => {
        router.push('/home');
      }, 600);
    } else {
      // Error: toast shown, form data preserved, button re-enabled (AC-4.10)
      setSubmitting(false);
      showToast('Gửi không được. Kiểm tra mạng và thử lại.', 'error');
    }
  }

  // Handle back navigation
  function handleBack() {
    router.back();
  }

  return (
    <div className="new-request-page">
      {/* Toast — slides from top, auto-dismiss */}
      {toast.visible && (
        <div
          className={`nr-toast nr-toast--${toast.variant}`}
          role="status"
          aria-live="polite"
          onClick={() => setToast((prev) => ({ ...prev, visible: false }))}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header className="new-request-header">
        <button
          type="button"
          className="new-request-back-btn"
          onClick={handleBack}
          aria-label="Quay lại"
        >
          <IconArrowLeft />
        </button>
        <h1 className="new-request-header__title">Nhờ giúp</h1>
        {/* Right placeholder for visual balance */}
        <div className="new-request-header__right-placeholder" aria-hidden="true" />
      </header>

      {/* Scrollable form body */}
      <div className="new-request-body">
        {/* Field 1 — Category tiles */}
        <fieldset className="nr-field" aria-required="true">
          <legend className="nr-field__label">1. Bạn cần giúp gì?</legend>
          <div className="nr-cat-grid" role="group" aria-label="Loại giúp đỡ">
            {CATEGORIES.map((opt) => (
              <CategoryTile
                key={opt.id}
                option={opt}
                selected={category === opt.id}
                onClick={setCategory}
                disabled={submitting}
              />
            ))}
          </div>
        </fieldset>

        {/* Field 2 — Description */}
        <div className="nr-field">
          <label htmlFor="nr-detail" className="nr-field__label">
            2. Chi tiết cụ thể
          </label>
          <textarea
            id="nr-detail"
            className="fc-textarea"
            maxLength={MAX_DESC}
            placeholder="Ví dụ: Đón con từ trường mầm non Sakura"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            disabled={submitting}
            aria-describedby="nr-detail-counter"
            rows={3}
          />
          <div
            id="nr-detail-counter"
            className={`fc-tiny nr-counter${detail.length >= MAX_DESC - 20 ? ' nr-counter--near-limit' : ''}`}
            aria-live="polite"
            aria-label={`${detail.length} trên ${MAX_DESC} ký tự`}
          >
            {detail.length}/{MAX_DESC}
          </div>
        </div>

        {/* Field 3 — When */}
        <div className="nr-field">
          <label htmlFor="nr-when" className="nr-field__label">
            3. Khi nào?
          </label>
          <div className="nr-input-wrapper">
            <span className="nr-input-icon" aria-hidden="true">
              <IconCalendar />
            </span>
            <input
              id="nr-when"
              type="text"
              className="fc-input fc-input--with-icon"
              placeholder="Hôm nay lúc 15:30"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              disabled={submitting}
              autoComplete="off"
            />
          </div>
        </div>

        {/* Field 4 — Location */}
        <div className="nr-field">
          <label htmlFor="nr-place" className="nr-field__label">
            4. Ở đâu?
          </label>
          <div className="nr-input-wrapper">
            <span className="nr-input-icon" aria-hidden="true">
              <IconMapPin />
            </span>
            <input
              id="nr-place"
              type="text"
              className="fc-input fc-input--with-icon"
              placeholder="Trường Minato Sho, Yokohama"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              disabled={submitting}
              autoComplete="off"
            />
          </div>
        </div>

        {/* Field 5 — Urgent */}
        <div className="nr-field">
          <p className="nr-field__label" id="nr-urgent-label">
            5. Có gấp không?
          </p>
          <div
            className="nr-urgent-row"
            role="group"
            aria-labelledby="nr-urgent-label"
          >
            <button
              type="button"
              className={`fc-btn ${urgent ? 'fc-btn--primary' : 'fc-btn--secondary'} nr-urgent-btn`}
              onClick={() => setUrgent(true)}
              disabled={submitting}
              aria-pressed={urgent}
            >
              Có, gấp
            </button>
            <button
              type="button"
              className={`fc-btn ${!urgent ? 'fc-btn--primary' : 'fc-btn--secondary'} nr-urgent-btn`}
              onClick={() => setUrgent(false)}
              disabled={submitting}
              aria-pressed={!urgent}
            >
              Không, từ từ được
            </button>
          </div>
        </div>

        {/* Submit button — AC-4.4, AC-4.11 */}
        <div className="nr-submit-section">
          <button
            type="button"
            className={`fc-btn fc-btn--block${canSubmit && !submitting ? ' fc-btn--primary' : ' fc-btn--disabled'}`}
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            aria-busy={submitting}
            aria-label={submitting ? 'Đang gửi yêu cầu nhờ giúp' : 'Gửi nhờ giúp'}
          >
            {submitting ? (
              <>
                <span className="nr-spinner" aria-hidden="true" />
                Đang gửi…
              </>
            ) : (
              'Gửi nhờ giúp'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
