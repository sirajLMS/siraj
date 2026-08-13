import { z } from "zod";

/**
 * Zod schema for validating FixerLatestResponse at runtime.
 * Used to safely parse the API response instead of unsafe type assertions.
 */
export const fixerResponseSchema = z.object({
  success: z.boolean(),
  timestamp: z.number(),
  base: z.string(),
  date: z.string(),
  rates: z.record(z.string(), z.number()),
  error: z
    .object({
      code: z.number(),
      type: z.string(),
      info: z.string().optional(),
    })
    .optional(),
});
