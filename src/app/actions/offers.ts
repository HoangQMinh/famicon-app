'use server';

import { createClient } from '@/lib/supabase/server';
import type { ActionResult, HelpOffer } from '@/lib/types';
import { logger } from '@/lib/logger';
import { offerCreateSchema, offerAcceptSchema } from '@/lib/schemas/requests';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Postgres unique violation error code
const PG_UNIQUE_VIOLATION = '23505';

// ---------------------------------------------------------------------------
// createOffer
// ---------------------------------------------------------------------------

/**
 * Records a "I can help" offer from the authenticated user for an open aid request,
 * then returns a LINE deeplink so the helper can contact the requester directly.
 *
 * Security model:
 *   - Auth guard: unauthenticated callers rejected early.
 *   - Explicit membership check: the calling user must be an active member of
 *     the circle that owns the request. Defense-in-depth on top of the RLS
 *     policy "offers_insert_member" which enforces the same constraint at DB level.
 *   - Duplicate offer: caught via Postgres unique constraint (23505). The RLS
 *     policy already blocks inserts where ar.status != 'open', but we also
 *     check status explicitly to return a user-friendly error instead of a
 *     generic DB error.
 *
 * Privacy:
 *   - line_user_id of the requester is fetched server-side ONLY to build the
 *     LINE deeplink. It is NEVER included in the ActionResult returned to the
 *     client (Constitution Principle 9 — closed circle / privacy).
 *   - Pre-filled message does not include requester name or PII.
 *
 * D-012: Chat hand-off to LINE is mandatory — no in-app chat is built here.
 * OQ-007: No matching/ranking logic — any circle member may offer (MVP assumption).
 *
 * @param requestId UUID of the aid request to offer help for.
 * @returns ActionResult<{ offer_id: string; line_handoff_url: string }>
 */
