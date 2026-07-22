import { z } from "zod";
import { localizedStringRequiredSchema } from "@/backend/lib/payment-method.validation";
import type { MeetingConfigDetails } from "@/backend/types/meeting/meeting-config.types";
import type { MeetingProviderSelectType } from "@/backend/types/meeting/meeting-provider.types";
// ============================================================================
// URL allowlist — host must match one of the provider patterns
// ============================================================================

export function isUrlAllowedByProvider(url: string, allowlist: readonly string[]): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return allowlist.some(pattern => {
      const normalized = pattern.toLowerCase().replace(/^\*\./, "");
      return hostname === normalized || hostname.endsWith(`.${normalized}`);
    });
  } catch {
    return false;
  }
}

function buildMeetingConfigDetailsSchema(provider: MeetingProviderSelectType): z.ZodType<MeetingConfigDetails> {
  const base = z.object({
    meetingUrl: z.url(),
    username: z.string().optional(),
    tenantId: z.string().optional(),
  });

  return base.check(ctx => {
    const data = ctx.value;
    if (!isUrlAllowedByProvider(data.meetingUrl, provider.urlAllowlist)) {
      ctx.issues.push({
        code: "custom",
        message: "meetingUrlHostNotAllowed",
        path: ["meetingUrl"],
        input: ctx.value,
      });
    }
    if (provider.fieldSchema.supportsUsername && data.username !== undefined && data.username.trim() === "") {
      ctx.issues.push({
        code: "custom",
        message: "usernameRequired",
        path: ["username"],
        input: ctx.value,
      });
    }
    if (provider.fieldSchema.supportsTenantId && data.tenantId !== undefined && data.tenantId.trim() === "") {
      ctx.issues.push({
        code: "custom",
        message: "tenantIdRequired",
        path: ["tenantId"],
        input: ctx.value,
      });
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
    meetingUrl: z.url(),
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
