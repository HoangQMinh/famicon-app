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
  // help_tags: 5 aid categories user can offer — aligns with aid_requests.category CHECK constraint.
  // Stored as text[] in DB; validated as enum on write to prevent arbitrary values.
  help_tags: z
    .array(z.enum(['pickup', 'childcare', 'ride', 'meal', 'other']))
    .optional(),
});

/**
 * Schema for profile updates — separate schema without defaults so that
 * an empty payload `{}` parses to an empty object (not injecting default values).
 * This lets the action correctly reject no-op calls.
 */
export const profileUpdateSchema = z.object({
  display_name: z
    .string()
    .min(2, 'Tên hiển thị phải ít nhất 2 ký tự')
    .max(50, 'Tên hiển thị tối đa 50 ký tự')
    .optional(),
  avatar_emoji: z.string().optional(),
  kids_desc: z
    .string()
    .max(100, 'Mô tả bé tối đa 100 ký tự')
    .optional(),
  location: z
    .string()
    .max(50, 'Địa điểm tối đa 50 ký tự')
    .optional(),
  help_tags: z
    .array(z.enum(['pickup', 'childcare', 'ride', 'meal', 'other']))
    .optional(),
});

/**
 * Schema for validating avatar upload metadata before the actual file upload.
 * Validates the File's .size and .type properties server-side.
 *
 * Note: The actual File object is passed separately to uploadAvatar; this schema
 * validates its metadata so we can return user-friendly error messages before
 * attempting the Supabase Storage upload.
 */
export const avatarUploadSchema = z.object({
  file_size: z
    .number()
    .max(2 * 1024 * 1024, 'File quá lớn. Vui lòng chọn ảnh dưới 2MB.'),
  file_type: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif'], {
    error: 'Định dạng file không được hỗ trợ.',
  }),
});

export type ProfileCreateInput = z.infer<typeof profileCreateSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type AvatarUploadInput = z.infer<typeof avatarUploadSchema>;
