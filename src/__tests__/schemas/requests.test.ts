/**
 * Unit tests for Zod schemas in src/lib/schemas/requests.ts.
 *
 * WHY these tests exist:
 *  - aidRequestCategorySchema guards against invalid categories entering display
 *    logic (the enum drives emoji mapping — wrong value = broken UI).
 *  - aidRequestStatusSchema prevents displaying requests with invalid status
 *    which could bypass the 'open' filter assumption in the feed.
 *  - aidRequestDisplaySchema validates full DB rows before mapping — catches
 *    schema drift between DB migrations and TypeScript types early.
 *
 * Edge cases first: invalid enum values are more likely to regress silently
 * (typo in migration, renamed value) than missing required fields.
 */

import { describe, it, expect } from 'vitest';
import {
  aidRequestCategorySchema,
  aidRequestStatusSchema,
  aidRequestDisplaySchema,
} from '@/lib/schemas/requests';

// ---------------------------------------------------------------------------
// aidRequestCategorySchema
// ---------------------------------------------------------------------------

describe('aidRequestCategorySchema', () => {
  // --- Valid values ---

  it('accepts "pickup" category', () => {
    const result = aidRequestCategorySchema.safeParse('pickup');
    expect(result.success).toBe(true);
  });

  it('accepts "ride" category', () => {
    const result = aidRequestCategorySchema.safeParse('ride');
    expect(result.success).toBe(true);
  });

  it('accepts "childcare" category', () => {
    const result = aidRequestCategorySchema.safeParse('childcare');
    expect(result.success).toBe(true);
  });

  it('accepts "borrow" category', () => {
    const result = aidRequestCategorySchema.safeParse('borrow');
    expect(result.success).toBe(true);
  });

  it('accepts "other" category', () => {
    const result = aidRequestCategorySchema.safeParse('other');
    expect(result.success).toBe(true);
  });

  // --- Invalid values (edge cases first) ---

  it('rejects "shopping" — not in enum', () => {
    /**
     * WHY: "shopping" is a plausible category name that could be added later
     * without updating the schema. Explicit rejection prevents silent passthrough.
     */
    const result = aidRequestCategorySchema.safeParse('shopping');
    expect(result.success).toBe(false);
  });

  it('rejects "dropoff" — not in DB CHECK constraint, canonical value is "ride"', () => {
    /**
     * WHY: DB constraint uses 'ride', not 'dropoff'. Accepting 'dropoff' would
     * cause an insert to fail at the DB layer. This test catches any future
     * regression that re-introduces 'dropoff' into the Zod enum.
     */
    const result = aidRequestCategorySchema.safeParse('dropoff');
    expect(result.success).toBe(false);
  });

  it('rejects empty string', () => {
    const result = aidRequestCategorySchema.safeParse('');
    expect(result.success).toBe(false);
  });

  it('rejects uppercase "PICKUP" — enum is case-sensitive', () => {
    /**
     * WHY: DB values are lowercase. If a bug uppercases them before parsing,
     * this test catches it instead of silently breaking emoji mapping.
     */
    const result = aidRequestCategorySchema.safeParse('PICKUP');
    expect(result.success).toBe(false);
  });

  it('rejects null', () => {
    const result = aidRequestCategorySchema.safeParse(null);
    expect(result.success).toBe(false);
  });

  it('rejects undefined', () => {
    const result = aidRequestCategorySchema.safeParse(undefined);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// aidRequestStatusSchema
// ---------------------------------------------------------------------------

describe('aidRequestStatusSchema', () => {
  // --- Valid values ---

  it('accepts "open" status', () => {
    const result = aidRequestStatusSchema.safeParse('open');
    expect(result.success).toBe(true);
  });

  it('accepts "matched" status', () => {
    const result = aidRequestStatusSchema.safeParse('matched');
    expect(result.success).toBe(true);
  });

  it('accepts "closed" status', () => {
    const result = aidRequestStatusSchema.safeParse('closed');
    expect(result.success).toBe(true);
  });

  it('accepts "cancelled" status', () => {
    const result = aidRequestStatusSchema.safeParse('cancelled');
    expect(result.success).toBe(true);
  });

  // --- Invalid values (edge cases first) ---

  it('rejects "active" — plausible alias that is NOT in enum', () => {
    /**
     * WHY: "active" sounds synonymous with "open" but is not. Silent acceptance
     * would break feed filtering which explicitly checks status='open'.
     */
    const result = aidRequestStatusSchema.safeParse('active');
    expect(result.success).toBe(false);
  });

  it('rejects "pending" — not in status enum', () => {
    const result = aidRequestStatusSchema.safeParse('pending');
    expect(result.success).toBe(false);
  });

  it('rejects empty string', () => {
    const result = aidRequestStatusSchema.safeParse('');
    expect(result.success).toBe(false);
  });

  it('rejects uppercase "OPEN"', () => {
    const result = aidRequestStatusSchema.safeParse('OPEN');
    expect(result.success).toBe(false);
  });

  it('rejects null', () => {
    const result = aidRequestStatusSchema.safeParse(null);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// aidRequestDisplaySchema — full object validation
// ---------------------------------------------------------------------------

describe('aidRequestDisplaySchema', () => {
  // Proper UUIDv4 format — Zod v4 validates version nibble (must be 1-8).
  // All-zeros or sequential IDs like 00000000-...-000001 fail because version nibble = '0'.
  const VALID_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  const validRow = {
    id: VALID_UUID,
    circle_id: VALID_UUID,
    requester_id: VALID_UUID,
    category: 'pickup',
    description: 'Cần ai đón con từ trường về nhà lúc 15h',
    scheduled_at: '2026-05-20T08:00:00Z',
    location: 'Edogawa, Tokyo',
    is_urgent: false,
    status: 'open',
    created_at: '2026-05-17T10:00:00Z',
  };

  // --- Happy path ---

  it('accepts a fully valid aid request row', () => {
    const result = aidRequestDisplaySchema.safeParse(validRow);
    expect(result.success).toBe(true);
  });

  it('accepts null for scheduled_at (optional field)', () => {
    const result = aidRequestDisplaySchema.safeParse({
      ...validRow,
      scheduled_at: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts null for location (optional field)', () => {
    const result = aidRequestDisplaySchema.safeParse({
      ...validRow,
      location: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts is_urgent = true', () => {
    const result = aidRequestDisplaySchema.safeParse({
      ...validRow,
      is_urgent: true,
    });
    expect(result.success).toBe(true);
  });

  it('accepts status = "closed" (valid status even if not shown in feed)', () => {
    /**
     * WHY: The schema validates display data. A closed request is valid data;
     * the action layer filters it out with .eq('status', 'open'). Schema must
     * not conflate display validation with business rules.
     */
    const result = aidRequestDisplaySchema.safeParse({
      ...validRow,
      status: 'closed',
    });
    expect(result.success).toBe(true);
  });

  // --- Invalid: ID fields ---

  it('rejects non-UUID id', () => {
    const result = aidRequestDisplaySchema.safeParse({
      ...validRow,
      id: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-UUID circle_id', () => {
    const result = aidRequestDisplaySchema.safeParse({
      ...validRow,
      circle_id: 'circle-A',
    });
    expect(result.success).toBe(false);
  });

  // --- Invalid: enum fields ---

  it('rejects invalid category in full object context', () => {
    const result = aidRequestDisplaySchema.safeParse({
      ...validRow,
      category: 'shopping',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid status in full object context', () => {
    const result = aidRequestDisplaySchema.safeParse({
      ...validRow,
      status: 'active',
    });
    expect(result.success).toBe(false);
  });

  // --- Invalid: missing required fields ---

  it('rejects missing description', () => {
    const { description: _desc, ...withoutDescription } = validRow;
    const result = aidRequestDisplaySchema.safeParse(withoutDescription);
    expect(result.success).toBe(false);
  });

  it('rejects missing is_urgent', () => {
    const { is_urgent: _urgent, ...withoutUrgent } = validRow;
    const result = aidRequestDisplaySchema.safeParse(withoutUrgent);
    expect(result.success).toBe(false);
  });

  it('rejects non-boolean is_urgent (e.g. string "true")', () => {
    /**
     * WHY: DB might return "t"/"f" strings in some Supabase client versions.
     * Catching this here prevents a silent truthy check passing for a non-urgent request.
     */
    const result = aidRequestDisplaySchema.safeParse({
      ...validRow,
      is_urgent: 'true',
    });
    expect(result.success).toBe(false);
  });
});
