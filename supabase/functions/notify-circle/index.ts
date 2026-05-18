// =============================================================================
// Edge Function: notify-circle
// Description:  Sends Web Push notifications (with LINE fallback) to all active
//               circle members when a new aid_request is created.
//
// Trigger:      Called directly from the createRequest Server Action after a
//               successful DB insert (Option 2 — no DB webhook needed in Sprint 5).
//
// Refs:         F5.5, ADR-004, D-011, Constitution Nguyên tắc 4
//               Rate limit: max 5 non-urgent notifications / user / day
//               Quiet hours: 22:00–07:00 JST (UTC+9) — skip non-urgent
//               PII: notification payload must NOT contain PII (names, addresses)
// =============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AidRequestRecord {
  id: string;
  circle_id: string;
  requester_id: string;
  category: string;
  description: string;
  is_urgent: boolean;
}

interface CircleMember {
  user_id: string;
  line_user_id: string | null;
}

interface PushSubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth_key: string;
}

type NotificationType = 'new_request' | 'urgent_request';
type NotificationStatus = 'sent' | 'failed' | 'skipped_rate_limit' | 'skipped_quiet_hours';

interface WebPushPayload {
  title: string;
  body: string;
  url: string;
  tag: string;
}

// Dependency injection for testability
interface NotifyDeps {
  pushFn?: (
    subscription: PushSubscriptionRow,
    payload: WebPushPayload,
    vapidConfig: VapidConfig
  ) => Promise<{ ok: boolean; expired: boolean }>;
  lineFn?: (lineUserId: string, message: string) => Promise<{ ok: boolean }>;
}

interface VapidConfig {
  publicKey: string;
  privateKey: string;
  subject: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<string, string> = {
  pickup:    'đón xe / đưa đón',
  borrow:    'mượn đồ',
  childcare: 'trông trẻ',
  ride:      'đi nhờ xe',
  other:     'hỗ trợ',
};

function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? 'hỗ trợ';
}

/**
 * Returns true if the current UTC time falls within quiet hours for JST (UTC+9).
 * Quiet hours: 22:00–07:00 JST  →  13:00–22:00 UTC
 */
function isQuietHoursJST(): boolean {
  const nowUTC = new Date();
  const jstHour = (nowUTC.getUTCHours() + 9) % 24;
  return jstHour >= 22 || jstHour < 7;
}

/**
 * Formats the LINE fallback message per notification-strategy.md template.
 * Does NOT include requester name, description, or location — avoids PII in message body.
 * Description is free-text entered by users and routinely contains names, addresses, phone numbers.
 */
function formatLineMessage(record: AidRequestRecord): string {
  const urgentTag = record.is_urgent ? '[FAMICON 🆘 GẤP]\n' : '[FAMICON]\n';
  return `${urgentTag}Vòng tròn có yêu cầu mới: ${categoryLabel(record.category)}.\n\n→ Xem và giúp: https://famicon.app/requests/${record.id}`;
}

// ---------------------------------------------------------------------------
// Default send implementations
// ---------------------------------------------------------------------------

/**
 * Sends a Web Push notification using the web-push VAPID protocol.
 * Falls back gracefully when VAPID keys are missing in env.
 *
 * Returns: { ok: boolean; expired: boolean }
 *   expired = true when the push service returns 410 (Gone) or 400 (Bad Request)
 *   indicating the subscription is no longer valid and should be removed.
 */
