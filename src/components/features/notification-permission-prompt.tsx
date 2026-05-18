'use client';

import { useEffect, useState } from 'react';
import { savePushSubscription } from '@/app/actions/notifications';

const LS_KEY = 'notification-prompt-dismissed';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface NotificationPermissionPromptProps {
  vapidPublicKey: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert a URL-safe base64 VAPID public key to an ArrayBuffer
 * required by PushManager.subscribe() applicationServerKey.
 * Returns ArrayBuffer instead of Uint8Array to satisfy the strict
 * BufferSource type expected by PushSubscriptionOptionsInit.
 */
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * NotificationPermissionPrompt — one-time, dismissible push opt-in card.
 *
 * Renders only when:
 *   - Notification API is available in browser
 *   - Permission is not yet 'granted' or 'denied'
 *   - User has not previously dismissed via localStorage
 *
 * Constitution: No dark patterns — prompt is non-blocking, always dismissible.
 * Nguyên tắc 4: không fake urgency, không guilt trip.
 */
export function NotificationPermissionPrompt({
  vapidPublicKey,
}: NotificationPermissionPromptProps) {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<'idle' | 'requesting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Must be in useEffect — window/Notification not available server-side
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') return;
    if (Notification.permission === 'denied') return;
    if (typeof window !== 'undefined' && localStorage.getItem(LS_KEY)) return;

    setVisible(true);
  }, []);

  if (!visible) return null;

  // --- Success state ---
  if (status === 'success') {
    return (
      <div
        className="notif-prompt"
        data-testid="notification-permission-prompt"
        role="status"
      >
        <span className="notif-prompt__icon" aria-hidden="true">🔔</span>
        <p className="notif-prompt__text notif-prompt__text--success">
          Bật thông báo thành công! Bạn sẽ không bỏ lỡ yêu cầu nào trong vòng.
        </p>
      </div>
    );
  }

  async function handleEnable() {
    setStatus('requesting');
    setErrorMsg('');

    try {
      if (!('Notification' in window)) {
        throw new Error('Trình duyệt không hỗ trợ thông báo.');
      }

      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        // User explicitly denied — hide the prompt, no guilt trip
        setVisible(false);
        return;
      }

      // Subscribe to PushManager
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Convert PushSubscription to a plain object for the Server Action
      const subJson = subscription.toJSON();
      const endpoint = subJson.endpoint ?? '';
      const p256dh = subJson.keys?.p256dh ?? '';
      const auth = subJson.keys?.auth ?? '';

      await savePushSubscription({ endpoint, keys: { p256dh, auth } });

      setStatus('success');
      // Auto-hide success state after 4 seconds
      setTimeout(() => setVisible(false), 4000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể bật thông báo.';
      setErrorMsg(message);
      setStatus('error');
    }
  }

  function handleDismiss() {
    localStorage.setItem(LS_KEY, '1');
    setVisible(false);
  }

  return (
    <div
      className="notif-prompt"
      data-testid="notification-permission-prompt"
      role="region"
      aria-label="Bật thông báo"
    >
      {/* Icon */}
      <span className="notif-prompt__icon" aria-hidden="true">🔔</span>

      {/* Text */}
      <div className="notif-prompt__body">
        <p className="notif-prompt__text">
          Bật thông báo để không bỏ lỡ yêu cầu trong vòng
        </p>

        {/* Error state */}
        {status === 'error' && (
          <p className="notif-prompt__error" role="alert">
            {errorMsg || 'Không thể bật thông báo. Thử lại nhé.'}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="notif-prompt__actions">
        <button
          type="button"
          className="fc-btn fc-btn--primary notif-prompt__enable-btn"
          onClick={() => void handleEnable()}
          disabled={status === 'requesting'}
          aria-busy={status === 'requesting'}
          data-testid="enable-notifications-btn"
        >
          {status === 'requesting' ? (
            <>
              <span className="nr-spinner" aria-hidden="true" />
              Đang bật…
            </>
          ) : status === 'error' ? (
            'Thử lại'
          ) : (
            'Bật thông báo'
          )}
        </button>

        <button
          type="button"
          className="notif-prompt__dismiss-btn"
          onClick={handleDismiss}
          aria-label="Để sau, không bật thông báo lúc này"
        >
          Để sau
        </button>
      </div>
    </div>
  );
}
