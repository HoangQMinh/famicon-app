import { z } from 'zod';

/**
 * Schema for validating circle members query input.
 * circleId must be a valid UUID to prevent injection and nonsensical DB lookups.
 */
export const membersQuerySchema = z.object({
  circleId: z.string().uuid('ID vòng tròn không hợp lệ.'),
});

export type MembersQueryInput = z.infer<typeof membersQuerySchema>;