async function defaultPushFn(
  subscription: PushSubscriptionRow,
  payload: WebPushPayload,
  vapidConfig: VapidConfig
): Promise<{ ok: boolean; expired: boolean }> {
  if (!vapidConfig.privateKey || !vapidConfig.publicKey) {
    // VAPID keys not configured — graceful degradation
    console.warn('[notify-circle] VAPID keys not configured — skipping Web Push');
    return { ok: false, expired: false };
  }

  try {
    // Build the Authorization header for VAPID:
    // We use a minimal VAPID implementation via fetch rather than importing
    // the web-push npm package (Deno Edge Functions prefer URL imports).
    // For full VAPID signing we call the web-push library via esm.sh.
    const webpush = await import('https://esm.sh/web-push@3.6.7');

    webpush.setVapidDetails(
      vapidConfig.subject,
      vapidConfig.publicKey,
      vapidConfig.privateKey
    );

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth_key,
        },
      },
      JSON.stringify(payload)
    );

    return { ok: true, expired: false };
  } catch (err: unknown) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    // 410 Gone or 400 Bad Request → subscription is stale, mark for removal
    const expired = statusCode === 410 || statusCode === 400;
    console.error(
      `[notify-circle] Web Push failed for endpoint (status=${statusCode ?? 'unknown'}):`,
      expired ? 'subscription expired' : 'transient error'
    );
    return { ok: false, expired };
  }
}

/**
 * Sends a LINE push message.
 * If LINE_CHANNEL_ACCESS_TOKEN is not set → graceful degradation (log + skip).
 */
async function defaultLineFn(
  lineUserId: string,
  message: string
): Promise<{ ok: boolean }> {
  const token = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');

  if (!token) {
    // LINE not configured — log and skip (not an error in dev/staging)
    console.log('[notify-circle] LINE_CHANNEL_ACCESS_TOKEN not set — skipping LINE fallback');
    return { ok: false };
  }

  try {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [{ type: 'text', text: message }],
      }),
    });

    if (!res.ok) {
      console.error(`[notify-circle] LINE push failed: status=${res.status}`);
      return { ok: false };
    }

    return { ok: true };
  } catch (err) {
    console.error('[notify-circle] LINE push exception:', err);
    return { ok: false };
  }
}

// ---------------------------------------------------------------------------
// Core logic (exported for unit testing with injected deps)
// ---------------------------------------------------------------------------

