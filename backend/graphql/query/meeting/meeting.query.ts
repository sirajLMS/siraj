import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  ClassMeetingConfigPothosObject,
  MeetingProviderPothosObject,
  UserMeetingConfigPothosObject,
} from "@/backend/graphql/pothos/meeting/meeting.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { ClassMeetingConfigService, MeetingConfigService } from "@/backend/services/meeting";
import { MeetingProviderCatalogService } from "@/backend/services/meeting/meeting-provider-catalog.service";

gqlSchemaBuilder.queryField("meetingProviders", t =>
  t.field({
    type: [MeetingProviderPothosObject],
    args: {
      activeOnly: t.arg.boolean({ required: false, defaultValue: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      return MeetingProviderCatalogService.listProviders(userId, args.activeOnly ?? true, ctx.locale);
    },
  })
);

gqlSchemaBuilder.queryField("meetingProvider", t =>
  t.field({
    type: MeetingProviderPothosObject,
    args: {
      id: t.arg.id({ required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      return MeetingProviderCatalogService.getProviderById(userId, args.id, ctx.locale);
    },
  })
);

gqlSchemaBuilder.queryField("userMeetingConfigs", t =>
  t.field({
    type: [UserMeetingConfigPothosObject],
    args: {
      userId: t.arg.id({ required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return MeetingConfigService.listUserMeetingConfigs(actorUserId, args.userId, ctx.locale);
    },
  })
);

gqlSchemaBuilder.queryField("userMeetingConfig", t =>
  t.field({
    type: UserMeetingConfigPothosObject,
    args: {
      id: t.arg.id({ required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return MeetingConfigService.getUserMeetingConfig(actorUserId, args.id, ctx.locale);
    },
  })
);

gqlSchemaBuilder.queryField("classMeetingConfigs", t =>
  t.field({
    type: [ClassMeetingConfigPothosObject],
    args: {
      classInstanceId: t.arg.id({ required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return ClassMeetingConfigService.listClassMeetingConfigs(actorUserId, args.classInstanceId, ctx.locale);
    },
  })
);

gqlSchemaBuilder.queryField("recurringMeetingConfigs", t =>
  t.field({
    type: [ClassMeetingConfigPothosObject],
    args: {
      recurringScheduleId: t.arg.id({ required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return ClassMeetingConfigService.listRecurringMeetingConfigs(actorUserId, args.recurringScheduleId, ctx.locale);
    },
  })
);
