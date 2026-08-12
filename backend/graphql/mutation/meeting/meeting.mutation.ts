import { MeetingProviderRepository } from "@/backend/db/repo/meeting/meeting-provider.repository";
import { AppPermission } from "@/backend/enum/permissions/permission.enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  ClassMeetingConfigCreateInputPothos,
  ClassMeetingConfigPothosObject,
  ClassMeetingConfigUpdateInputPothos,
  GenerateMeetingUrlInputPothos,
  GenerateMeetingUrlResultPothosObject,
  MeetingProviderCreateInputPothos,
  MeetingProviderPothosObject,
  MeetingProviderUpdateInputPothos,
  UserMeetingConfigCreateInputPothos,
  UserMeetingConfigPothosObject,
  UserMeetingConfigUpdateInputPothos,
} from "@/backend/graphql/pothos/meeting/meeting.pothos";
import { withAuthResult, withAuthVoid } from "@/backend/graphql/utils";
import { handleMeetingChannelError } from "@/backend/graphql/utils/handle-meeting-channel-error";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { ClassMeetingConfigService } from "@/backend/services/meeting/class-meeting-config.service";
import { MeetingConfigService } from "@/backend/services/meeting/meeting-config.service";
import { MeetingProviderCatalogService } from "@/backend/services/meeting/meeting-provider-catalog.service";
import { meetingChannel } from "@/backend/services/meeting/channels/MeetingChannelFactory";
import type {
  GenerateMeetingUrlResult,
  MeetingConfigDetails,
  MeetingProviderFieldSchema,
  MeetingProviderKind,
  MeetingProviderSubmitInput,
} from "@/backend/types";
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

