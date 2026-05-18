import { z } from 'zod';

/**
 * Schema for profile creation during onboarding.
 * Mirrors the non-system columns of the `profiles` table.
 * id and timestamps are supplied by the DB / server — not accepted from client.
 */
export const profileCreateSchema = z.object({
  display_name: z
    .string()
    .min(2, 'Tên hiển thị phải ít nhất 2 ký tự')
    .max(50, 'Tên hiển thị tối đa 50 ký tự'),
  avatar_emoji: z
    .string()
    .optional()
    .default('👨‍👩‍👧'),
  kids_desc: z
    .string()
    .max(100, 'Mô tả bé tối đa 100 ký tự')
    .optional(),
  location: z
    .string()
    .max(50, 'Địa điểm tối đa 50 ký tự')
    .optional(),
});

/**
 * Schema for profile updates — same shape, all fields optional
 * so partial updates are accepted without re-sending the whole profile.
 */
export const profileUpdateSchema = profileCreateSchema.partial();

export type ProfileCreateInput = z.infer<typeof profileCreateSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
