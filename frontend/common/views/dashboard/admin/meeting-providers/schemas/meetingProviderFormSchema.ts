import { z } from "zod";
import type { MeetingProvidersLabels } from "@/shared/locale/types/dashboard/meeting-providers/main";

const localizedStringSchema = (requiredMessage?: string) =>
  z.object({
    en: requiredMessage ? z.string().min(1, requiredMessage) : z.string(),
    ar: z.string(),
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
    urlExample: z.string(),
    logoUrl: z.string().nullable(),
    supportsAutoGeneration: z.boolean(),
    supportsUsername: z.boolean(),
    supportsPassword: z.boolean(),
    supportsTenantId: z.boolean(),
    providerKind: z.string(),
    isActive: z.boolean(),
  });

export type MeetingProviderFormData = z.infer<ReturnType<typeof meetingProviderFormSchema>>;
