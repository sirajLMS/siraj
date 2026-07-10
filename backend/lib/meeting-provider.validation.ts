import { z } from "zod";
import { localizedStringRequiredSchema, localizedStringSchema } from "@/backend/lib/payment-method.validation";
import type {
  MeetingProviderFieldSchema,
  MeetingProviderSubmitInput,
  UpdateMeetingProviderInput,
} from "@/backend/types/meeting/meeting-provider.types";

export const meetingProviderFieldSchemaSchema = z.object({
  requiresMeetingUrl: z.boolean(),
  supportsUsername: z.boolean().optional(),
  supportsPassword: z.boolean().optional(),
  supportsTenantId: z.boolean().optional(),
}) as z.ZodType<MeetingProviderFieldSchema>;

export const meetingProviderSubmitInputSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9_]+$/, "slug must be lowercase alphanumeric with underscores"),
  name: localizedStringRequiredSchema(),
  description: localizedStringSchema.nullable().optional(),
  instructions: localizedStringSchema.nullable().optional(),
  urlAllowlist: z.array(z.string().min(1)).min(1),
  urlExample: z.string().url().nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
  fieldSchema: meetingProviderFieldSchemaSchema,
  isActive: z.boolean().optional(),
}) satisfies z.ZodType<MeetingProviderSubmitInput>;

export const updateMeetingProviderInputSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9_]+$/, "slug must be lowercase alphanumeric with underscores")
    .optional(),
  name: localizedStringRequiredSchema().optional(),
  description: localizedStringSchema.nullable().optional(),
  instructions: localizedStringSchema.nullable().optional(),
  urlAllowlist: z.array(z.string().min(1)).min(1).optional(),
  urlExample: z.string().url().nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
  fieldSchema: meetingProviderFieldSchemaSchema.optional(),
  isActive: z.boolean().optional(),
}) satisfies z.ZodType<UpdateMeetingProviderInput>;

export function parseMeetingProviderSubmitInput(input: unknown): MeetingProviderSubmitInput {
  return meetingProviderSubmitInputSchema.parse(input);
}

export function parseUpdateMeetingProviderInput(input: unknown): UpdateMeetingProviderInput {
  return updateMeetingProviderInputSchema.parse(input);
}
