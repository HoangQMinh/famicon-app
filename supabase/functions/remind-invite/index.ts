// =============================================================================
// Edge Function: remind-invite
// Description:  Daily cron job — sends invite reminder notifications for pending
//               circle_invites whose expires_at is 2–3 days away (day 5 of 7).
//
// Schedule:     Configure in Supabase Dashboard > Edge Functions > Cron
//               Recommended: "0 9 * * *" (09:00 UTC daily, ~18:00 JST)
//
// Refs:         F5.8, D-024 (invites expire after 7 days), ADR-004
//               Notification type: invite_reminder → notify invited_by (inviter)
// =============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PendingInvite {
  id: string;
  circle_id: string;
  invited_by: string;
  email: string;   // used only to confirm an invite exists — NOT included in notification payload
  expires_at: string;
}

interface PushSubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth_key: string;
}

interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag: string;
}

type NotificationStatus = 'sent' | 'failed';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Sends a single Web Push notification via VAPID.
 * Graceful degradation: if VAPID keys are missing → log warning and skip.
 */
async function sendWebPush(
  subscription: PushSubscriptionRow,
  payload: PushPayload
): Promise<{ ok: boolean; expired: boolean }> {
  const publicKey  = Deno.env.get('NEXT_PUBLIC_VAPID_PUBLIC_KEY') ?? '';
  const privateKey = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
  const subject    = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:minhbk.2009@gmail.com';

  if (!privateKey || !publicKey) {
    console.warn('[remind-invite] VAPID keys not configured — skipping Web Push');
    return { ok: false, expired: false };
  }

  try {
    const webpush = await import('https://esm.sh/web-push@3.6.7');
    webpush.setVapidDetails(subject, publicKey, privateKey);

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth_key },
      },
      JSON.stringify(payload)
    );

    return { ok: true, expired: false };
  } catch (err: unknown) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    const expired = statusCode === 410 || statusCode === 400;
    console.error(
      `[remind-invite] Web Push failed (status=${statusCode ?? 'unknown'}):`,
      expired ? 'subscription expired' : 'transient error'
    );
    return { ok: false, expired };
  }
}

// ---------------------------------------------------------------------------
// Log helper
// ---------------------------------------------------------------------------

async function logNotification(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  entry: {
    user_id: string;
    type: 'invite_reminder';
    channel: 'web_push';
    status: NotificationStatus;
    request_id: null;
  }
): Promise<void> {
  const { error } = await supabase.from('notification_logs').insert(entry);
  if (error) {
    console.error('[remind-invite] Failed to write notification_log:', error.message);
  }
}

// ---------------------------------------------------------------------------
// Core logic
// ---------------------------------------------------------------------------

export async function processRemindInvite(): Promise<{ reminded: number }> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Query invites expiring in 2–3 days from now (i.e. day 5 of a 7-day window)
  const now  = new Date();
  const from = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(); // now + 2 days
  const to   = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(); // now + 3 days

  const { data: invites, error: queryError } = await supabase
    .from('circle_invites')
    .select('id, circle_id, invited_by, expires_at')
    .eq('status', 'pending')
    .gte('expires_at', from)
    .lt('expires_at', to);

  if (queryError) {
    console.error('[remind-invite] Query failed:', queryError.message);
    throw new Error(`remind-invite query failed: ${queryError.message}`);
  }

  if (!invites || invites.length === 0) {
    console.log('[remind-invite] No invites to remind');
    return { reminded: 0 };
  }

  let reminded = 0;

  for (const invite of (invites as PendingInvite[])) {
    const payload: PushPayload = {
      // Constitution: payload must NOT contain PII (invitee email not included)
      title: 'Link mời sắp hết hạn',
      body:  'Link mời bạn gửi sắp hết hạn trong 2 ngày. Hãy nhắc lại người được mời.',
      url:   '/invite',
      tag:   `invite-remind-${invite.id}`,
    };

    // Fetch push subscriptions for the inviter
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth_key')
      .eq('user_id', invite.invited_by);

    if (subError) {
      console.error('[remind-invite] Failed to fetch push subscriptions:', subError.message);
    }

    let notified = false;

    if (subscriptions && subscriptions.length > 0) {
      for (const sub of subscriptions as PushSubscriptionRow[]) {
        const { ok, expired } = await sendWebPush(sub, payload);

        if (ok) {
          notified = true;
          await logNotification(supabase, {
            user_id: invite.invited_by,
            type: 'invite_reminder',
            channel: 'web_push',
            status: 'sent',
            request_id: null,
          });
          reminded++;
          break;
        }

        // Remove expired subscriptions so they don't clog the table
        if (expired) {
          const { error: deleteError } = await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', invite.invited_by)
            .eq('endpoint', sub.endpoint);

          if (deleteError) {
            console.error('[remind-invite] Failed to remove expired subscription:', deleteError.message);
          }
        }
      }
    }

    if (!notified) {
      await logNotification(supabase, {
        user_id: invite.invited_by,
        type: 'invite_reminder',
        channel: 'web_push',
        status: 'failed',
        request_id: null,
      });
    }
  }

  console.log(`[remind-invite] Sent reminders for ${reminded}/${invites.length} invite(s)`);
  return { reminded };
}

// ---------------------------------------------------------------------------
// Deno.serve entry point
// ---------------------------------------------------------------------------

Deno.serve(async (_req: Request): Promise<Response> => {
  try {
    const result = await processRemindInvite();
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[remind-invite] Unhandled error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
