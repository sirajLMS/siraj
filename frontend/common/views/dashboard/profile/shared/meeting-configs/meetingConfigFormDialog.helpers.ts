import type { UserMeetingConfigUpdateInput } from "@/frontend/common/graphql/generated/gql/graphql";
import type { UseMeetingConfigFormStateReturn } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigFormDialog";
import type { createMeetingConfigFormSchema } from "@/frontend/common/views/dashboard/settings/schemas/meetingConfigForm.schema";
import type { MeetingConfigManagerLabels } from "@/shared/locale/types/ui";

export type MeetingConfigDetailsForm = {
  meetingUrl: string;
  username: string;
  password: string;
  tenantId: string;
};

export type MeetingConfigFormSchema = ReturnType<typeof createMeetingConfigFormSchema>;

export type SaveRejection = { readonly type: "error"; readonly message: string } | { readonly type: "silent" };

/** Extract a user-friendly save error from a failed zod safeParse. */
function resolveZodErrorMessage(
  result: ReturnType<MeetingConfigFormSchema["safeParse"]>,
  labels: MeetingConfigManagerLabels,
  fallback: string
): string {
  if (!result.success) {
    const firstError = result.error.issues[0];
    if (firstError?.path[0] === "name") return labels.nameRequired;
    if (firstError?.path[0] === "providerSlug") return labels.providerRequired;
    return firstError?.message ?? fallback;
  }
  return fallback;
}

/** Returns the reason a save must not run, or null when the form may persist. */
export function resolveSaveRejection(args: {
  readonly isEdit: boolean;
  readonly state: UseMeetingConfigFormStateReturn;
  readonly schema: MeetingConfigFormSchema;
}): SaveRejection | null {
  const { isEdit, state, schema } = args;
  const { label, isDefault, details, provider, validateUrl, t } = state;
  const supportsAutoGeneration = provider?.fieldSchema?.supportsAutoGeneration === true;

  if (!isEdit && !provider?.id) return { type: "silent" };

  // Zod schema validation: name + providerSlug required.
  const zodResult = schema.safeParse({
    name: label,
    providerSlug: provider?.slug ?? "",
    isDefault,
    autoGenerate: supportsAutoGeneration && !details.meetingUrl.trim(),
    settings: { ...details },
  });
  if (!zodResult.success) {
    return { type: "error", message: resolveZodErrorMessage(zodResult, t, t.saveError) };
  }

  // Block save when URL is blank and the provider does NOT support auto-generation.
  if (!details.meetingUrl.trim() && !supportsAutoGeneration) return { type: "silent" };

  // validateUrl handles allowlist checks — skip when URL is blank (auto-gen path).
  if (details.meetingUrl.trim() && !validateUrl()) return { type: "silent" };

  return null;
}

/** Build the update mutation input from form state. */
export function buildUpdateInput(args: {
  readonly label: string;
  readonly isDefault: boolean;
  readonly details: MeetingConfigDetailsForm;
  readonly provider: { readonly id: string | null } | null;
  readonly providerChanged: boolean;
}): UserMeetingConfigUpdateInput {
  const meetingUrl = args.details.meetingUrl.trim() || null;
  return {
    label: args.label.trim() || null,
    isDefault: args.isDefault,
    password: args.details.password.trim() || null,
    providerId: args.providerChanged && args.provider?.id ? args.provider.id : null,
    forceRegenerate: null,
    details: {
      meetingUrl,
      username: args.details.username.trim() || null,
      tenantId: args.details.tenantId.trim() || null,
    },
  };
}

/** Build the create mutation input's details payload. */
export function buildDetailsPayload(details: MeetingConfigDetailsForm, meetingUrl: string | null) {
  return {
    meetingUrl,
    username: details.username.trim() || null,
    tenantId: details.tenantId.trim() || null,
  };
}

/** Call generateMeetingUrl mutation and return the joinUrl or null on failure. */
export async function fetchGeneratedUrl(
  mutate: (options: {
    readonly variables: {
      readonly input: {
        readonly providerId: string;
        readonly topic: string;
        readonly startDateTime: string | null;
        readonly durationMinutes: number | null;
      };
    };
  }) => Promise<{
    readonly data?: { readonly generateMeetingUrl?: { readonly joinUrl?: string | null } | null } | null;
  }>,
  provider: { readonly id: string | null } | null,
  label: string
): Promise<string | null> {
  if (!provider?.id) return null;
  try {
    const result = await mutate({
      variables: {
        input: {
          providerId: provider.id,
          topic: label.trim() || "Meeting",
          startDateTime: null,
          durationMinutes: null,
        },
      },
    });
    return result.data?.generateMeetingUrl?.joinUrl ?? null;
  } catch {
    return null;
  }
}
