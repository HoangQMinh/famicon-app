/**
 * Unit tests for newRequestSchema (src/lib/schemas/requests.ts) — Sprint 4.
 *
 * WHY these tests exist:
 *  - newRequestSchema is the server-side contract for createRequest. A schema
 *    regression (wrong enum, wrong length) bypasses the DB CHECK constraint
 *    check order and can cause either a rejected insert (bad UX) or a silently
 *    accepted invalid value (data integrity issue).
 *  - The 'dropoff' edge case is especially important: Sprint 3 had a bug where
 *    'dropoff' was in the Zod enum but NOT in the DB CHECK constraint. This
 *    test suite is the canonical guard against that class of regression.
 *  - canSubmit logic drives the Submit button disabled state — if wrong, users
 *    can submit empty forms or are blocked from submitting valid ones.
 *
 * Edge cases first: enum mismatches, boundary lengths, whitespace-only values.
 */

import { describe, it, expect } from 'vitest';
import { newRequestSchema } from '@/lib/schemas/requests';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Proper UUIDv4 — version nibble must be 4 (Zod v4 validates this)
const VALID_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

// A minimal valid base input — used as the foundation for edge case tests
const VALID_BASE = {
  circle_id: VALID_UUID,
  category: 'pickup' as const,
  description: 'abcde', // exactly 5 chars — min boundary
  scheduled_at: 'Hôm nay 5pm',
  location: 'Ga Yokohama',
  is_urgent: false,
};

// ---------------------------------------------------------------------------
// TC-4.1.1 — Happy path: fully valid input
// ---------------------------------------------------------------------------

describe('newRequestSchema — happy path', () => {
  it('accepts a fully valid input with all fields', () => {
    const result = newRequestSchema.safeParse({
      circle_id: VALID_UUID,
      category: 'pickup',
      description: 'Đón con từ trường Sakura lúc 5pm',
      scheduled_at: 'Hôm nay 5pm',
      location: 'Ga Yokohama',
      is_urgent: false,
    });
    expect(result.success).toBe(true);
  });

  it('accepts is_urgent = true', () => {
    const result = newRequestSchema.safeParse({ ...VALID_BASE, is_urgent: true });
    expect(result.success).toBe(true);
  });

  it('returns parsed data with correct shape on success', () => {
    const result = newRequestSchema.safeParse(VALID_BASE);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveProperty('circle_id');
      expect(result.data).toHaveProperty('category');
      expect(result.data).toHaveProperty('description');
      expect(result.data).toHaveProperty('scheduled_at');
      expect(result.data).toHaveProperty('location');
      expect(result.data).toHaveProperty('is_urgent');
    }
  });
});

// ---------------------------------------------------------------------------
// TC-4.1.10 — is_urgent: defaults to false when not provided
// ---------------------------------------------------------------------------

