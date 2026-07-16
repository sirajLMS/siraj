import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  ClassMeetingConfigCreateInputPothos,
  ClassMeetingConfigPothosObject,
  ClassMeetingConfigUpdateInputPothos,
  MeetingProviderCreateInputPothos,
  MeetingProviderPothosObject,
  MeetingProviderUpdateInputPothos,
  UserMeetingConfigCreateInputPothos,
  UserMeetingConfigPothosObject,
  UserMeetingConfigUpdateInputPothos,
} from "@/backend/graphql/pothos/meeting/meeting.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { ClassMeetingConfigService, MeetingConfigService } from "@/backend/services/meeting";
import { MeetingProviderCatalogService } from "@/backend/services/meeting/meeting-provider-catalog.service";
import type { MeetingConfigDetails } from "@/backend/types/meeting/meeting-config.types";
import type { MeetingProviderFieldSchema } from "@/backend/types/meeting/meeting-provider.types";
import type { ErrorsLabels } from "@/shared/locale/types/errors";

function withAuthResult<TArgs, TResult>(
  fn: (actorUserId: string, args: TArgs, tErrors: ErrorsLabels, locale: string) => Promise<TResult>
) {
  return async (_parent: unknown, args: TArgs, ctx: BaseContext): Promise<TResult> => {
    const actorUserId = await requireAuth(ctx);
    const tErrors = ctx.t().errorsTranslations;
    return fn(actorUserId, args, tErrors, ctx.locale);
  };
}

function withAuthVoid<TArgs>(
  fn: (actorUserId: string, args: TArgs, tErrors: ErrorsLabels, locale: string) => Promise<unknown>
) {
  return async (_parent: unknown, args: TArgs, ctx: BaseContext): Promise<boolean> => {
    const actorUserId = await requireAuth(ctx);
    const tErrors = ctx.t().errorsTranslations;
    await fn(actorUserId, args, tErrors, ctx.locale);
    return true;
  };
}

function normalizeFieldSchema(input: {
  readonly requiresMeetingUrl: boolean;
  readonly supportsUsername?: boolean | null;
  readonly supportsPassword?: boolean | null;
  readonly supportsTenantId?: boolean | null;
}): MeetingProviderFieldSchema {
  return {
    requiresMeetingUrl: input.requiresMeetingUrl,
    ...(input.supportsUsername != null ? { supportsUsername: input.supportsUsername } : {}),
    ...(input.supportsPassword != null ? { supportsPassword: input.supportsPassword } : {}),
    ...(input.supportsTenantId != null ? { supportsTenantId: input.supportsTenantId } : {}),
  };
}

function normalizeMeetingConfigDetails(input: {
  readonly meetingUrl: string;
  readonly username?: string | null;
  readonly tenantId?: string | null;
}): MeetingConfigDetails {
  return {
    meetingUrl: input.meetingUrl,
    ...(input.username != null && input.username !== "" ? { username: input.username } : {}),
    ...(input.tenantId != null && input.tenantId !== "" ? { tenantId: input.tenantId } : {}),
  };
}

function normalizeProviderUpdateInput(input: {
  readonly slug?: string | null;
  readonly name?: Partial<Record<"ar" | "en", string>> | null;
  readonly description?: Partial<Record<"ar" | "en", string>> | null;
  readonly instructions?: Partial<Record<"ar" | "en", string>> | null;
  readonly urlAllowlist?: readonly string[] | null;
  readonly urlExample?: string | null;
  readonly logoUrl?: string | null;
  readonly fieldSchema?: {
    readonly requiresMeetingUrl: boolean;
    readonly supportsUsername?: boolean | null;
    readonly supportsPassword?: boolean | null;
    readonly supportsTenantId?: boolean | null;
  } | null;
  readonly isActive?: boolean | null;
}) {
  return {
    ...(input.slug != null ? { slug: input.slug } : {}),
    ...(input.name != null ? { name: input.name } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.instructions !== undefined ? { instructions: input.instructions } : {}),
    ...(input.urlAllowlist != null ? { urlAllowlist: input.urlAllowlist } : {}),
    ...(input.urlExample !== undefined ? { urlExample: input.urlExample } : {}),
    ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {}),
    ...(input.fieldSchema != null ? { fieldSchema: normalizeFieldSchema(input.fieldSchema) } : {}),
    ...(input.isActive != null ? { isActive: input.isActive } : {}),
  };
}

function normalizeConfigUpdateInput(input: {
  readonly providerId?: string | null;
  readonly label?: string | null;
  readonly isDefault?: boolean | null;
  readonly password?: string | null;
  readonly details?: {
    readonly meetingUrl: string;
    readonly username?: string | null;
    readonly tenantId?: string | null;
  } | null;
}) {
  return {
    ...(input.providerId != null ? { providerId: input.providerId } : {}),
    ...(input.label !== undefined ? { label: input.label } : {}),
    ...(input.isDefault != null ? { isDefault: input.isDefault } : {}),
    ...(input.password !== undefined ? { password: input.password } : {}),
    ...(input.details != null ? { details: normalizeMeetingConfigDetails(input.details) } : {}),
  };
}

function extractCommonMeetingConfigFields(input: {
  readonly providerId: string;
  readonly label?: string | null;
  readonly isDefault: boolean;
  readonly password?: string | null;
  readonly details: {
    readonly meetingUrl: string;
    readonly username?: string | null;
    readonly tenantId?: string | null;
  };
}) {
  return {
    providerId: input.providerId,
    label: input.label ?? null,
    isDefault: input.isDefault,
    password: input.password ?? null,
    details: normalizeMeetingConfigDetails(input.details),
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
      MeetingProviderCatalogService.createProvider(
        userId,
        {
          slug: args.input.slug ?? "",
          name: args.input.name ?? {},
          description: args.input.description,
          instructions: args.input.instructions,
          urlAllowlist: args.input.urlAllowlist ?? [],
          urlExample: args.input.urlExample,
          logoUrl: args.input.logoUrl,
          fieldSchema: normalizeFieldSchema(args.input.fieldSchema ?? { requiresMeetingUrl: false }),
          isActive: args.input.isActive ?? undefined,
        },
        tErrors
      )
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
          ...(args.input.providerId != null ? { providerId: args.input.providerId } : {}),
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
