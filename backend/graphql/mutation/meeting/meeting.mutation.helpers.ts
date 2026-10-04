import { GraphQLError } from "graphql";
import type {
  MeetingConfigDetails,
  MeetingProviderFieldSchema,
  MeetingProviderKind,
  MeetingProviderSubmitInput,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale/types/errors";
import type { LocalizedString } from "@/shared/types";

const VALID_PROVIDER_KINDS: readonly MeetingProviderKind[] = [
  "manual",
  "zoom_oauth",
  "google_meet_oauth",
  "microsoft_teams_oauth",
];

function isMeetingProviderKind(value: string): value is MeetingProviderKind {
  return (VALID_PROVIDER_KINDS as readonly string[]).includes(value);
}

function normalizeFieldSchema(input: {
  readonly requiresMeetingUrl: boolean;
  readonly supportsAutoGeneration?: boolean | null;
  readonly supportsUsername?: boolean | null;
  readonly supportsPassword?: boolean | null;
  readonly supportsTenantId?: boolean | null;
}): MeetingProviderFieldSchema {
  return {
    requiresMeetingUrl: input.requiresMeetingUrl,
    ...(input.supportsAutoGeneration == null ? {} : { supportsAutoGeneration: input.supportsAutoGeneration }),
    ...(input.supportsUsername == null ? {} : { supportsUsername: input.supportsUsername }),
    ...(input.supportsPassword == null ? {} : { supportsPassword: input.supportsPassword }),
    ...(input.supportsTenantId == null ? {} : { supportsTenantId: input.supportsTenantId }),
  };
}

function normalizeMeetingConfigDetails(input: {
  readonly meetingUrl?: string | null;
  readonly username?: string | null;
  readonly tenantId?: string | null;
}): MeetingConfigDetails {
  return {
    meetingUrl: input.meetingUrl ?? undefined,
    ...(input.username == null || input.username === "" ? {} : { username: input.username }),
    ...(input.tenantId == null || input.tenantId === "" ? {} : { tenantId: input.tenantId }),
  };
}

function normalizeLocalizedString(
  loc?: { readonly ar?: string | null; readonly en?: string | null } | null
): LocalizedString | null {
  if (!loc) return null;
  const ar = (loc.ar ?? "").trim() || undefined;
  const en = (loc.en ?? "").trim() || undefined;
  if (!ar && !en) return null;
  return {
    ...(en ? { en } : {}),
    ...(ar ? { ar } : {}),
  };
}

function normalizeRequiredLocalizedString(
  loc?: { readonly ar?: string | null; readonly en?: string | null } | null
): LocalizedString {
  const norm = normalizeLocalizedString(loc);
  if (!norm) return { en: "", ar: "" };
  return {
    en: norm.en ?? norm.ar ?? "",
    ar: norm.ar ?? norm.en ?? "",
  };
}

type ProviderInputShape = {
  readonly slug?: string | null;
  readonly name?: { readonly ar?: string | null; readonly en?: string | null } | null;
  readonly description?: { readonly ar?: string | null; readonly en?: string | null } | null;
  readonly instructions?: { readonly ar?: string | null; readonly en?: string | null } | null;
  readonly urlAllowlist?: readonly string[] | null;
  readonly urlExample?: string | null;
  readonly logoUrl?: string | null;
  readonly fieldSchema?: {
    readonly requiresMeetingUrl: boolean;
    readonly supportsAutoGeneration?: boolean | null;
    readonly supportsUsername?: boolean | null;
    readonly supportsPassword?: boolean | null;
    readonly supportsTenantId?: boolean | null;
  } | null;
  readonly providerKind?: string | null;
  readonly isActive?: boolean | null;
};

function resolveProviderKind(kind: string | null | undefined): MeetingProviderKind | undefined {
  if (kind == null) return undefined;
  return isMeetingProviderKind(kind) ? kind : "manual";
}

export function normalizeProviderCreateInput(
  input: ProviderInputShape,
  tErrors: ErrorsLabels
): MeetingProviderSubmitInput {
  const slug = input.slug;
  if (slug == null) {
    throw new GraphQLError(tErrors.meetingProvider.slugIsRequired, { extensions: { code: "BAD_USER_INPUT" } });
  }
  const urlAllowlist = input.urlAllowlist;
  if (urlAllowlist == null) {
    throw new GraphQLError(tErrors.meetingProvider.urlAllowlistIsRequired, { extensions: { code: "BAD_USER_INPUT" } });
  }
  const fieldSchema = input.fieldSchema;
  if (fieldSchema == null) {
    throw new GraphQLError(tErrors.meetingProvider.fieldSchemaIsRequired, { extensions: { code: "BAD_USER_INPUT" } });
  }

  return {
    slug,
    name: normalizeRequiredLocalizedString(input.name),
    description: normalizeLocalizedString(input.description),
    instructions: normalizeLocalizedString(input.instructions),
    urlAllowlist,
    urlExample: input.urlExample ?? null,
    logoUrl: input.logoUrl ?? null,
    fieldSchema: normalizeFieldSchema(fieldSchema),
    ...(resolveProviderKind(input.providerKind) == null
      ? {}
      : { providerKind: resolveProviderKind(input.providerKind) }),
    isActive: input.isActive ?? undefined,
  };
}

export function normalizeProviderUpdateInput(input: ProviderInputShape) {
  return {
    ...(input.slug == null ? {} : { slug: input.slug }),
    ...(input.name == null ? {} : { name: normalizeRequiredLocalizedString(input.name) }),
    ...(input.description === undefined ? {} : { description: normalizeLocalizedString(input.description) }),
    ...(input.instructions === undefined ? {} : { instructions: normalizeLocalizedString(input.instructions) }),
    ...(input.urlAllowlist == null ? {} : { urlAllowlist: input.urlAllowlist }),
    ...(input.urlExample === undefined ? {} : { urlExample: input.urlExample }),
    ...(input.logoUrl === undefined ? {} : { logoUrl: input.logoUrl }),
    ...(input.fieldSchema == null ? {} : { fieldSchema: normalizeFieldSchema(input.fieldSchema) }),
    ...(resolveProviderKind(input.providerKind) == null
      ? {}
      : { providerKind: resolveProviderKind(input.providerKind) }),
    ...(input.isActive == null ? {} : { isActive: input.isActive }),
  };
}

export function normalizeConfigUpdateInput(input: {
  readonly providerId?: string | null;
  readonly label?: string | null;
  readonly isDefault?: boolean | null;
  readonly password?: string | null;
  readonly forceRegenerate?: boolean | null;
  readonly details?: {
    readonly meetingUrl?: string | null;
    readonly username?: string | null;
    readonly tenantId?: string | null;
  } | null;
}) {
  return {
    ...(input.providerId == null ? {} : { providerId: input.providerId }),
    ...(input.label === undefined ? {} : { label: input.label }),
    ...(input.isDefault == null ? {} : { isDefault: input.isDefault }),
    ...(input.password === undefined ? {} : { password: input.password }),
    ...(input.forceRegenerate == null ? {} : { forceRegenerate: input.forceRegenerate }),
    ...(input.details == null ? {} : { details: normalizeMeetingConfigDetails(input.details) }),
  };
}

export function extractCommonMeetingConfigFields(
  input: {
    readonly providerId?: string | null;
    readonly label?: string | null;
    readonly isDefault?: boolean | null;
    readonly password?: string | null;
    readonly details?: {
      readonly meetingUrl?: string | null;
      readonly username?: string | null;
      readonly tenantId?: string | null;
    } | null;
  },
  tErrors: ErrorsLabels
) {
  const providerId = input.providerId;
  if (providerId == null) {
    throw new GraphQLError(tErrors.meetingProvider.providerIdIsRequired, { extensions: { code: "BAD_USER_INPUT" } });
  }
  const isDefault = input.isDefault;
  if (isDefault == null) {
    throw new GraphQLError(tErrors.meetingProvider.isDefaultIsRequired, { extensions: { code: "BAD_USER_INPUT" } });
  }
  const details = input.details;
  if (details == null) {
    throw new GraphQLError(tErrors.meetingProvider.detailsIsRequired, { extensions: { code: "BAD_USER_INPUT" } });
  }

  return {
    providerId,
    label: input.label ?? null,
    isDefault,
    password: input.password ?? null,
    details: normalizeMeetingConfigDetails(details),
  };
}
