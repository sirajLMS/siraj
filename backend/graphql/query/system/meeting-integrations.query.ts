// Auto-extracted from pothos/ (types-review R3-P3).
// Query field registrations relocated to the query layer per query/AGENTS.md.

import { GraphQLError } from "graphql";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  assertCanManageOwnMeetingConfigs,
  assertCanViewMeetingIntegrations,
  isMeetingProvider,
  MeetingIntegrationConnectedAccountPothosObject,
  MeetingIntegrationProviderPothosObject,
  MyConnectedMeetingProviderPothosObject,
  resolveMeetingAuthCtx,
} from "@/backend/graphql/pothos/system/meeting-integrations.pothos";
import { MeetingIntegrationService, MeetingOAuthService } from "@/backend/services";
import type { MeetingProvider } from "@/backend/types";

gqlSchemaBuilder.queryField("meetingIntegrationProviders", t =>
  t.field({
    type: [MeetingIntegrationProviderPothosObject],
    authScopes: { loggedIn: true },
    resolve: async (_root, _args, ctx) => {
      const { actorUserId, tErrors } = await resolveMeetingAuthCtx(ctx);
      assertCanViewMeetingIntegrations(ctx, tErrors);
      return MeetingIntegrationService.listIntegrationProviders(actorUserId, tErrors);
    },
  })
);

gqlSchemaBuilder.queryField("meetingIntegrationConnectedAccounts", t =>
  t.field({
    type: [MeetingIntegrationConnectedAccountPothosObject],
    authScopes: { loggedIn: true },
    args: {
      providerSlug: t.arg.string({ required: true, directives: { constraint: { maxLength: 100 } } }),
    },
    resolve: async (_root, args, ctx) => {
      const { actorUserId, tErrors } = await resolveMeetingAuthCtx(ctx);
      assertCanViewMeetingIntegrations(ctx, tErrors);
      const providerSlug: MeetingProvider | null = isMeetingProvider(args.providerSlug) ? args.providerSlug : null;
      if (!providerSlug) {
        throw new GraphQLError(tErrors.meetingProvider.meetingProviderNotFound(args.providerSlug), {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }
      return MeetingIntegrationService.listConnectedAccounts(actorUserId, providerSlug, tErrors);
    },
  })
);

gqlSchemaBuilder.queryField("myConnectedMeetingProviders", t =>
  t.field({
    type: [MyConnectedMeetingProviderPothosObject],
    authScopes: { loggedIn: true },
    resolve: async (_root, _args, ctx) => {
      const { actorUserId, tErrors } = await resolveMeetingAuthCtx(ctx);
      assertCanManageOwnMeetingConfigs(ctx, tErrors);
      return MeetingOAuthService.listOwnConnectedProviders(actorUserId, tErrors);
    },
  })
);
