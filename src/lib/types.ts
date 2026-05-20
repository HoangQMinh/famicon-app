/**
 * Shared return type for all Server Actions.
 * Actions return a discriminated union — never throw raw errors to the client.
 */
export type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Profile types (Sprint 8)
// ---------------------------------------------------------------------------

/**
 * Profile data returned by getMyProfile().
 *
 * IMPORTANT: line_user_id is intentionally excluded from this type.
 * It must never be returned to the client (Constitution Principle 9 — privacy).
 * The server accesses line_user_id internally only (e.g., createOffer deeplink).
 */
export type ProfileData = {
  id: string;
  display_name: string;
  avatar_emoji: string | null;
  avatar_url: string | null;
  location: string | null;
  kids_desc: string | null;
  help_tags: string[] | null;
};

/**
 * Member profile shape returned by getCircleMembers().
 * Same fields as ProfileData — kept as a separate named type for clarity at call sites.
 *
 * IMPORTANT: line_user_id is intentionally excluded (Constitution Principle 9).
 * Contribution counts, offer counts, and any activity counters are also excluded
 * (Constitution Principle 2 — no ledger).
 * No admin/founder badge field (Constitution Principle 7).
 */
export type MemberProfile = {
  id: string;
  display_name: string;
  avatar_emoji: string | null;
  avatar_url: string | null;
  location: string | null;
  kids_desc: string | null;
  help_tags: string[] | null;
};

// ---------------------------------------------------------------------------
// Aid request types (Sprint 3)
// ---------------------------------------------------------------------------

/**
 * Aid request row joined with the requester's profile fields.
 * Returned by getCircleRequests — visible only to circle members (RLS enforced).
 *
 * Note: The DB aid_requests table does not have a 'title' column.
 * A display title is derived from 'category' on the frontend (e.g. categoryLabel(category)).
 * The 'location_text' field maps to the 'location' column in the DB.
 */
export type AidRequestWithProfile = {
  id: string;
  circle_id: string;
  requester_id: string;
  category: string;
  description: string;
  scheduled_at: string | null;
  location_text: string | null;   // DB column name: location
  is_urgent: boolean;
  status: string;
  created_at: string;
  requester_name: string;          // joined from profiles.display_name
  requester_emoji: string | null;  // joined from profiles.avatar_emoji
};

// ---------------------------------------------------------------------------
// Help offer types (Sprint 7)
// ---------------------------------------------------------------------------

/**
 * Row type for the help_offers table.
 * status reflects the offer lifecycle: pending → accepted | declined.
 *
 * NOTE: 'declined' offers are stored in DB but must NOT be shown to the
 * requester in the UI (Constitution Principle 3 — respect face).
 * Application layer is responsible for filtering declined offers from display.
 */
export type HelpOffer = {
  id: string;
  request_id: string;
  helper_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
};

/**
 * Full request detail returned by getRequestDetail().
 * Visible only to active circle members (RLS on aid_requests enforced).
 *
 * IMPORTANT: line_user_id of the requester is intentionally excluded —
 * it is only accessed internally by the createOffer Server Action to build
 * the LINE deeplink (Constitution Principle 9 — closed circle / privacy).
 *
 * location_text maps to the DB column 'location'.
 */
export type RequestDetail = {
  id: string;
  circle_id: string;
  requester_id: string;
  category: 'pickup' | 'borrow' | 'childcare' | 'ride' | 'other';
  description: string;
  scheduled_at: string | null;
  location_text: string | null;   // DB column name: location
  is_urgent: boolean;
  status: 'open' | 'matched' | 'closed' | 'cancelled';
  created_at: string;
  requester_name: string;          // joined from profiles.display_name
};
