import { z } from "zod";
import { localizedStringRequiredSchema } from "@/backend/lib/payment-method.validation";
import type {
  MeetingConfigDetails,
  MeetingConfigSnapshot,
  MeetingProviderCatalogSnapshot,
  UserMeetingConfigSubmitInput,
} from "@/backend/types/meeting/meeting-config.types";
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
    meetingUrl: z.string().url(),
    username: z.string().optional(),
    tenantId: z.string().optional(),
  });

  return base.superRefine((data, ctx) => {
    if (!isUrlAllowedByProvider(data.meetingUrl, provider.urlAllowlist)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "meetingUrlHostNotAllowed",
        path: ["meetingUrl"],
      });
    }
    if (provider.fieldSchema.supportsUsername && data.username !== undefined && data.username.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "usernameRequired",
        path: ["username"],
      });
    }
    if (provider.fieldSchema.supportsTenantId && data.tenantId !== undefined && data.tenantId.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "tenantIdRequired",
        path: ["tenantId"],
      });
    }
  }) as z.ZodType<MeetingConfigDetails>;
}

export function parseMeetingConfigDetails(provider: MeetingProviderSelectType, details: unknown): MeetingConfigDetails {
  return buildMeetingConfigDetailsSchema(provider).parse(details);
}

export const meetingProviderCatalogSnapshotSchema = z.object({
  catalogId: z.string().uuid(),
  catalogSlug: z.string(),
  catalogName: localizedStringRequiredSchema(),
  logoUrl: z.string().url().nullable(),
}) as z.ZodType<MeetingProviderCatalogSnapshot>;

export const meetingConfigSnapshotSchema = z.object({
  userMeetingConfigId: z.string().uuid().nullable(),
  providerId: z.string().uuid(),
  label: z.string().nullable(),
  details: z.object({
    meetingUrl: z.string().url(),
    username: z.string().optional(),
    tenantId: z.string().optional(),
  }),
  provider: meetingProviderCatalogSnapshotSchema,
  snapshottedAt: z.string().refine(s => !Number.isNaN(Date.parse(s)), {
    message: "snapshottedAt must be an ISO timestamp",
  }),
}) as z.ZodType<MeetingConfigSnapshot>;

export function buildUserMeetingConfigSubmitInputSchema(provider: MeetingProviderSelectType) {
  return z
    .object({
      userId: z.string().uuid(),
      providerId: z.string().uuid(),
      label: z.string().max(100).nullable().optional(),
      isDefault: z.boolean(),
      password: z.string().nullable().optional(),
      details: z.unknown(),
    })
    .refine(
      data => {
        try {
          parseMeetingConfigDetails(provider, data.details);
          return true;
        } catch {
          return false;
        }
      },
      { message: "details do not match provider field schema" }
    ) as z.ZodType<UserMeetingConfigSubmitInput>;
}
