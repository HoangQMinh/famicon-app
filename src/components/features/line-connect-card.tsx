'use client';

import { useEffect, useState } from 'react';

const LS_KEY = 'line-card-dismissed';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Detect iOS device (iPhone/iPad/iPod).
 * Must run client-side — navigator is not available in Server Components.
 */
function detectIsIOS(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LINEConnectCardProps {
  /** Whether the user already has a line_user_id saved in their profile */
  hasLineUserId: boolean;
  /**
   * Whether the current device is iOS.
   * Server passes false (unknown) — component performs own detection on mount.
   * This prop is kept for testability (tests can force isIOS=true).
   */
  isIOS: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * LINEConnectCard — opt-in card for iOS users without LINE connected.
 *
 * Only renders when:
 *   - Device is iOS (detected client-side via navigator.userAgent)
 *   - hasLineUserId is false (not yet connected)
 *   - User has not dismissed this card (localStorage)
 *
 * LINE opt-in flow (MVP — no OAuth, just webhook follow event):
 *   1. User adds the FAMICON LINE Official Account
 *   2. LINE webhook receives 'follow' event → saves line_user_id
 *   3. Next page load: hasLineUserId = true → card disappears
 *
 * Constitution: No in-app chat UI — only instructions pointing to LINE app.
 */
export function LINEConnectCard({ hasLineUserId, isIOS: isIOSProp }: LINEConnectCardProps) {
  const [visible, setVisible] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Run iOS detection client-side only — navigator not available on server.
    // isIOSProp=true allows tests to force the component to show.
    const isIOSDevice = isIOSProp || detectIsIOS();
    if (!isIOSDevice) return;
    if (hasLineUserId) return;
    if (localStorage.getItem(LS_KEY)) return;

    setVisible(true);
  }, [hasLineUserId, isIOSProp]);

  if (!visible) return null;

  function handleDismiss() {
    localStorage.setItem(LS_KEY, '1');
    setVisible(false);
  }

  function handleConnect() {
    setShowInstructions(true);
  }

  return (
    <div
      className="line-card"
      role="region"
      aria-label="Kết nối LINE để nhận thông báo"
      data-testid="line-connect-card"
    >
      {/* Header */}
      <div className="line-card__header">
        {/* LINE brand green circle */}
        <span className="line-card__logo" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="12" fill="#06C755" />
            <text x="12" y="16" textAnchor="middle" fill="white" fontSize="11" fontWeight="700">
              LINE
            </text>
          </svg>
        </span>
        <p className="line-card__title">Kết nối LINE để nhận thông báo</p>

        {/* Dismiss button */}
        <button
          type="button"
          className="line-card__close-btn"
          onClick={handleDismiss}
          aria-label="Đóng thẻ kết nối LINE"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Body */}
      {!showInstructions ? (
        <>
          <p className="line-card__text">
            Kết nối LINE để nhận thông báo khi không có Wi-Fi hoặc dữ liệu di động.
          </p>

          <button
            type="button"
            className="fc-btn fc-btn--primary line-card__connect-btn"
            onClick={handleConnect}
          >
            Kết nối LINE
          </button>
        </>
      ) : (
        /* Instructions state */
        <div className="line-card__instructions">
          <p className="line-card__instructions-heading">Cách kết nối LINE:</p>
          <ol className="line-card__steps">
            <li className="line-card__step">
              Mở app <strong>LINE</strong> trên điện thoại
            </li>
            <li className="line-card__step">
              Tìm kiếm tài khoản chính thức: <strong>@FAMICON</strong>
            </li>
            <li className="line-card__step">
              Bấm <strong>Theo dõi (Follow)</strong> tài khoản
            </li>
            <li className="line-card__step">
              Gửi bất kỳ tin nhắn nào — bot sẽ tự động kết nối với tài khoản của bạn
            </li>
          </ol>
          <p className="line-card__instructions-note">
            Sau khi kết nối, trang sẽ tự động cập nhật.
          </p>

          <button
            type="button"
            className="fc-btn fc-btn--secondary line-card__done-btn"
            onClick={handleDismiss}
          >
            Đã xong
          </button>
        </div>
      )}
    </div>
  );
}
