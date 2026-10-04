import { MeetingProviderRepository } from "@/backend/db/repo/meeting/meeting-provider.repository";
import { AppPermission } from "@/backend/enum/permissions/permission.enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  extractCommonMeetingConfigFields,
  normalizeConfigUpdateInput,
  normalizeProviderCreateInput,
  normalizeProviderUpdateInput,
} from "@/backend/graphql/mutation/meeting/meeting.mutation.helpers";
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
import {
  ClassMeetingConfigService,
  MeetingConfigService,
  MeetingProviderCatalogService,
  meetingChannel,
  PermissionsService,
} from "@/backend/services";
import type { GenerateMeetingUrlResult } from "@/backend/types";

gqlSchemaBuilder.mutationField("createMeetingProvider", t =>
  t.field({
    type: MeetingProviderPothosObject,
    args: {
      input: t.arg({ type: MeetingProviderCreateInputPothos, required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: withAuthResult((userId, args, tErrors) =>
      MeetingProviderCatalogService.createProvider(userId, normalizeProviderCreateInput(args.input, tErrors), tErrors)
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
          ...extractCommonMeetingConfigFields(args.input, tErrors),
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
          ...extractCommonMeetingConfigFields(args.input, tErrors),
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
        handleMeetingChannelError(err, tErrors);
      }
      return undefined;
    },
  })
);