export async function processNotifyCircle(
  record: AidRequestRecord,
  deps: NotifyDeps = {}
): Promise<void> {
  const pushFn = deps.pushFn ?? defaultPushFn;
  const lineFn = deps.lineFn ?? defaultLineFn;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const vapidConfig: VapidConfig = {
    publicKey:  Deno.env.get('NEXT_PUBLIC_VAPID_PUBLIC_KEY') ?? '',
    privateKey: Deno.env.get('VAPID_PRIVATE_KEY') ?? '',
    subject:    Deno.env.get('VAPID_SUBJECT') ?? 'mailto:minhbk.2009@gmail.com',
  };

  const notifType: NotificationType = record.is_urgent ? 'urgent_request' : 'new_request';
  const pushPayload: WebPushPayload = {
    // Constitution: title must NOT contain PII (no requester name, no address)
    title: record.is_urgent ? '🆘 Yêu cầu gấp trong vòng' : 'Yêu cầu mới trong vòng',
    body:  `Vòng tròn có yêu cầu mới: ${categoryLabel(record.category)}.`,
    url:   `/requests/${record.id}`,
    tag:   `request-${record.id}`,
  };

  // --- 1. Fetch active circle members (service role bypasses RLS) ---
  const { data: members, error: membersError } = await supabase
    .from('circle_members')
    .select('user_id, profiles!inner(line_user_id)')
    .eq('circle_id', record.circle_id)
    .eq('is_active', true);

  if (membersError) {
    console.error('[notify-circle] Failed to fetch members:', membersError.message);
    return;
  }

  if (!members || members.length === 0) {
    console.log('[notify-circle] No active members in circle:', record.circle_id);
    return;
  }

  const quietHours = isQuietHoursJST();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (const memberRow of members) {
    // Supabase join returns profiles as object when using !inner
    const profile = memberRow.profiles as unknown as { line_user_id: string | null } | null;
    const member: CircleMember = {
      user_id: memberRow.user_id,
      line_user_id: profile?.line_user_id ?? null,
    };

    // Skip the requester — they should not be notified of their own request
    if (member.user_id === record.requester_id) {
      continue;
    }

    // --- 2. Quiet hours check (Constitution Nguyên tắc 4) ---
    // Non-urgent notifications are suppressed during 22:00–07:00 JST.
    if (!record.is_urgent && quietHours) {
      await logNotification(supabase, {
        user_id: member.user_id,
        type: notifType,
        channel: 'web_push',
        status: 'skipped_quiet_hours',
        request_id: record.id,
      });
      continue;
    }

    // --- 3. Rate limit check (non-urgent only) ---
    // Urgent requests bypass the daily limit.
    if (!record.is_urgent) {
      const { count, error: rateError } = await supabase
        .from('notification_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', member.user_id)
        .neq('type', 'urgent_request')
        .eq('status', 'sent')
        .gte('created_at', today.toISOString());

      if (rateError) {
        console.error(
          '[notify-circle] Rate limit query failed for member — proceeding with notification:',
          rateError.message
        );
        // Fail open: if we can't check rate limit, still attempt to notify
      } else if ((count ?? 0) >= 5) {
        await logNotification(supabase, {
          user_id: member.user_id,
          type: notifType,
          channel: 'web_push',
          status: 'skipped_rate_limit',
          request_id: record.id,
        });
        continue;
      }
    }

    // --- 4. Fetch push subscriptions ---
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth_key')
      .eq('user_id', member.user_id);

    if (subError) {
      console.error('[notify-circle] Failed to fetch push subscriptions:', subError.message);
    }

    let pushSucceeded = false;

    if (subscriptions && subscriptions.length > 0) {
      for (const sub of subscriptions) {
        const { ok, expired } = await pushFn(
          sub as PushSubscriptionRow,
          pushPayload,
          vapidConfig
        );

        if (ok) {
          pushSucceeded = true;
          await logNotification(supabase, {
            user_id: member.user_id,
            type: notifType,
            channel: 'web_push',
            status: 'sent',
            request_id: record.id,
          });
          break; // One successful push per member is sufficient
        }

        // Remove stale subscriptions (410 Gone / 400 Bad Request)
        if (expired) {
          const { error: deleteError } = await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', member.user_id)
            .eq('endpoint', sub.endpoint);

          if (deleteError) {
            console.error('[notify-circle] Failed to remove expired subscription:', deleteError.message);
          }
        }
      }

      if (!pushSucceeded) {
        await logNotification(supabase, {
          user_id: member.user_id,
          type: notifType,
          channel: 'web_push',
          status: 'failed',
          request_id: record.id,
        });
      }
    }

    // --- 5. LINE fallback ---
    // Trigger when: no push subscription OR all push attempts failed,
    // AND the member has a line_user_id (opted in).
    if (!pushSucceeded && member.line_user_id) {
      const lineMessage = formatLineMessage(record);
      const { ok: lineOk } = await lineFn(member.line_user_id, lineMessage);

      await logNotification(supabase, {
        user_id: member.user_id,
        type: notifType,
        channel: 'line',
        status: lineOk ? 'sent' : 'failed',
        request_id: record.id,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Logging helper
// ---------------------------------------------------------------------------

interface LogEntry {
  user_id: string;
  type: NotificationType;
  channel: 'web_push' | 'line';
  status: NotificationStatus;
  request_id: string;
}

async function logNotification(
  supabase: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  entry: LogEntry
): Promise<void> {
  const { error } = await supabase.from('notification_logs').insert(entry);
  if (error) {
    // Log the failure but do not throw — logging must not block notification flow
    console.error('[notify-circle] Failed to write notification_log:', error.message);
  }
}

// ---------------------------------------------------------------------------
// Deno.serve entry point
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request): Promise<Response> => {
  // Only accept POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let record: AidRequestRecord;
  try {
    const body = await req.json() as { record?: AidRequestRecord };
    if (!body.record) {
      return new Response(
        JSON.stringify({ error: 'Missing record in payload' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    record = body.record;
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON payload' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Validate required fields
  if (!record.id || !record.circle_id || !record.requester_id || !record.category) {
    return new Response(
      JSON.stringify({ error: 'Incomplete record: missing required fields' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    await processNotifyCircle(record);
    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[notify-circle] Unhandled error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