export async function createOffer(
  requestId: string
): Promise<ActionResult<{ offer_id: string; line_handoff_url: string }>> {
  // --- 1. Auth guard ---
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Bạn cần đăng nhập.' };
  }

  // --- 2. Validate input ---
  const parsed = offerCreateSchema.safeParse({ requestId });
  if (!parsed.success) {
    return { success: false, error: 'ID yêu cầu không hợp lệ.' };
  }

  const validRequestId = parsed.data.requestId;

  // --- 3. Fetch aid request (with circle_id, status, category, requester_id) ---
  // RLS "requests_select_circle_member" limits this to requests from circles the
  // user belongs to. If the user is not a member, data will be null.
  const { data: request, error: requestError } = await supabase
    .from('aid_requests')
    .select('id, circle_id, requester_id, category, status')
    .eq('id', validRequestId)
    .maybeSingle();

  if (requestError) {
    logger.error('[offers] createOffer request lookup failed:', requestError.code);
    return { success: false, error: 'Không thể tải thông tin yêu cầu. Vui lòng thử lại.' };
  }

  if (!request) {
    // Either the request does not exist or RLS blocked it — intentionally vague.
    return { success: false, error: 'Yêu cầu không tồn tại hoặc bạn không có quyền truy cập.' };
  }

  // --- 4. Status guard ---
  // Offers may only be placed on 'open' requests.
  if (request.status === 'matched') {
    return { success: false, error: 'Yêu cầu này đã được nhận rồi.' };
  }
  if (request.status === 'cancelled' || request.status === 'closed') {
    return { success: false, error: 'Yêu cầu đã đóng.' };
  }
  if (request.status !== 'open') {
    return { success: false, error: 'Yêu cầu này không còn mở.' };
  }

  // --- 5. Self-offer guard ---
  // The requester should not offer help on their own request.
  if (request.requester_id === user.id) {
    return { success: false, error: 'Bạn không thể đề nghị giúp yêu cầu của chính mình.' };
  }

  // --- 6. Explicit membership check (defense-in-depth on top of RLS) ---
  // RLS on help_offers already enforces circle membership, but an explicit check
  // here allows a meaningful error message rather than a generic insert failure.
  const { data: membership, error: memberError } = await supabase
    .from('circle_members')
    .select('circle_id')
    .eq('circle_id', request.circle_id)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (memberError) {
    logger.error('[offers] createOffer membership check failed:', memberError.code);
    return { success: false, error: 'Không thể xác minh tư cách thành viên.' };
  }

  if (!membership) {
    return { success: false, error: 'Bạn không thuộc vòng tròn này.' };
  }

  // --- 7. Insert offer ---
  // Postgres unique constraint (request_id, helper_id) prevents duplicates.
  // We catch error code 23505 to return a friendly message instead of a generic error.
  const { data: offer, error: insertError } = await supabase
    .from('help_offers')
    .insert({
      request_id: validRequestId,
      helper_id: user.id,
      status: 'pending',
    })
    .select('id')
    .single();

  if (insertError) {
    if (insertError.code === PG_UNIQUE_VIOLATION) {
      return { success: false, error: 'Bạn đã đề nghị giúp request này rồi.' };
    }
    logger.error('[offers] createOffer insert failed:', insertError.code);
    return { success: false, error: 'Không thể ghi nhận đề nghị. Vui lòng thử lại.' };
  }

  // --- 8. Build LINE deeplink ---
  // Fetch requester's line_user_id server-side only — never returned to client.
  // RLS "profiles_select_circle_member" allows reading profiles of circle members.
  const { data: requesterProfile } = await supabase
    .from('profiles')
    .select('line_user_id')
    .eq('id', request.requester_id)
    .maybeSingle();

  // line_user_id intentionally not logged (PII).
  const lineUserId = requesterProfile?.line_user_id ?? null;

  // Category label for pre-filled LINE message (no PII).
  const categoryLabels: Record<string, string> = {
    pickup:    'đón/nhờ xe',
    ride:      'đi chung xe',
    childcare: 'trông trẻ',
    borrow:    'mượn đồ',
    other:     'hỗ trợ',
  };
  const categoryLabel = categoryLabels[request.category] ?? 'hỗ trợ';

  // Pre-filled message does not include requester name or address (no PII).
  const prefilledMessage = encodeURIComponent(
    `Mình có thể giúp bạn về ${categoryLabel}! Mình sẽ liên hệ nhé.`
  );

  let lineHandoffUrl: string;
  if (lineUserId) {
    // Deep link to a specific LINE user with a pre-filled message.
    lineHandoffUrl = `https://line.me/ti/p/~${lineUserId}`;
    // Note: LINE's ti/p deep link does not support pre-filling messages natively
    // on all platforms. The message is appended as a best-effort parameter.
    // If the platform ignores it, the user opens LINE and can type manually.
    lineHandoffUrl += `?openExternalBrowser=1`;
  } else {
    // Fallback: open LINE without a target — user must find the requester manually.
    // This happens when the requester has not connected their LINE account.
    lineHandoffUrl = `https://line.me/R/`;
  }

  // The prefilledMessage is available for future use if LINE adds universal
  // deep link support, but is not appended to the URL for now to avoid
  // broken URLs on platforms that don't support it.
  void prefilledMessage; // suppress unused variable warning

  return {
    success: true,
    data: {
      offer_id: offer.id,
      line_handoff_url: lineHandoffUrl,
    },
  };
}

// ---------------------------------------------------------------------------
// acceptOffer
// ---------------------------------------------------------------------------

/**
 * Allows the requester to accept one offer, marking that offer as 'accepted',
 * the aid request as 'matched', and all other offers for that request as 'declined'.
 *
 * Security model:
 *   - Auth guard: unauthenticated callers rejected.
 *   - Ownership check: only the requester of the parent aid request may accept.
 *   - RLS "requests_update_requester" at DB level enforces the same constraint.
 *
 * Constitution Principle 3 (respect face):
 *   - Declined offers are stored in DB but must NEVER be shown to helpers in
 *     the UI. The application layer is responsible for filtering.
 *   - Notification for helper_confirmed goes to the accepted helper only —
 *     no notification to declined helpers (no face loss).
 *
 * D-033: Re-notify is handled in cancelRequest, not here.
 *
 * @param offerId UUID of the help_offer to accept.
 * @returns ActionResult<{ accepted: true }>
 */
