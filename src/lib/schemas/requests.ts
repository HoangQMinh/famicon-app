import { z } from 'zod';

// ---------------------------------------------------------------------------
// Enum schemas — values must match DB CHECK constraints in aid_requests table
// ---------------------------------------------------------------------------

/**
 * Aid request category values — matches DB CHECK constraint exactly:
 * category in ('pickup', 'borrow', 'childcare', 'ride', 'other')
 */
export const aidRequestCategorySchema = z.enum([
  'pickup',
  'ride',
  'childcare',
  'borrow',
  'other',
]);

export const aidRequestStatusSchema = z.enum([
  'open',
  'matched',
  'closed',
  'cancelled',
]);

// ---------------------------------------------------------------------------
// Display schema — used for reading/displaying aid requests in the feed.
// Does NOT include a create schema (Sprint 4).
//
// Note: The DB table does not have a 'title' column. The requester_name and
// requester_emoji are joined from the profiles table, not stored in aid_requests.
// ---------------------------------------------------------------------------

export const aidRequestDisplaySchema = z.object({
  id: z.string().uuid(),
  circle_id: z.string().uuid(),
  requester_id: z.string().uuid(),
  category: aidRequestCategorySchema,
  description: z.string(),
  scheduled_at: z.string().nullable(),
  location: z.string().nullable(),
  is_urgent: z.boolean(),
  status: aidRequestStatusSchema,
  created_at: z.string(),
});

export type AidRequestDisplay = z.infer<typeof aidRequestDisplaySchema>;

// ---------------------------------------------------------------------------
// newRequestSchema — used by createRequest Server Action (Sprint 4)
// Category enum must match DB CHECK constraint exactly.
// scheduled_at is free text (e.g. "Hôm nay lúc 15:30") — not parsed as Date.
// ---------------------------------------------------------------------------

export const newRequestSchema = z.object({
  circle_id: z.string().uuid(),
  category: z.enum(['pickup', 'borrow', 'childcare', 'ride', 'other']),
  description: z.string().min(5).max(200),
  scheduled_at: z.string().min(1),
  location: z.string().min(1),
  is_urgent: z.boolean().default(false),
});

export type NewRequestInput = z.infer<typeof newRequestSchema>;

// ---------------------------------------------------------------------------
// Sprint 7 schemas — request detail and offer operations
// ---------------------------------------------------------------------------

/**
 * Input schema for getRequestDetail — validates the requestId param.
 */
export const requestDetailParamSchema = z.object({
  requestId: z.string().uuid(),
});

/**
 * Output shape for getRequestDetail (used for runtime validation in tests).
 * location_text maps to the DB column 'location'.
 * Does NOT include line_user_id — privacy rule (Constitution Principle 9).
 */
export const requestDetailSchema = z.object({
  id: z.string().uuid(),
  circle_id: z.string().uuid(),
  requester_id: z.string().uuid(),
  category: aidRequestCategorySchema,
  description: z.string(),
  scheduled_at: z.string().nullable(),
  location_text: z.string().nullable(),
  is_urgent: z.boolean(),
  status: aidRequestStatusSchema,
  created_at: z.string(),
  requester_name: z.string(),
});

/**
 * Input schema for createOffer — requestId must be a valid UUID.
 */
export const offerCreateSchema = z.object({
  requestId: z.string().uuid(),
});

/**
 * Input schema for acceptOffer — offerId must be a valid UUID.
 */
export const offerAcceptSchema = z.object({
  offerId: z.string().uuid(),
});