function normalizeProviderCreateInput(input: ProviderInputShape): MeetingProviderSubmitInput {
  const slug = input.slug;
  if (slug == null) {
    throw new Error("slug is required");
  }
  const urlAllowlist = input.urlAllowlist;
  if (urlAllowlist == null) {
    throw new Error("urlAllowlist is required");
  }
  const fieldSchema = input.fieldSchema;
  if (fieldSchema == null) {
    throw new Error("fieldSchema is required");
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

function normalizeProviderUpdateInput(input: ProviderInputShape) {
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

function normalizeConfigUpdateInput(input: {
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

function extractCommonMeetingConfigFields(input: {
  readonly providerId?: string | null;
  readonly label?: string | null;
  readonly isDefault?: boolean | null;
  readonly password?: string | null;
  readonly details?: {
    readonly meetingUrl?: string | null;
    readonly username?: string | null;
    readonly tenantId?: string | null;
  } | null;
}) {
  const providerId = input.providerId;
  if (providerId == null) {
    throw new Error("providerId is required");
  }
  const isDefault = input.isDefault;
  if (isDefault == null) {
    throw new Error("isDefault is required");
  }
  const details = input.details;
  if (details == null) {
    throw new Error("details is required");
  }

  return {
    providerId,
    label: input.label ?? null,
    isDefault,
    password: input.password ?? null,
    details: normalizeMeetingConfigDetails(details),
  };
}

gqlSchemaBuilder.mutationField("createMeetingProvider", t =>
  t.field({
    type: MeetingProviderPothosObject,
    args: {
      input: t.arg({ type: MeetingProviderCreateInputPothos, required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: withAuthResult((userId, args, tErrors) =>
      MeetingProviderCatalogService.createProvider(userId, normalizeProviderCreateInput(args.input), tErrors)
    ),
  })
);

gqlSchemaBuilder.mutationField("updateMeetingProvider", t =>
  t.field({
    type: MeetingProviderPothosObject,
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: MeetingProviderUpdateInputPothos, required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: withAuthResult((userId, args, tErrors) =>
      MeetingProviderCatalogService.updateProvider(userId, args.id, normalizeProviderUpdateInput(args.input), tErrors)
    ),
  })
);

gqlSchemaBuilder.mutationField("deleteMeetingProvider", t =>
  t.field({
    type: "Boolean",
    args: {
      id: t.arg.id({ required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: withAuthVoid((userId, args, tErrors) =>
      MeetingProviderCatalogService.deleteProvider(userId, args.id, tErrors)
    ),
  })
);

gqlSchemaBuilder.mutationField("createUserMeetingConfig", t =>
  t.field({
    type: UserMeetingConfigPothosObject,
    args: {
      input: t.arg({ type: UserMeetingConfigCreateInputPothos, required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: withAuthResult((actorUserId, args, tErrors) =>
      MeetingConfigService.createUserMeetingConfig(
        actorUserId,
        {
          userId: args.input.userId,
          ...extractCommonMeetingConfigFields(args.input),
        },
        tErrors
      )
    ),
  })
);

gqlSchemaBuilder.mutationField("updateUserMeetingConfig", t =>
  t.field({
    type: UserMeetingConfigPothosObject,
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: UserMeetingConfigUpdateInputPothos, required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: withAuthResult((actorUserId, args, tErrors) =>
      MeetingConfigService.updateUserMeetingConfig(
        actorUserId,
        args.id,
        normalizeConfigUpdateInput(args.input),
        tErrors
      )
    ),
  })
);

gqlSchemaBuilder.mutationField("deleteUserMeetingConfig", t =>
  t.field({
    type: "Boolean",
    args: {
      id: t.arg.id({ required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: withAuthVoid((actorUserId, args, tErrors) =>
      MeetingConfigService.deleteUserMeetingConfig(actorUserId, args.id, tErrors)
    ),
  })
);

gqlSchemaBuilder.mutationField("setDefaultMeetingConfig", t =>
  t.field({
    type: UserMeetingConfigPothosObject,
    args: {
      id: t.arg.id({ required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: withAuthResult((actorUserId, args, tErrors) =>
      MeetingConfigService.setDefaultMeetingConfig(actorUserId, args.id, tErrors)
    ),
  })
);

gqlSchemaBuilder.mutationField("createClassMeetingConfig", t =>
  t.field({
    type: ClassMeetingConfigPothosObject,
    args: {
      input: t.arg({ type: ClassMeetingConfigCreateInputPothos, required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: withAuthResult((actorUserId, args, tErrors) =>
      ClassMeetingConfigService.createClassMeetingConfig(
        actorUserId,
        {
          classInstanceId: args.input.classInstanceId,
          recurringScheduleId: args.input.recurringScheduleId,
          ...extractCommonMeetingConfigFields(args.input),
        },
        tErrors
      )
    ),
  })
);

gqlSchemaBuilder.mutationField("updateClassMeetingConfig", t =>
  t.field({
    type: ClassMeetingConfigPothosObject,
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: ClassMeetingConfigUpdateInputPothos, required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: withAuthResult((actorUserId, args, tErrors) =>
      ClassMeetingConfigService.updateClassMeetingConfig(
        actorUserId,
        args.id,
        {
          ...normalizeConfigUpdateInput(args.input),
          ...(args.input.providerId === null ? {} : { providerId: args.input.providerId }),
        },
        tErrors
      )
    ),
  })
);

gqlSchemaBuilder.mutationField("deleteClassMeetingConfig", t =>
  t.field({
    type: "Boolean",
    args: {
      id: t.arg.id({ required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: withAuthVoid((actorUserId, args, tErrors) =>
      ClassMeetingConfigService.deleteClassMeetingConfig(actorUserId, args.id, tErrors)
    ),
  })
);

gqlSchemaBuilder.mutationField("setDefaultClassMeetingConfig", t =>
  t.field({
    type: ClassMeetingConfigPothosObject,
    args: {
      id: t.arg.id({ required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: withAuthResult((actorUserId, args, tErrors) =>
      ClassMeetingConfigService.setDefaultClassMeetingConfig(actorUserId, args.id, tErrors)
    ),
  })
);

gqlSchemaBuilder.mutationField("generateMeetingUrl", t =>
  t.field({
    type: GenerateMeetingUrlResultPothosObject,
    args: {
      input: t.arg({ type: GenerateMeetingUrlInputPothos, required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx: BaseContext) => {
      const actorUserId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;

      const canManageOwn = await PermissionsService.hasPermission(
        actorUserId,
        AppPermission.MEETING_CONFIGS_MANAGE_OWN
      );
      if (!canManageOwn) {
        throw new Error(tErrors.insufficientPermissions);
      }

      const provider = await MeetingProviderRepository.getByIdOrThrow(args.input.providerId, tErrors);
      try {
        const result = await meetingChannel.generateMeeting(provider.providerKind, {
          topic: args.input.topic,
          ...(args.input.startDateTime == null ? {} : { startDateTime: args.input.startDateTime }),
          ...(args.input.durationMinutes == null ? {} : { durationMinutes: args.input.durationMinutes }),
          actorUserId,
        });

        const response: GenerateMeetingUrlResult = {
          joinUrl: result.joinUrl,
          ...(result.meetingId == null ? {} : { meetingId: result.meetingId }),
          expiresAt: null, // Wired when token metadata is available from the adapter
        };
        return response;
      } catch (err) {
        handleMeetingChannelError(err);
      }
      return undefined;
    },
  })
);
