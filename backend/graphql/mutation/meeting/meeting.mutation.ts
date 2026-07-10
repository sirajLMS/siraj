import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  MeetingProviderCreateInputPothos,
  MeetingProviderPothosObject,
  MeetingProviderUpdateInputPothos,
  UserMeetingConfigCreateInputPothos,
  UserMeetingConfigPothosObject,
  UserMeetingConfigUpdateInputPothos,
} from "@/backend/graphql/pothos/meeting/meeting.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { MeetingConfigService } from "@/backend/services/meeting/meeting-config.service";
import { MeetingProviderCatalogService } from "@/backend/services/meeting/meeting-provider-catalog.service";

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
          fieldSchema: args.input.fieldSchema,
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
      return MeetingProviderCatalogService.updateProvider(userId, args.id, args.input, ctx.locale);
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
          details: args.input.details,
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
      return MeetingConfigService.updateUserMeetingConfig(actorUserId, args.id, args.input, ctx.locale);
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
