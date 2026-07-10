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

gqlSchemaBuilder.mutationField("createMeetingProvider", t =>
  t.field({
    type: MeetingProviderPothosObject,
    args: {
      input: t.arg({ type: MeetingProviderCreateInputPothos, required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      return MeetingProviderCatalogService.createProvider(
        userId,
        {
          slug: args.input.slug,
          name: args.input.name,
          description: args.input.description,
          instructions: args.input.instructions,
          urlAllowlist: args.input.urlAllowlist,
          urlExample: args.input.urlExample,
          logoUrl: args.input.logoUrl,
          fieldSchema: normalizeFieldSchema(args.input.fieldSchema),
          isActive: args.input.isActive ?? undefined,
        },
        ctx.locale
      );
    },
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
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      return MeetingProviderCatalogService.updateProvider(
        userId,
        args.id,
        normalizeProviderUpdateInput(args.input),
        ctx.locale
      );
    },
  })
);

gqlSchemaBuilder.mutationField("deleteMeetingProvider", t =>
  t.field({
    type: "Boolean",
    args: {
      id: t.arg.id({ required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      await MeetingProviderCatalogService.deleteProvider(userId, args.id, ctx.locale);
      return true;
    },
  })
);

gqlSchemaBuilder.mutationField("createUserMeetingConfig", t =>
  t.field({
    type: UserMeetingConfigPothosObject,
    args: {
      input: t.arg({ type: UserMeetingConfigCreateInputPothos, required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return MeetingConfigService.createUserMeetingConfig(
        actorUserId,
        {
          userId: args.input.userId,
          providerId: args.input.providerId,
          label: args.input.label,
          isDefault: args.input.isDefault,
          password: args.input.password,
          details: normalizeMeetingConfigDetails(args.input.details),
        },
        ctx.locale
      );
    },
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
    resolve: async (_parent, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return MeetingConfigService.updateUserMeetingConfig(
        actorUserId,
        args.id,
        normalizeConfigUpdateInput(args.input),
        ctx.locale
      );
    },
  })
);

gqlSchemaBuilder.mutationField("deleteUserMeetingConfig", t =>
  t.field({
    type: "Boolean",
    args: {
      id: t.arg.id({ required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      await MeetingConfigService.deleteUserMeetingConfig(actorUserId, args.id, ctx.locale);
      return true;
    },
  })
);

gqlSchemaBuilder.mutationField("setDefaultMeetingConfig", t =>
  t.field({
    type: UserMeetingConfigPothosObject,
    args: {
      id: t.arg.id({ required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return MeetingConfigService.setDefaultMeetingConfig(actorUserId, args.id, ctx.locale);
    },
  })
);

gqlSchemaBuilder.mutationField("createClassMeetingConfig", t =>
  t.field({
    type: ClassMeetingConfigPothosObject,
    args: {
      input: t.arg({ type: ClassMeetingConfigCreateInputPothos, required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return ClassMeetingConfigService.createClassMeetingConfig(
        actorUserId,
        {
          classInstanceId: args.input.classInstanceId,
          recurringScheduleId: args.input.recurringScheduleId,
          providerId: args.input.providerId,
          label: args.input.label,
          isDefault: args.input.isDefault,
          password: args.input.password,
          details: normalizeMeetingConfigDetails(args.input.details),
        },
        ctx.locale
      );
    },
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
    resolve: async (_parent, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return ClassMeetingConfigService.updateClassMeetingConfig(
        actorUserId,
        args.id,
        {
          ...normalizeConfigUpdateInput(args.input),
          ...(args.input.providerId != null ? { providerId: args.input.providerId } : {}),
        },
        ctx.locale
      );
    },
  })
);

gqlSchemaBuilder.mutationField("deleteClassMeetingConfig", t =>
  t.field({
    type: "Boolean",
    args: {
      id: t.arg.id({ required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      await ClassMeetingConfigService.deleteClassMeetingConfig(actorUserId, args.id, ctx.locale);
      return true;
    },
  })
);

gqlSchemaBuilder.mutationField("setDefaultClassMeetingConfig", t =>
  t.field({
    type: ClassMeetingConfigPothosObject,
    args: {
      id: t.arg.id({ required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return ClassMeetingConfigService.setDefaultClassMeetingConfig(actorUserId, args.id, ctx.locale);
    },
  })
);
