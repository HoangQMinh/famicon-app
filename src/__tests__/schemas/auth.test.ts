import { describe, it, expect } from 'vitest';
import { emailSchema, otpSchema } from '@/lib/schemas/auth';

// ---------------------------------------------------------------------------
// emailSchema
// ---------------------------------------------------------------------------

describe('emailSchema', () => {
  // --- Valid inputs ---

  it('accepts a standard email address', () => {
    const result = emailSchema.safeParse({ email: 'test@example.com' });
    expect(result.success).toBe(true);
  });

  it('accepts an email with plus-tag (common for Gmail filtering)', () => {
    // Japanese families often use +tag Gmail addresses
    const result = emailSchema.safeParse({ email: 'user+tag@domain.co.jp' });
    expect(result.success).toBe(true);
  });

  it('accepts a .jp TLD address', () => {
    const result = emailSchema.safeParse({ email: 'family@example.jp' });
    expect(result.success).toBe(true);
  });

  // --- Invalid inputs --- (edge cases first)

  it('rejects an empty string — empty input is the most common user mistake', () => {
    const result = emailSchema.safeParse({ email: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a string with no @ character', () => {
    const result = emailSchema.safeParse({ email: 'notanemail' });
    expect(result.success).toBe(false);
  });

  it('rejects an address with no local part (starts with @)', () => {
    // Boundary: @ present but local part missing
    const result = emailSchema.safeParse({ email: '@nodomain' });
    expect(result.success).toBe(false);
  });

  it('rejects an address with no domain after @', () => {
    // Boundary: @ present but domain part missing
    const result = emailSchema.safeParse({ email: 'no@' });
    expect(result.success).toBe(false);
  });

  it('rejects undefined (missing field)', () => {
    const result = emailSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects null as email value', () => {
    const result = emailSchema.safeParse({ email: null });
    expect(result.success).toBe(false);
  });

  it('returns a Vietnamese error message for invalid email', () => {
    const result = emailSchema.safeParse({ email: 'bad' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailErrors = result.error.flatten().fieldErrors.email;
      expect(emailErrors).toBeDefined();
      expect(emailErrors![0]).toBe('Email không hợp lệ');
    }
  });
});

// ---------------------------------------------------------------------------
// otpSchema
// ---------------------------------------------------------------------------

describe('otpSchema', () => {
  // --- Valid inputs ---

  it('accepts a valid email + 6-digit numeric token', () => {
    const result = otpSchema.safeParse({
      email: 'test@example.com',
      token: '123456',
    });
    expect(result.success).toBe(true);
  });

  it('accepts token composed entirely of zeros (edge: all-zero is still valid)', () => {
    const result = otpSchema.safeParse({
      email: 'test@example.com',
      token: '000000',
    });
    expect(result.success).toBe(true);
  });

  // --- Invalid token: length boundaries ---

  it('rejects token shorter than 6 digits', () => {
    const result = otpSchema.safeParse({
      email: 'test@example.com',
      token: '12345',
    });
    expect(result.success).toBe(false);
  });

  it('rejects token longer than 6 digits', () => {
    const result = otpSchema.safeParse({
      email: 'test@example.com',
      token: '1234567',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty token', () => {
    const result = otpSchema.safeParse({
      email: 'test@example.com',
      token: '',
    });
    expect(result.success).toBe(false);
  });

  // --- Invalid token: character type ---

  it('rejects token containing letters (OTP must be numeric only)', () => {
    const result = otpSchema.safeParse({
      email: 'test@example.com',
      token: 'abc123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects token with spaces', () => {
    // User may accidentally paste "1 2 3 4 5 6"
    const result = otpSchema.safeParse({
      email: 'test@example.com',
      token: '12 456',
    });
    expect(result.success).toBe(false);
  });

  it('rejects token with special characters', () => {
    const result = otpSchema.safeParse({
      email: 'test@example.com',
      token: '12-456',
    });
    expect(result.success).toBe(false);
  });

  // --- Invalid email in OTP context ---

  it('rejects invalid email even when token is valid', () => {
    const result = otpSchema.safeParse({
      email: 'notvalid',
      token: '123456',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing token field', () => {
    const result = otpSchema.safeParse({ email: 'test@example.com' });
    expect(result.success).toBe(false);
  });

  it('rejects missing email field', () => {
    const result = otpSchema.safeParse({ token: '123456' });
    expect(result.success).toBe(false);
  });

  it('returns the correct Vietnamese error message for wrong token length', () => {
    const result = otpSchema.safeParse({
      email: 'test@example.com',
      token: '12345',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const tokenErrors = result.error.flatten().fieldErrors.token;
      expect(tokenErrors).toBeDefined();
      expect(tokenErrors![0]).toBe('OTP phải đúng 6 chữ số');
    }
  });

  it('returns the correct Vietnamese error message for non-numeric token', () => {
    const result = otpSchema.safeParse({
      email: 'test@example.com',
      token: 'abcdef',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const tokenErrors = result.error.flatten().fieldErrors.token;
      expect(tokenErrors).toBeDefined();
      // Zod reports the first failing rule. For 'abcdef' (length=6, not numeric),
      // the regex error fires.
      expect(tokenErrors![0]).toBe('OTP chỉ gồm chữ số');
    }
  });
});
