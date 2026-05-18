import { describe, it, expect } from 'vitest';
import { profileCreateSchema, profileUpdateSchema } from '@/lib/schemas/profiles';

describe('profileCreateSchema', () => {
  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  it('accepts valid display_name with avatar_emoji', () => {
    const result = profileCreateSchema.safeParse({
      display_name: 'Nhà Anh Tuấn',
      avatar_emoji: '👨‍👩‍👧',
    });
    expect(result.success).toBe(true);
  });

  it('accepts display_name alone — kids_desc and location are optional', () => {
    const result = profileCreateSchema.safeParse({ display_name: 'Gia đình Lan' });
    expect(result.success).toBe(true);
  });

  it('provides default avatar_emoji when omitted', () => {
    const result = profileCreateSchema.safeParse({ display_name: 'Nhà Bình' });
    expect(result.success).toBe(true);
    if (result.success) {
      // Default must exist so a profile always has an emoji — absence would
      // break the avatar UI which assumes a non-empty string.
      expect(result.data.avatar_emoji).toBe('👨‍👩‍👧');
    }
  });

  it('accepts optional kids_desc within 100 characters', () => {
    const result = profileCreateSchema.safeParse({
      display_name: 'Nhà Minh',
      kids_desc: 'Con gái 3 tuổi, con trai 6 tuổi',
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional location within 50 characters', () => {
    const result = profileCreateSchema.safeParse({
      display_name: 'Nhà Minh',
      location: 'Yokohama',
    });
    expect(result.success).toBe(true);
  });

  it('accepts display_name at exactly 2 characters (minimum boundary)', () => {
    const result = profileCreateSchema.safeParse({ display_name: 'AB' });
    expect(result.success).toBe(true);
  });

  it('accepts display_name at exactly 50 characters (maximum boundary)', () => {
    const result = profileCreateSchema.safeParse({
      display_name: 'A'.repeat(50),
    });
    expect(result.success).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // display_name validation failures
  // ---------------------------------------------------------------------------

  it('rejects empty display_name', () => {
    const result = profileCreateSchema.safeParse({ display_name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects display_name of 1 character (below min 2)', () => {
    const result = profileCreateSchema.safeParse({ display_name: 'A' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.display_name?.[0]).toContain('ít nhất 2');
    }
  });

  it('rejects display_name exceeding 50 characters', () => {
    const result = profileCreateSchema.safeParse({
      display_name: 'A'.repeat(51),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.display_name?.[0]).toContain('50 ký tự');
    }
  });

  // ---------------------------------------------------------------------------
  // kids_desc validation failures
  // ---------------------------------------------------------------------------

  it('rejects kids_desc exceeding 100 characters', () => {
    const result = profileCreateSchema.safeParse({
      display_name: 'Nhà Tuấn',
      kids_desc: 'X'.repeat(101),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.kids_desc?.[0]).toContain('100 ký tự');
    }
  });

  it('accepts kids_desc at exactly 100 characters (boundary)', () => {
    const result = profileCreateSchema.safeParse({
      display_name: 'Nhà Tuấn',
      kids_desc: 'X'.repeat(100),
    });
    expect(result.success).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // location validation
  // ---------------------------------------------------------------------------

  it('rejects location exceeding 50 characters', () => {
    const result = profileCreateSchema.safeParse({
      display_name: 'Nhà Tuấn',
      location: 'Y'.repeat(51),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.location?.[0]).toContain('50 ký tự');
    }
  });
});

// ---------------------------------------------------------------------------
// profileUpdateSchema — all fields optional (partial)
// ---------------------------------------------------------------------------

describe('profileUpdateSchema', () => {
  it('accepts empty object (partial update with no fields is valid at schema level)', () => {
    // WHY: partial() makes every field optional. Empty update is allowed by the
    // schema; the action layer rejects it separately to avoid silent no-ops.
    const result = profileUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts a subset update with only display_name', () => {
    const result = profileUpdateSchema.safeParse({ display_name: 'Nhà Mới' });
    expect(result.success).toBe(true);
  });

  it('still rejects display_name that is 1 character (constraint preserved in partial)', () => {
    const result = profileUpdateSchema.safeParse({ display_name: 'X' });
    expect(result.success).toBe(false);
  });
});
