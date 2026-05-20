/**
 * Unit tests for Sprint 8 profile schemas:
 *   - profileUpdateSchema
 *   - avatarUploadSchema
 *   - membersQuerySchema
 *
 * WHY these edge cases matter:
 *  - profileUpdateSchema guards updateProfile. An invalid help_tag value reaching
 *    the DB would violate the CHECK constraint (same enum as aid_requests.category).
 *    An empty payload must be caught early — the action rejects it, but schema tests
 *    document the partial-update contract.
 *  - avatarUploadSchema is the only server-side size/type gate before Supabase Storage.
 *    A missed boundary (exactly 2MB) or a missed type (image/gif) would let bad files
 *    through, wasting bandwidth or storing invalid data.
 *  - membersQuerySchema prevents non-UUID circleId values from reaching DB queries
 *    and causing cryptic "invalid input syntax for type uuid" Postgres errors.
 *
 * Edge cases tested first per tester agent convention.
 */

import { describe, it, expect } from 'vitest';
import { profileUpdateSchema, avatarUploadSchema } from '@/lib/schemas/profiles';
import { membersQuerySchema } from '@/lib/schemas/members';

const VALID_UUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

// ---------------------------------------------------------------------------
// profileUpdateSchema
// ---------------------------------------------------------------------------

describe('profileUpdateSchema', () => {
  // --- Edge cases first ---

  it('rejects display_name shorter than 2 characters', () => {
    /**
     * WHY: A 1-character name is likely a typo or test input. The schema must
     * reject it so the user gets a clear Vietnamese error message rather than a
     * DB-level constraint violation.
     */
    const result = profileUpdateSchema.safeParse({ display_name: 'A' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = Object.values(result.error.flatten().fieldErrors).flat();
      expect(errors.some(e => e.includes('ký tự'))).toBe(true);
    }
  });

  it('rejects help_tags containing invalid enum value', () => {
    /**
     * WHY: "cooking" is not a valid help tag — the enum only allows
     * ['pickup', 'childcare', 'ride', 'meal', 'other']. An invalid value
     * reaching the DB would violate the CHECK constraint on profiles.help_tags.
     */
    const result = profileUpdateSchema.safeParse({ help_tags: ['pickup', 'cooking'] });
    expect(result.success).toBe(false);
  });

  it('accepts empty payload {} — valid partial update (action rejects this later)', () => {
    /**
     * WHY: The schema is "partial" — all fields are optional. An empty object
     * is structurally valid here. The action layer (updateProfile) rejects
     * empty payloads with its own check. Schema must not double-reject.
     */
    const result = profileUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts empty help_tags array — 0 tags is a valid state', () => {
    /**
     * WHY: A user may want to clear all their help tags. Empty array must be
     * accepted so the client can send a "clear all" update.
     */
    const result = profileUpdateSchema.safeParse({ help_tags: [] });
    expect(result.success).toBe(true);
  });

  // --- Happy path ---

  it('accepts full valid update payload', () => {
    const result = profileUpdateSchema.safeParse({
      display_name: 'Lan Anh',
      location: 'Edogawa',
      kids_desc: 'Bé 3 tuổi',
      help_tags: ['pickup', 'childcare'],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.display_name).toBe('Lan Anh');
      expect(result.data.help_tags).toEqual(['pickup', 'childcare']);
    }
  });

  it('accepts partial update — only display_name', () => {
    const result = profileUpdateSchema.safeParse({ display_name: 'Lan Anh' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.display_name).toBe('Lan Anh');
    }
  });

  it('accepts partial update — only help_tags', () => {
    const result = profileUpdateSchema.safeParse({ help_tags: ['other'] });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.help_tags).toEqual(['other']);
    }
  });

  it('accepts all 5 valid help_tags simultaneously', () => {
    /**
     * WHY: A user who can help with everything should be able to select all 5.
     * Verify no artificial cap is enforced at schema level.
     */
    const result = profileUpdateSchema.safeParse({
      help_tags: ['pickup', 'childcare', 'ride', 'meal', 'other'],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.help_tags).toHaveLength(5);
    }
  });
});

// ---------------------------------------------------------------------------
// avatarUploadSchema
// ---------------------------------------------------------------------------

describe('avatarUploadSchema', () => {
  const MAX_SIZE = 2 * 1024 * 1024; // 2MB exactly

  // --- Edge cases first ---

  it('rejects file exceeding 2MB (2MB + 1 byte)', () => {
    /**
     * WHY: Files just over the limit are the most likely to slip through if the
     * boundary check uses > instead of >=. Test exactly 1 byte over.
     */
    const result = avatarUploadSchema.safeParse({
      file_size: MAX_SIZE + 1,
      file_type: 'image/jpeg',
    });
    expect(result.success).toBe(false);
  });

  it('rejects PDF file type — not an image', () => {
    /**
     * WHY: A user might accidentally select a PDF from their file picker.
     * This must be caught server-side, not just client-side.
     */
    const result = avatarUploadSchema.safeParse({
      file_size: 100,
      file_type: 'application/pdf',
    });
    expect(result.success).toBe(false);
  });

  it('rejects text/plain file type', () => {
    const result = avatarUploadSchema.safeParse({
      file_size: 100,
      file_type: 'text/plain',
    });
    expect(result.success).toBe(false);
  });

  // --- Boundary tests ---

  it('accepts file exactly at 2MB boundary — inclusive limit', () => {
    /**
     * WHY: The boundary condition (exactly 2MB) must pass. A max() validator
     * allows the value equal to the limit. Failing here would cause valid
     * 2MB files to be rejected with a confusing error.
     */
    const result = avatarUploadSchema.safeParse({
      file_size: MAX_SIZE,
      file_type: 'image/jpeg',
    });
    expect(result.success).toBe(true);
  });

  // --- Happy path ---

  it('accepts valid JPEG at 1MB', () => {
    const result = avatarUploadSchema.safeParse({
      file_size: 1024 * 1024,
      file_type: 'image/jpeg',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid PNG at small size', () => {
    const result = avatarUploadSchema.safeParse({
      file_size: 500,
      file_type: 'image/png',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid WebP', () => {
    const result = avatarUploadSchema.safeParse({
      file_size: 800000,
      file_type: 'image/webp',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid GIF', () => {
    /**
     * WHY: GIF is a valid image format in the enum. Some users might upload
     * animated profile pictures — the schema must not reject them.
     */
    const result = avatarUploadSchema.safeParse({
      file_size: 1000,
      file_type: 'image/gif',
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// membersQuerySchema
// ---------------------------------------------------------------------------

describe('membersQuerySchema', () => {
  // --- Edge cases first ---

  it('rejects non-UUID string — would cause Postgres "invalid uuid" error', () => {
    /**
     * WHY: A malformed circleId (e.g. from a stale URL or dev error) must be
     * caught before the DB query. Postgres throws code 22P02 for invalid UUIDs
     * which surfaces as an opaque error to the user.
     */
    const result = membersQuerySchema.safeParse({ circleId: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('rejects empty string circleId', () => {
    /**
     * WHY: An empty string from an uninitialized client state is a common
     * programming mistake. Must be caught early.
     */
    const result = membersQuerySchema.safeParse({ circleId: '' });
    expect(result.success).toBe(false);
  });

  // --- Happy path ---

  it('accepts valid UUID circleId', () => {
    const result = membersQuerySchema.safeParse({ circleId: VALID_UUID });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.circleId).toBe(VALID_UUID);
    }
  });
});
