'use client';

import { useEffect, useState } from 'react';

const LS_KEY = 'ios-guide-dismissed';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Detect iOS Safari without Add to Home Screen.
 *
 * iOS Safari sets a non-standard standalone property on navigator.
 * When the PWA has been added to the home screen, navigator.standalone === true.
 * We check the user agent for iPhone/iPad/iPod to identify iOS.
 */
function isIOSSafariWithoutPWA(): boolean {
  if (typeof window === 'undefined') return false;

  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const isStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;

  // iOS Safari but not yet added to home screen
  return isIOS && !isStandalone;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * IOSInstallGuide — one-time guide for iOS Safari users to add FAMICON to home screen.
 *
 * Only renders on iOS Safari when NOT already installed as PWA.
 * iOS Safari < 16.4 does not support Web Push at all.
 * iOS Safari 16.4+ requires Add to Home Screen for Web Push.
 * So this guide is mandatory for iOS users who want push notifications.
 *
 * Constitution: always dismissible, no blocking modal, no fake urgency.
 */
export function IOSInstallGuide() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Guard: only show on iOS Safari without PWA, and if not previously dismissed
    if (!isIOSSafariWithoutPWA()) return;
    if (localStorage.getItem(LS_KEY)) return;

    setVisible(true);
  }, []);

  if (!visible) return null;

  function handleDismiss() {
    localStorage.setItem(LS_KEY, '1');
    setVisible(false);
  }

  function handleAlreadyAdded() {
    localStorage.setItem(LS_KEY, '1');
    setVisible(false);
    // Reload to trigger NotificationPermissionPrompt now that PWA is detected
    window.location.reload();
  }

  return (
    <div
      className="ios-guide"
      role="region"
      aria-label="Hướng dẫn thêm vào màn hình chính"
      data-testid="ios-install-guide"
    >
      {/* Icon */}
      <span className="ios-guide__icon" aria-hidden="true">📲</span>

      {/* Main message */}
      <div className="ios-guide__body">
        <p className="ios-guide__heading">Thêm FAMICON vào màn hình chính</p>
        <p className="ios-guide__text">
          Để nhận thông báo khi có yêu cầu mới, hãy thêm FAMICON vào màn hình chính.
        </p>

        {/* Steps */}
        <ol className="ios-guide__steps" aria-label="Các bước thêm vào màn hình chính">
          <li className="ios-guide__step">
            <span className="ios-guide__step-icon" aria-hidden="true">1</span>
            <span>Mở trong <strong>Safari</strong></span>
          </li>
          <li className="ios-guide__step">
            <span className="ios-guide__step-icon" aria-hidden="true">2</span>
            <span>Bấm nút <strong>Chia sẻ</strong> (hình vuông có mũi tên lên)</span>
          </li>
          <li className="ios-guide__step">
            <span className="ios-guide__step-icon" aria-hidden="true">3</span>
            <span>Chọn <strong>&ldquo;Thêm vào màn hình chính&rdquo;</strong></span>
          </li>
        </ol>
      </div>

      {/* Actions */}
      <div className="ios-guide__actions">
        <button
          type="button"
          className="fc-btn fc-btn--primary ios-guide__done-btn"
          onClick={handleAlreadyAdded}
        >
          Đã thêm rồi
        </button>

        <button
          type="button"
          className="ios-guide__skip-btn"
          onClick={handleDismiss}
          aria-label="Bỏ qua, sẽ nhận thông báo qua LINE"
        >
          Bỏ qua (sẽ nhận qua LINE)
        </button>
      </div>
    </div>
  );
}
