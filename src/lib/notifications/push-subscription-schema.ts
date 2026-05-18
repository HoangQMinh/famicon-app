/**
 * Zod schema for Web Push subscription objects received from the browser's
 * PushManager.subscribe() call.
 *
 * Shared between:
 *   - savePushSubscription Server Action (validation)
 *   - Unit tests (schema/validation coverage)
 *
 * Constitution note: endpoint is a URL but must NOT be logged at INFO level
 * (it can be used to fingerprint a device).
 */

import { z } from 'zod';

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url('Endpoint không hợp lệ.'),
  keys: z.object({
    p256dh: z.string().min(1, 'p256dh không được rỗng.'),
    auth: z.string().min(1, 'auth key không được rỗng.'),
  }),
});

export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;
