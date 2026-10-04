import type { MeetingProviderQuery_meetingProvider } from "@/frontend/common/graphql/generated/gql/graphql";
import type { MeetingProviderFormData } from "@/frontend/common/views/dashboard/admin/meeting-providers/schemas/meetingProviderFormSchema";

export const defaultFormValues: MeetingProviderFormData = {
  slug: "",
  name: { en: "", ar: "" },
  description: { en: "", ar: "" },
  instructions: { en: "", ar: "" },
  urlAllowlist: [],
  urlExample: "",
  logoUrl: null,
  supportsAutoGeneration: false,
  supportsUsername: false,
  supportsPassword: false,
  supportsTenantId: false,
  providerKind: "manual",
  isActive: true,
};

const buildFieldSchema = (values: MeetingProviderFormData) => ({
  requiresMeetingUrl: !values.supportsAutoGeneration,
  supportsAutoGeneration: values.supportsAutoGeneration ?? false,
  supportsUsername: values.supportsUsername,
  supportsPassword: values.supportsPassword,
  supportsTenantId: values.supportsTenantId,
});

const sanitizeLocalizedText = (loc?: { en?: string; ar?: string }) => {
  const en = (loc?.en ?? "").trim();
  const ar = (loc?.ar ?? "").trim();
  if (!en && !ar) return null;
  return { en: en || ar, ar: ar || en };
};

const sanitizeName = (name?: { en?: string; ar?: string }) => ({
  en: (name?.en ?? "").trim() || (name?.ar ?? "").trim(),
  ar: (name?.ar ?? "").trim() || (name?.en ?? "").trim(),
});

export const buildProviderInput = (values: MeetingProviderFormData) => {
  const fieldSchema = buildFieldSchema(values);
  const nameSanitized = sanitizeName(values.name);
  const descriptionSanitized = sanitizeLocalizedText(values.description);
  const instructionsSanitized = sanitizeLocalizedText(values.instructions);

  return {
    slug: values.slug.trim(),
    name: nameSanitized,
    description: descriptionSanitized,
    instructions: instructionsSanitized,
    urlAllowlist: values.urlAllowlist,
    urlExample: values.urlExample?.trim() || null,
    logoUrl: values.logoUrl?.trim() ?? null,
    fieldSchema,
    providerKind: values.providerKind,
    isActive: values.isActive,
  };
};

export const toMeetingProviderFormValues = (
  provider: MeetingProviderQuery_meetingProvider
): MeetingProviderFormData => ({
  slug: provider.slug ?? "",
  name: { en: provider.name?.en ?? "", ar: provider.name?.ar ?? "" },
  description: { en: provider.description?.en ?? "", ar: provider.description?.ar ?? "" },
  instructions: { en: provider.instructions?.en ?? "", ar: provider.instructions?.ar ?? "" },
  urlAllowlist: [...(provider.urlAllowlist ?? [])],
  urlExample: provider.urlExample ?? "",
  logoUrl: provider.logoUrl ?? null,
  supportsAutoGeneration: Boolean(provider.fieldSchema?.supportsAutoGeneration),
  supportsUsername: Boolean(provider.fieldSchema?.supportsUsername),
  supportsPassword: Boolean(provider.fieldSchema?.supportsPassword),
  supportsTenantId: Boolean(provider.fieldSchema?.supportsTenantId),
  providerKind: provider.providerKind ?? "manual",
  isActive: provider.isActive ?? true,
});
