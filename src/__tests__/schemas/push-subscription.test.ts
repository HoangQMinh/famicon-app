/**
 * Unit tests for pushSubscriptionSchema.
 *
 * WHY: The browser's PushSubscription object must be validated before
 * being written to the DB. Missing or malformed fields (e.g. empty endpoint,
 * missing p256dh) would cause silent failures in Web Push delivery later.
 * Testing at the schema layer catches these before the Server Action runs.
 */

import { describe, it, expect } from 'vitest';
import { pushSubscriptionSchema } from '@/lib/notifications/push-subscription-schema';

describe('pushSubscriptionSchema', () => {
  // -------------------------------------------------------------------------
  // Valid inputs (happy path last — edge cases first)
  // -------------------------------------------------------------------------

  it('accepts valid subscription object with all required fields', () => {
    const result = pushSubscriptionSchema.safeParse({
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
      keys: {
        p256dh: 'BNV7QEe_5Rp3oANf3xxxxxxxXXXXXXXXXXXXXXXXXX',
        auth: 'tBnzqFRWxxx',
      },
    });
    expect(result.success).toBe(true);
  });

  it('accepts APNS endpoint (Apple push service URL)', () => {
    // WHY: iOS 16.4+ PWA uses Apple's push service, not FCM
    const result = pushSubscriptionSchema.safeParse({
      endpoint: 'https://api.push.apple.com/3/device/abc',
      keys: {
        p256dh: 'some-p256dh-key',
        auth: 'some-auth-key',
      },
    });
    expect(result.success).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Missing required fields — most common failure modes
  // -------------------------------------------------------------------------

  it('rejects when endpoint is missing entirely', () => {
    // WHY: Without endpoint, web-push library has no target to send to
    const result = pushSubscriptionSchema.safeParse({
      keys: { p256dh: 'abc', auth: 'def' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects when keys object is missing entirely', () => {
    const result = pushSubscriptionSchema.safeParse({
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
    });
    expect(result.success).toBe(false);
  });

  it('rejects when keys.p256dh is missing', () => {
    // WHY: p256dh is the ECDH public key — required for VAPID encryption
    const result = pushSubscriptionSchema.safeParse({
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
      keys: { auth: 'def' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects when keys.auth is missing', () => {
    // WHY: auth key is required for VAPID authentication
    const result = pushSubscriptionSchema.safeParse({
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
      keys: { p256dh: 'abc' },
    });
    expect(result.success).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Invalid endpoint format
  // -------------------------------------------------------------------------

  it('rejects endpoint that is not a valid URL', () => {
    // WHY: web-push will throw cryptic errors on invalid endpoint URLs;
    // catch this at validation time with a clear error message
    const result = pushSubscriptionSchema.safeParse({
      endpoint: 'not-a-url',
      keys: { p256dh: 'abc', auth: 'def' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty string endpoint', () => {
    const result = pushSubscriptionSchema.safeParse({
      endpoint: '',
      keys: { p256dh: 'abc', auth: 'def' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects endpoint without HTTPS scheme (non-URL string)', () => {
    // WHY: Push services require HTTPS — HTTP endpoints should be caught early
    const result = pushSubscriptionSchema.safeParse({
      endpoint: 'http-endpoint-without-colon-slash',
      keys: { p256dh: 'abc', auth: 'def' },
    });
    expect(result.success).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Empty key values
  // -------------------------------------------------------------------------

  it('rejects empty string p256dh', () => {
    const result = pushSubscriptionSchema.safeParse({
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
      keys: { p256dh: '', auth: 'def' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty string auth key', () => {
    const result = pushSubscriptionSchema.safeParse({
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
      keys: { p256dh: 'abc', auth: '' },
    });
    expect(result.success).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Null / undefined inputs
  // -------------------------------------------------------------------------

  it('rejects null input', () => {
    const result = pushSubscriptionSchema.safeParse(null);
    expect(result.success).toBe(false);
  });

  it('rejects empty object', () => {
    const result = pushSubscriptionSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
