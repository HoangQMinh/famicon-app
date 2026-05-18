import { z } from 'zod';

/**
 * Schema for the "send OTP" step — only needs a valid email address.
 */
export const emailSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
});

/**
 * Schema for the "verify OTP" step — email + 6-digit numeric token.
 */
export const otpSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  token: z
    .string()
    .length(6, 'OTP phải đúng 6 chữ số')
    .regex(/^\d+$/, 'OTP chỉ gồm chữ số'),
});

export type EmailInput = z.infer<typeof emailSchema>;
export type OtpInput = z.infer<typeof otpSchema>;
