/**
 * Pure notification helper functions — shared between Edge Functions and test suite.
 *
 * WHY a separate file: notify-circle/index.ts uses Deno.env and Deno.serve
 * which are not available in Vitest's Node.js environment. Extracting pure
 * functions here allows unit testing without any Deno dependency.
 *
 * Constitution constraints enforced here:
 *   - Quiet hours 22:00–07:00 JST (UTC+9) — non-urgent suppressed
 *   - Notification payload must NOT contain PII (no requester name, no address)
 *   - Urgent requests bypass both quiet hours and rate limit
 */

// ---------------------------------------------------------------------------
// Category labels
// ---------------------------------------------------------------------------

export const CATEGORY_LABELS: Record<string, string> = {
  pickup:    'đón xe / đưa đón',
  borrow:    'mượn đồ',
  childcare: 'trông trẻ',
  ride:      'đi nhờ xe',
  other:     'hỗ trợ',
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? 'hỗ trợ';
}

// ---------------------------------------------------------------------------
// Quiet hours
// ---------------------------------------------------------------------------

export interface QuietHoursOptions {
  /** When true, urgent requests bypass quiet hours enforcement. */
  isUrgent?: boolean;
}

/**
 * Returns true if the given UTC Date falls within JST quiet hours (22:00–07:00 JST).
 *
 * JST = UTC+9. Quiet window in UTC: 13:00–22:00 UTC.
 *   22:00 JST = 13:00 UTC
 *   07:00 JST = 22:00 UTC  (next day)
 *
 * When isUrgent = true, always returns false (urgent bypasses quiet hours).
 */
export function isQuietHoursJST(
  now: Date = new Date(),
  options: QuietHoursOptions = {}
): boolean {
  if (options.isUrgent) return false;

  const jstHour = (now.getUTCHours() + 9) % 24;
  return jstHour >= 22 || jstHour < 7;
}

// ---------------------------------------------------------------------------
// Rate limit check
// ---------------------------------------------------------------------------

export interface RateLimitDb {
  /** Returns the count of notifications sent to userId today (non-urgent). */
  countTodaySent(userId: string): Promise<number>;
}

/**
 * Returns true when a non-urgent notification should be suppressed due to
 * the daily rate limit (max 5 non-urgent per user per day).
 *
 * Urgent request type always returns false (bypasses rate limit).
 */
export async function isRateLimited(
  userId: string,
  type: string,
  db: RateLimitDb
): Promise<boolean> {
  // Urgent requests are never rate-limited (Constitution Nguyên tắc 4)
  if (type === 'urgent_request') return false;

  const count = await db.countTodaySent(userId);
  return count >= 5;
}

// ---------------------------------------------------------------------------
// LINE message formatter
// ---------------------------------------------------------------------------

export interface LineMessageInput {
  id: string;
  is_urgent: boolean;
  category: string;
  /** Not included in message body — description is free-text and may contain PII
   *  (names, addresses, phone numbers). Constitution: payload must not leak PII. */
  description?: string;
  requester_name?: string;
}

/**
 * Formats the LINE fallback message text.
 *
 * Constitution: message body must NOT contain description, requester name,
 * precise location, or any user-entered free text — all of which may contain PII.
 * Only structured data (category label) and the request URL are included.
 */
export function formatLineMessage(input: LineMessageInput): string {
  const urgentTag = input.is_urgent ? '[FAMICON 🆘 GẤP]\n' : '[FAMICON]\n';
  return `${urgentTag}Vòng tròn có yêu cầu mới: ${categoryLabel(input.category)}.\n\n→ Xem và giúp: https://famicon.app/requests/${input.id}`;
}
