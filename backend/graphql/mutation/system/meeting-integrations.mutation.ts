// Auto-extracted from pothos/ (types-review R3-P3).
// Mutation field registrations relocated to the mutation layer per mutation/AGENTS.md.

import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  AdminRevokeTokenInputPothosObject,
  AdminRevokeTokenResultPothosObject,
  assertCanManageOwnMeetingConfigs,
  ConnectMeetingProviderOAuthInputPothosObject,
  ConnectMeetingProviderOAuthResultPothosObject,
  DisconnectMeetingProviderOAuthInputPothosObject,
  DisconnectMeetingProviderOAuthResultPothosObject,
  resolveMeetingAuthCtx,
  TestMeetingConnectionInputPothosObject,
  TestMeetingConnectionResultPothosObject,
} from "@/backend/graphql/pothos/system/meeting-integrations.pothos";
import { handleMeetingChannelError } from "@/backend/graphql/utils/handle-meeting-channel-error";
import { MeetingIntegrationService, MeetingOAuthService } from "@/backend/services";

gqlSchemaBuilder.mutationField("testMeetingProviderConnection", t =>
  t.field({
    type: TestMeetingConnectionResultPothosObject,
    authScopes: { permission: AppPermission.SETTINGS_EDIT_MEETING_INTEGRATIONS, notImpersonating: true },
    args: {
      input: t.arg({ type: TestMeetingConnectionInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const { actorUserId, tErrors } = await resolveMeetingAuthCtx(ctx);
      try {
        return await MeetingIntegrationService.testConnection(actorUserId, args.input, tErrors);
      } catch (err) {
        handleMeetingChannelError(err, tErrors);
      }
      return undefined;
    },
  })
);

gqlSchemaBuilder.mutationField("adminRevokeMeetingProviderToken", t =>
  t.field({
    type: AdminRevokeTokenResultPothosObject,
    authScopes: { permission: AppPermission.SETTINGS_EDIT_MEETING_INTEGRATIONS, notImpersonating: true },
    args: {
      input: t.arg({ type: AdminRevokeTokenInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const { actorUserId, tErrors } = await resolveMeetingAuthCtx(ctx);
      return MeetingIntegrationService.revokeToken(actorUserId, args.input, tErrors);
    },
  })
);

gqlSchemaBuilder.mutationField("connectMeetingProviderOAuth", t =>
  t.field({
    type: ConnectMeetingProviderOAuthResultPothosObject,
    authScopes: { loggedIn: true },
    args: {
      input: t.arg({ type: ConnectMeetingProviderOAuthInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const { actorUserId, tErrors } = await resolveMeetingAuthCtx(ctx);
      assertCanManageOwnMeetingConfigs(ctx, tErrors);
      try {
        return await MeetingOAuthService.connectProviderOAuth(args.input, actorUserId, ctx.sessionId, tErrors);
      } catch (err) {
        handleMeetingChannelError(err, tErrors);
      }
      return undefined;
    },
  })
);

gqlSchemaBuilder.mutationField("disconnectMeetingProviderOAuth", t =>
  t.field({
    type: DisconnectMeetingProviderOAuthResultPothosObject,
    authScopes: { loggedIn: true },
    args: {
      input: t.arg({ type: DisconnectMeetingProviderOAuthInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const { actorUserId, tErrors } = await resolveMeetingAuthCtx(ctx);
      assertCanManageOwnMeetingConfigs(ctx, tErrors);
      return MeetingOAuthService.disconnectProviderOAuth(args.input, actorUserId, tErrors);
    },
  })
);
