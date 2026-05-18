'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/lib/types';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const savePushSubscriptionSchema = z.object({
  endpoint: z.string().url('Endpoint không hợp lệ.'),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

const saveLINEUserIdSchema = z.object({
  lineUserId: z.string().min(1).max(100),
});

// ---------------------------------------------------------------------------
// savePushSubscription
// ---------------------------------------------------------------------------

/**
 * Upserts a Web Push subscription for the authenticated user.
 *
 * Security model:
 *   - Auth guard: unauthenticated callers rejected.
 *   - RLS "push_self" ensures a user can only upsert rows where user_id = auth.uid().
 *   - Upsert on (user_id, endpoint) unique constraint — prevents duplicate rows
 *     when the same browser re-subscribes with the same endpoint.
 *
 * Column mapping note:
 *   keys.auth → auth_key  (DB column; 'auth' is a reserved word in Postgres)
 */
export async function savePushSubscription(
  input: unknown
): Promise<ActionResult<{ saved: boolean }>> {
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
  const parsed = savePushSubscriptionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Thông tin subscription không hợp lệ.' };
  }

  const { endpoint, keys } = parsed.data;

  // --- 3. Upsert subscription ---
  // On conflict (user_id, endpoint): update p256dh and auth_key to handle
  // re-subscription scenarios where the push service rotates keys.
  const { error: upsertError } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id: user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth_key: keys.auth,
      },
      { onConflict: 'user_id,endpoint' }
    );

  if (upsertError) {
    logger.error('[notifications] savePushSubscription upsert failed:', upsertError.code);
    return { success: false, error: 'Không thể lưu subscription. Vui lòng thử lại.' };
  }

  return { success: true, data: { saved: true } };
}

// ---------------------------------------------------------------------------
// saveLINEUserId
// ---------------------------------------------------------------------------

/**
 * Stores the LINE user ID on the authenticated user's profile.
 *
 * This is called either:
 *   a) by the LINE webhook handler after a "follow" event, or
 *   b) directly by the user in Settings (future Sprint 7 flow).
 *
 * Security model:
 *   - Auth guard: unauthenticated callers rejected.
 *   - RLS "profiles_update_self" ensures the user can only update their own row.
 *   - line_user_id is stored only in profiles (not any other table — Constitution).
 *
 * PII note: line_user_id is an opaque identifier from LINE — not logged at INFO.
 */
export async function saveLINEUserId(
  input: unknown
): Promise<ActionResult<{ saved: boolean }>> {
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
  const parsed = saveLINEUserIdSchema.safeParse(
    typeof input === 'string' ? { lineUserId: input } : input
  );
  if (!parsed.success) {
    return { success: false, error: 'LINE user ID không hợp lệ.' };
  }

  // --- 3. Update profile ---
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ line_user_id: parsed.data.lineUserId })
    .eq('id', user.id);

  if (updateError) {
    logger.error('[notifications] saveLINEUserId update failed:', updateError.code);
    return { success: false, error: 'Không thể lưu LINE ID. Vui lòng thử lại.' };
  }

  return { success: true, data: { saved: true } };
}
