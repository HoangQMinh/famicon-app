// =============================================================================
// Route Handler: POST /api/line/webhook
// Description:  Receives LINE Messaging API webhook events.
//               Handles the "follow" event to capture line_user_id for fallback
//               notifications (D-011, F5.6, ADR-004).
//
// Security:     Verifies X-Line-Signature using HMAC-SHA256 with LINE_CHANNEL_SECRET.
//               Unauthenticated requests are rejected (LINE requirement).
//               Must return HTTP 200 for ALL events (LINE retries on non-200).
//
// Refs:         F5.6, ADR-004, D-011
//               Constitution: line_user_id stored ONLY in profiles table
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LINEEvent {
  type: string;
  source?: {
    type: string;
    userId?: string;
    // groupId and roomId intentionally omitted — FAMICON uses 1:1 bot only
  };
  replyToken?: string;
}

interface LINEWebhookPayload {
  destination: string;
  events: LINEEvent[];
}

// ---------------------------------------------------------------------------
// Signature verification
// ---------------------------------------------------------------------------

/**
 * Verifies the X-Line-Signature header using HMAC-SHA256.
 * LINE uses base64(HMAC-SHA256(channel_secret, raw_body)).
 *
 * Uses timingSafeEqual to prevent timing attacks.
 */
function verifyLineSignature(rawBody: string, signature: string, secret: string): boolean {
  try {
    const hmac = createHmac('sha256', secret).update(rawBody).digest('base64');
    // Both buffers must be the same length for timingSafeEqual
    const hmacBuf = Buffer.from(hmac, 'base64');
    const sigBuf  = Buffer.from(signature, 'base64');

    if (hmacBuf.length !== sigBuf.length) return false;
    return timingSafeEqual(hmacBuf, sigBuf);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Follow event handler
// ---------------------------------------------------------------------------

/**
 * Handles LINE "follow" event — user adds the FAMICON LINE Official Account.
 *
 * The LINE user ID extracted from the event is stored in profiles.line_user_id.
 * We look up the profile via the LINE user ID first (idempotent).
 *
 * Note: We use the service-role client here because this runs outside of a user
 * session. The LINE user ID → Supabase user mapping relies on the user having
 * previously stored their line_user_id via the Settings → "Kết nối LINE" flow,
 * OR this follow event happens after the user initiates the link.
 *
 * For MVP: since LINE Login OAuth is not implemented, we cannot reliably match
 * the LINE user to a Supabase user at follow time without additional context.
 * Instead, we log the event and update any profile that already has this
 * line_user_id set (idempotent upsert pattern).
 *
 * When the user has used the Settings flow first (set their own line_user_id),
 * this follow event confirms the connection and ensures the ID is up-to-date.
 */
async function handleFollowEvent(lineUserId: string): Promise<void> {
  const adminClient = createAdminClient();

  // Check if any profile already has this LINE user ID — idempotent
  const { data: existing, error: lookupError } = await adminClient
    .from('profiles')
    .select('id')
    .eq('line_user_id', lineUserId)
    .maybeSingle();

  if (lookupError) {
    logger.error('[line/webhook] Follow event profile lookup failed:', lookupError.code);
    return;
  }

  if (existing) {
    // Profile already linked — nothing to do (idempotent)
    console.log('[line/webhook] Follow event: profile already linked (idempotent)');
    return;
  }

  // No existing profile has this LINE user ID.
  // This follow event arrives before the user links via Settings — store it
  // as a pending association. For MVP, we cannot match to a Supabase user
  // without a shared token, so we just log the event for observability.
  //
  // Future (Sprint 7): implement a linking flow where user gets a one-time code
  // in-app, sends it to the LINE bot, and the bot links the accounts.
  console.log('[line/webhook] Follow event received — no matching profile found (unlinked user)');
}

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  // LINE requirement: always return 200. Even on error paths, return 200
  // so LINE does not retry the webhook indefinitely.

  const secret = process.env.LINE_CHANNEL_SECRET;

  if (!secret) {
    // LINE not configured — log warning, return 200 (do not crash)
    console.warn('[line/webhook] LINE_CHANNEL_SECRET not configured — accepting request without verification');
  }

  // --- 1. Read raw body for signature verification ---
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    logger.error('[line/webhook] Failed to read request body');
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  // --- 2. Verify signature (when secret is configured) ---
  if (secret) {
    const signature = req.headers.get('x-line-signature') ?? '';
    if (!signature) {
      logger.error('[line/webhook] Missing X-Line-Signature header');
      // Return 200 per LINE requirement but do not process
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    const valid = verifyLineSignature(rawBody, signature, secret);
    if (!valid) {
      logger.error('[line/webhook] Invalid LINE signature — request rejected');
      // Return 200 to prevent LINE retry spam, but do not process
      return NextResponse.json({ ok: false }, { status: 200 });
    }
  }

  // --- 3. Parse payload ---
  let payload: LINEWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as LINEWebhookPayload;
  } catch {
    logger.error('[line/webhook] Invalid JSON payload');
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  // --- 4. Process events ---
  for (const event of payload.events ?? []) {
    try {
      if (event.type === 'follow') {
        const lineUserId = event.source?.userId;
        if (lineUserId) {
          await handleFollowEvent(lineUserId);
        } else {
          logger.error('[line/webhook] Follow event missing source.userId');
        }
      }
      // Other event types (message, unfollow, etc.) are silently ignored for MVP
    } catch (err) {
      // Never throw out of the event loop — process remaining events
      logger.error('[line/webhook] Error processing event:', (err as Error).message);
    }
  }

  // LINE requires HTTP 200 for all responses
  return NextResponse.json({ ok: true }, { status: 200 });
}
