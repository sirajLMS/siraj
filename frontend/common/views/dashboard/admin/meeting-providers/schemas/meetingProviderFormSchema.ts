import { z } from "zod";
import type { MeetingProvidersLabels } from "@/shared/locale/types/dashboard/meeting-providers/main";

const localizedStringSchema = (requiredMessage?: string) =>
  z.object({
    en: requiredMessage ? z.string().min(1, requiredMessage) : z.string().optional().default(""),
    ar: z.string().optional().default(""),
  });

export const meetingProviderFormSchema = (labels: MeetingProvidersLabels["validation"]) =>
  z.object({
    slug: z
      .string()
      .min(1, labels.slugRequired)
      .regex(/^[a-z0-9_]+$/, labels.slugInvalidFormat),
    name: localizedStringSchema(labels.nameRequired),
    description: localizedStringSchema(),
    instructions: localizedStringSchema(),
    urlAllowlist: z.array(z.string().min(1)).min(1, labels.urlAllowlistRequired),
    urlExample: z.string().optional().default(""),
    logoUrl: z.string().nullable().optional().default(null),
    supportsUsername: z.boolean().default(false),
    supportsPassword: z.boolean().default(false),
    supportsTenantId: z.boolean().default(false),
    isActive: z.boolean().default(true),
  });

export type MeetingProviderFormData = z.infer<ReturnType<typeof meetingProviderFormSchema>>;
