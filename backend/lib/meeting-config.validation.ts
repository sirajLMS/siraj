import { z } from "zod";
import { localizedStringRequiredSchema } from "@/backend/lib/payment-method.validation";
import type { MeetingConfigDetails } from "@/backend/types/meeting/meeting-config.types";
import type { MeetingProviderSelectType } from "@/backend/types/meeting/meeting-provider.types";
import { isUrlAllowedByProvider } from "@/shared/lib/meeting-config";

function buildMeetingConfigDetailsSchema(provider: MeetingProviderSelectType): z.ZodType<MeetingConfigDetails> {
  // Gate on providerKind rather than fieldSchema.supportsAutoGeneration:
  // non-manual providers (zoom_oauth, google_meet_oauth, microsoft_teams_oauth)
  // auto-generate URLs, so meetingUrl is optional and may be `null`.
  const isAutoProvider = provider.providerKind !== "manual";

  // For auto-generation providers, meetingUrl is optional and may be `null`
  // (meaning "regenerate"). We normalize `null` → `undefined` here so downstream
  // code treats it as "no URL supplied". For manual providers, meetingUrl is still required.
  const meetingUrlSchema = isAutoProvider
    ? z
        .union([z.url(), z.null()])
        .transform(v => v ?? undefined)
        .optional()
    : z.url();

  const base = z.object({
    meetingUrl: meetingUrlSchema,
    username: z.string().optional(),
    tenantId: z.string().optional(),
  });

  return base.superRefine((data, ctx) => {
    // Only enforce URL allowlist for manual providers when a meetingUrl is present.
    // Auto-generation providers' URLs bypass the allowlist (plan task 3.2) to be
    // tolerant of upstream host variations, though the Zod .url() validation above
    // still ensures it's a valid URL.
    if (!isAutoProvider && data.meetingUrl && !isUrlAllowedByProvider(data.meetingUrl, provider.urlAllowlist)) {
      ctx.addIssue({ code: "custom", message: "meetingUrlHostNotAllowed", path: ["meetingUrl"] });
    }
    if (provider.fieldSchema.supportsUsername && data.username?.trim() === "") {
      ctx.addIssue({ code: "custom", message: "usernameRequired", path: ["username"] });
    }
    if (provider.fieldSchema.supportsTenantId && data.tenantId?.trim() === "") {
      ctx.addIssue({ code: "custom", message: "tenantIdRequired", path: ["tenantId"] });
    }
  });
}

export function parseMeetingConfigDetails(provider: MeetingProviderSelectType, details: unknown): MeetingConfigDetails {
  return buildMeetingConfigDetailsSchema(provider).parse(details);
}

export const meetingProviderCatalogSnapshotSchema = z.object({
  catalogId: z.guid(),
  catalogSlug: z.string(),
  catalogName: localizedStringRequiredSchema(),
  logoUrl: z.url().nullable(),
});

export const meetingConfigSnapshotSchema = z.object({
  userMeetingConfigId: z.guid().nullable(),
  providerId: z.guid(),
  label: z.string().nullable(),
  details: z.object({
    meetingUrl: z.url().optional(),
    username: z.string().optional(),
    tenantId: z.string().optional(),
  }),
  provider: meetingProviderCatalogSnapshotSchema,
  snapshottedAt: z.iso.datetime({ message: "snapshottedAt must be an ISO timestamp" }),
});

export function buildUserMeetingConfigSubmitInputSchema(provider: MeetingProviderSelectType) {
  return z
    .object({
      userId: z.guid(),
      providerId: z.guid(),
      label: z.string().max(100).nullable().optional(),
      isDefault: z.boolean(),
      password: z.string().nullable().optional(),
      details: z.unknown(),
    })
    .check(ctx => {
      const data = ctx.value;
      try {
        parseMeetingConfigDetails(provider, data.details);
      } catch {
        ctx.issues.push({
          code: "custom",
          message: "details do not match provider field schema",
          path: ["details"],
          input: ctx.value,
        });
      }
    });
}