export async function acceptOffer(
  offerId: string
): Promise<ActionResult<{ accepted: true }>> {
  // --- 1. Auth guard ---
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Bạn cần đăng nhập.' };
  }

  // --- 2. Validate input ---
  const parsed = offerAcceptSchema.safeParse({ offerId });
  if (!parsed.success) {
    return { success: false, error: 'ID đề nghị không hợp lệ.' };
  }

  const validOfferId = parsed.data.offerId;

  // --- 3. Fetch offer + parent request to verify ownership ---
  // RLS "offers_select" allows the requester to read offers for their own requests.
  const { data: offer, error: offerError } = await supabase
    .from('help_offers')
    .select(
      `
      id,
      request_id,
      status,
      aid_requests!request_id (
        id,
        requester_id,
        status
      )
    `
    )
    .eq('id', validOfferId)
    .maybeSingle();

  if (offerError) {
    logger.error('[offers] acceptOffer offer lookup failed:', offerError.code);
    return { success: false, error: 'Không thể tải thông tin đề nghị. Vui lòng thử lại.' };
  }

  if (!offer) {
    return { success: false, error: 'Đề nghị không tồn tại.' };
  }

  // The Supabase JS client returns to-one FK joins as an object at runtime.
  const parentRequest = (offer.aid_requests as unknown) as {
    id: string;
    requester_id: string;
    status: string;
  } | null;

  if (!parentRequest) {
    logger.error('[offers] acceptOffer: parent request not found for offer', validOfferId);
    return { success: false, error: 'Không tìm thấy yêu cầu gốc.' };
  }

  // --- 4. Ownership guard ---
  if (parentRequest.requester_id !== user.id) {
    return { success: false, error: 'Chỉ người nhờ mới có thể chấp nhận.' };
  }

  // --- 5. Status guard — prevent double-accept ---
  if (parentRequest.status === 'matched') {
    return { success: false, error: 'Yêu cầu này đã được nhận rồi.' };
  }
  if (parentRequest.status !== 'open') {
    return { success: false, error: 'Yêu cầu đã đóng hoặc bị huỷ.' };
  }

  const requestId = parentRequest.id;

  // --- 6. Accept the chosen offer ---
  const { error: acceptError } = await supabase
    .from('help_offers')
    .update({ status: 'accepted' })
    .eq('id', validOfferId);

  if (acceptError) {
    logger.error('[offers] acceptOffer update offer failed:', acceptError.code);
    return { success: false, error: 'Không thể chấp nhận đề nghị. Vui lòng thử lại.' };
  }

  // --- 7. Mark aid request as matched ---
  const { error: requestUpdateError } = await supabase
    .from('aid_requests')
    .update({ status: 'matched' })
    .eq('id', requestId)
    .eq('requester_id', user.id); // double-check: only the requester's request

  if (requestUpdateError) {
    logger.error('[offers] acceptOffer update request failed:', requestUpdateError.code);
    return { success: false, error: 'Không thể cập nhật trạng thái yêu cầu. Vui lòng thử lại.' };
  }

  // --- 8. Decline all other pending offers for this request ---
  // Constitution Principle 3: declined offers stored in DB but NEVER shown to
  // helpers. Batch update in a single query — no need to return row data.
  const { error: declineError } = await supabase
    .from('help_offers')
    .update({ status: 'declined' })
    .eq('request_id', requestId)
    .eq('status', 'pending') // only touch pending ones; skip already-accepted
    .neq('id', validOfferId); // do not accidentally re-update the accepted offer

  if (declineError) {
    // Non-fatal: the accept and request status update already succeeded.
    // Log and continue — declined-offer cleanup is best-effort.
    logger.error('[offers] acceptOffer decline other offers failed:', declineError.code);
  }

  // --- 9. Fire-and-forget: notify helper via notify-circle Edge Function ---
  // type='helper_confirmed' → Edge Function sends notification to the accepted helper.
  // Fire-and-forget: notification failure must NOT block the accept response.
  triggerHelperConfirmedNotification({
    requestId,
    offerId: validOfferId,
  }).catch((err: unknown) => {
    logger.error('[offers] acceptOffer notify-circle trigger failed:', (err as Error).message);
  });

  return { success: true, data: { accepted: true } };
}

// ---------------------------------------------------------------------------
// triggerHelperConfirmedNotification (internal helper)
// ---------------------------------------------------------------------------

/**
 * Calls the notify-circle Edge Function with type='helper_confirmed' after
 * an offer is accepted. Fire-and-forget — callers must .catch().
 */
async function triggerHelperConfirmedNotification(payload: {
  requestId: string;
  offerId: string;
}): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    logger.error('[offers] triggerHelperConfirmedNotification: missing env vars — skipping');
    return;
  }

  const url = `${supabaseUrl}/functions/v1/notify-circle`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      type: 'helper_confirmed',
      record: {
        request_id: payload.requestId,
        offer_id:   payload.offerId,
      },
    }),
  });

  if (!res.ok) {
    logger.error(
      `[offers] notify-circle (helper_confirmed) returned HTTP ${res.status}`
    );
  }
}