describe('newRequestSchema — is_urgent default', () => {
  it('defaults is_urgent to false when field is omitted', () => {
    /**
     * WHY: The form sends is_urgent only when user explicitly selects "Có".
     * If the field is missing from the payload, schema must default to false
     * rather than failing validation — omitting is_urgent should not block submission.
     */
    const { is_urgent: _omit, ...withoutUrgent } = VALID_BASE;
    const result = newRequestSchema.safeParse(withoutUrgent);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_urgent).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// TC-4.1.2 — Category enum: all 5 valid values
// ---------------------------------------------------------------------------

describe('newRequestSchema — category enum valid values', () => {
  const validCategories = ['pickup', 'borrow', 'childcare', 'ride', 'other'] as const;

  for (const cat of validCategories) {
    it(`accepts category "${cat}"`, () => {
      const result = newRequestSchema.safeParse({ ...VALID_BASE, category: cat });
      expect(result.success).toBe(true);
    });
  }
});

// ---------------------------------------------------------------------------
// TC-4.1.3 — Category enum: invalid values are rejected
// ---------------------------------------------------------------------------

describe('newRequestSchema — category enum invalid values (edge cases first)', () => {
  it('rejects "dropoff" — was an old enum value, must NOT exist in current schema', () => {
    /**
     * WHY: Sprint 3 had a critical bug where 'dropoff' was accepted by Zod but
     * rejected by the DB CHECK constraint, causing a silent insert failure.
     * The DB canonical enum is: ('pickup', 'borrow', 'childcare', 'ride', 'other').
     * 'dropoff' is explicitly NOT in it — this test is the regression guard.
     */
    const result = newRequestSchema.safeParse({ ...VALID_BASE, category: 'dropoff' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain('category');
    }
  });

  it('rejects empty string category', () => {
    const result = newRequestSchema.safeParse({ ...VALID_BASE, category: '' });
    expect(result.success).toBe(false);
  });

  it('rejects "shopping" — plausible but not in enum', () => {
    const result = newRequestSchema.safeParse({ ...VALID_BASE, category: 'shopping' });
    expect(result.success).toBe(false);
  });

  it('rejects "PICKUP" — enum is case-sensitive', () => {
    /**
     * WHY: DB values are lowercase. Uppercase from a form bug would fail the DB
     * CHECK constraint silently. Zod must catch this at the schema layer.
     */
    const result = newRequestSchema.safeParse({ ...VALID_BASE, category: 'PICKUP' });
    expect(result.success).toBe(false);
  });

  it('rejects null category', () => {
    const result = newRequestSchema.safeParse({ ...VALID_BASE, category: null });
    expect(result.success).toBe(false);
  });

  it('rejects undefined category', () => {
    const { category: _c, ...withoutCat } = VALID_BASE;
    const result = newRequestSchema.safeParse(withoutCat);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// TC-4.1.4 — Description: min length 5
// ---------------------------------------------------------------------------

describe('newRequestSchema — description length (min boundary)', () => {
  it('rejects description with 4 chars (below min)', () => {
    /**
     * WHY: 4 chars is the boundary just below min(5). A one-off error in the
     * Zod definition (e.g. min(4) instead of min(5)) would silently accept it.
     */
    const result = newRequestSchema.safeParse({ ...VALID_BASE, description: 'abcd' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain('description');
    }
  });

  it('accepts description with exactly 5 chars (min boundary)', () => {
    const result = newRequestSchema.safeParse({ ...VALID_BASE, description: 'abcde' });
    expect(result.success).toBe(true);
  });

  it('rejects empty string description', () => {
    const result = newRequestSchema.safeParse({ ...VALID_BASE, description: '' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// TC-4.1.5 — Description: max length 200
// ---------------------------------------------------------------------------

describe('newRequestSchema — description length (max boundary)', () => {
  it('accepts description with exactly 200 chars (max boundary)', () => {
    const desc200 = 'a'.repeat(200);
    const result = newRequestSchema.safeParse({ ...VALID_BASE, description: desc200 });
    expect(result.success).toBe(true);
  });

  it('rejects description with 201 chars (above max)', () => {
    const desc201 = 'a'.repeat(201);
    const result = newRequestSchema.safeParse({ ...VALID_BASE, description: desc201 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain('description');
    }
  });
});

// ---------------------------------------------------------------------------
// TC-4.1.7 — scheduled_at: cannot be empty
// ---------------------------------------------------------------------------

describe('newRequestSchema — scheduled_at', () => {
  it('rejects empty string scheduled_at', () => {
    /**
     * WHY: scheduled_at is free text (e.g. "Hôm nay 5pm"), not a Date object.
     * But it must not be empty — an empty scheduled_at would make the request
     * unactionable (helpers don't know when to show up).
     */
    const result = newRequestSchema.safeParse({ ...VALID_BASE, scheduled_at: '' });
    expect(result.success).toBe(false);
  });

  it('accepts a non-empty scheduled_at string', () => {
    const result = newRequestSchema.safeParse({ ...VALID_BASE, scheduled_at: 'Hôm nay 3pm' });
    expect(result.success).toBe(true);
  });

  it('rejects missing scheduled_at', () => {
    const { scheduled_at: _s, ...withoutScheduled } = VALID_BASE;
    const result = newRequestSchema.safeParse(withoutScheduled);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// TC-4.1.8 — location: cannot be empty
// ---------------------------------------------------------------------------

describe('newRequestSchema — location', () => {
  it('rejects empty string location', () => {
    /**
     * WHY: Location is required for helpers to know where to go. Empty location
     * would be accepted by z.string() without min(1) — this test confirms min(1)
     * is enforced.
     */
    const result = newRequestSchema.safeParse({ ...VALID_BASE, location: '' });
    expect(result.success).toBe(false);
  });

  it('accepts a non-empty location string', () => {
    const result = newRequestSchema.safeParse({ ...VALID_BASE, location: 'Ga Sakuragi-cho' });
    expect(result.success).toBe(true);
  });

  it('rejects missing location field', () => {
    const { location: _l, ...withoutLocation } = VALID_BASE;
    const result = newRequestSchema.safeParse(withoutLocation);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// TC-4.1.9 — circle_id: must be a valid UUID
// ---------------------------------------------------------------------------

describe('newRequestSchema — circle_id UUID validation', () => {
  it('rejects "not-a-uuid" circle_id', () => {
    /**
     * WHY: A non-UUID circle_id would reach the DB query builder and either
     * cause a SQL error or match no rows. The schema must reject it early with
     * a user-readable validation error instead of a cryptic DB error.
     */
    const result = newRequestSchema.safeParse({ ...VALID_BASE, circle_id: 'not-a-uuid' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain('circle_id');
    }
  });

  it('rejects empty string circle_id', () => {
    const result = newRequestSchema.safeParse({ ...VALID_BASE, circle_id: '' });
    expect(result.success).toBe(false);
  });

  it('rejects "circle-A" (human-readable id, not UUID)', () => {
    const result = newRequestSchema.safeParse({ ...VALID_BASE, circle_id: 'circle-A' });
    expect(result.success).toBe(false);
  });

  it('accepts a valid UUID v4 circle_id', () => {
    const result = newRequestSchema.safeParse({ ...VALID_BASE, circle_id: VALID_UUID });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// TC-4.2 — canSubmit logic (pure function — no Zod involved)
// ---------------------------------------------------------------------------

/**
 * canSubmit mirrors the client-side form submission gate:
 *   canSubmit = !!cat && detail.trim().length >= 5 && when.length > 0 && place.length > 0
 *
 * WHY test this separately from the schema:
 *  - canSubmit drives the disabled state of the Submit button (AC-4.4, AC-4.5).
 *  - It runs on every keystroke — must be fast and pure.
 *  - The schema runs server-side only. A bug in canSubmit means users can tap
 *    a disabled button (blocked) or double-submit (enabled when shouldn't be).
 */

function canSubmit(
  cat: string | null,
  detail: string,
  when: string,
  place: string
): boolean {
  return !!cat && detail.trim().length >= 5 && when.length > 0 && place.length > 0;
}

describe('canSubmit logic', () => {
  // TC-4.2.1 — All 4 fields filled → true
  it('returns true when all 4 required fields are present', () => {
    expect(canSubmit('pickup', 'Đón con lúc 5pm', 'Hôm nay 5pm', 'Ga Yokohama')).toBe(true);
  });

  // TC-4.2.2 — Missing category → false
  it('returns false when category is null', () => {
    expect(canSubmit(null, 'Đón con lúc 5pm', 'Hôm nay 5pm', 'Ga Yokohama')).toBe(false);
  });

  it('returns false when category is empty string', () => {
    expect(canSubmit('', 'Đón con lúc 5pm', 'Hôm nay 5pm', 'Ga Yokohama')).toBe(false);
  });

  // TC-4.2.3 — Missing description → false
  it('returns false when description is empty', () => {
    expect(canSubmit('pickup', '', 'Hôm nay 5pm', 'Ga Yokohama')).toBe(false);
  });

  // TC-4.2.4 — Whitespace-only description → false
  it('returns false when description is whitespace only', () => {
    /**
     * WHY: "   ".trim().length === 0, so whitespace-only must be treated as empty.
     * Without the .trim() check, a user could submit 5 spaces and pass canSubmit
     * but the server would then reject it with a validation error — confusing UX.
     */
    expect(canSubmit('pickup', '   ', 'Hôm nay 5pm', 'Ga Yokohama')).toBe(false);
    expect(canSubmit('pickup', '\t\n', 'Hôm nay 5pm', 'Ga Yokohama')).toBe(false);
  });

  // TC-4.2.4b — description length boundary (min 5 chars)
  it('returns false when description is 1 character (below 5-char minimum)', () => {
    /**
     * WHY: canSubmit requires detail.trim().length >= 5 to mirror the Zod schema
     * min(5) constraint. A single character is clearly insufficient information.
     */
    expect(canSubmit('pickup', 'a', 'Hôm nay 5pm', 'Ga Yokohama')).toBe(false);
  });

  it('returns false when description is 4 characters (below 5-char minimum)', () => {
    // WHY: 4 is one below the threshold — verifies the boundary is >= 5, not > 4.
    expect(canSubmit('pickup', 'abcd', 'Hôm nay 5pm', 'Ga Yokohama')).toBe(false);
  });

  it('returns true when description is exactly 5 characters (at minimum threshold)', () => {
    // WHY: 5 is the exact boundary value defined in the Zod schema min(5).
    // This test pins the >= 5 behavior and catches an off-by-one regression.
    expect(canSubmit('pickup', 'abcde', 'Hôm nay 5pm', 'Ga Yokohama')).toBe(true);
  });

  // TC-4.2.5 — Missing scheduled_at → false
  it('returns false when scheduled_at (when) is empty', () => {
    expect(canSubmit('pickup', 'Đón con lúc 5pm', '', 'Ga Yokohama')).toBe(false);
  });

  // TC-4.2.6 — Missing location → false
  it('returns false when location (place) is empty', () => {
    expect(canSubmit('pickup', 'Đón con lúc 5pm', 'Hôm nay 5pm', '')).toBe(false);
  });

  // TC-4.2.7 — is_urgent does not affect canSubmit
  it('returns true regardless of is_urgent value (urgent is optional)', () => {
    // is_urgent is not part of canSubmit — both urgent and non-urgent are valid
    expect(canSubmit('pickup', 'Đón con lúc 5pm', 'Hôm nay 5pm', 'Ga Yokohama')).toBe(true);
  });

  it('returns false when exactly 3 of 4 required fields are filled', () => {
    // Regression: ALL 4 must be present, not just 3
    expect(canSubmit('pickup', 'Đón con', '', 'Ga Yokohama')).toBe(false);
    expect(canSubmit('pickup', '', 'Hôm nay 5pm', 'Ga Yokohama')).toBe(false);
    expect(canSubmit('pickup', 'Đón con', 'Hôm nay 5pm', '')).toBe(false);
    expect(canSubmit(null, 'Đón con', 'Hôm nay 5pm', 'Ga Yokohama')).toBe(false);
  });
});
