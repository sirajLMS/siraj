import { GraphQLError } from "graphql";
import { AppPermission, MeetingIntegrationProviderSlug } from "@/backend/enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  MeetingConnectionTestModePothosEnum,
  MeetingIntegrationConnectedAccountStatusPothosEnum,
  MeetingIntegrationProviderSlugPothosEnum,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import { handleMeetingChannelError } from "@/backend/graphql/utils/handle-meeting-channel-error";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { MeetingIntegrationService, MeetingOAuthService, type MeetingProvider } from "@/backend/services";
import type {
  AdminRevokeTokenReturnType,
  AdminRevokeTokenSubmitInput,
  ConnectMeetingProviderOAuthReturnType,
  ConnectMeetingProviderOAuthSubmitInput,
  DisconnectMeetingProviderOAuthReturnType,
  DisconnectMeetingProviderOAuthSubmitInput,
  MeetingIntegrationConnectedAccountReturnType,
  MeetingIntegrationProviderReturnType,
  MyConnectedMeetingProviderReturnType,
  TestMeetingConnectionReturnType,
  TestMeetingConnectionSubmitInput,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

const MEETING_PROVIDERS = new Set<string>(Object.values(MeetingIntegrationProviderSlug));

function isMeetingProvider(value: string): value is MeetingProvider {
  return MEETING_PROVIDERS.has(value);
}

// ─── Object Types ─────────────────────────────────────────────────────────────

const MeetingIntegrationProviderRef =
  gqlSchemaBuilder.objectRef<MeetingIntegrationProviderReturnType>("MeetingIntegrationProvider");

export const MeetingIntegrationProviderPothosObject = MeetingIntegrationProviderRef.implement({
  fields: t => ({
    id: t.field({
      type: "String",
      resolve: provider => provider.slug,
    }),
    slug: t.exposeString("slug"),
    kind: t.exposeString("kind"),
    credentialsHealthy: t.exposeBoolean("credentialsHealthy"),
    lastTestedAt: t.expose("lastTestedAt", { type: "DateTime", nullable: true }),
    connectedTeacherCount: t.exposeInt("connectedTeacherCount"),
    reauthNeededCount: t.exposeInt("reauthNeededCount"),
    endpoints: t.field({
      type: ["String"],
      resolve: provider => [...provider.endpoints],
    }),
  }),
});

const MeetingIntegrationConnectedAccountRef = gqlSchemaBuilder.objectRef<MeetingIntegrationConnectedAccountReturnType>(
  "MeetingIntegrationConnectedAccount"
);

export const MeetingIntegrationConnectedAccountPothosObject = MeetingIntegrationConnectedAccountRef.implement({
  fields: t => ({
    id: t.field({
      type: "String",
      resolve: account => `${account.userId}:${account.email ?? account.userId}`,
    }),
    userId: t.exposeString("userId"),
    name: t.exposeString("name", { nullable: true }),
    email: t.exposeString("email", { nullable: true }),
    connectedAt: t.expose("connectedAt", { type: "DateTime", nullable: true }),
    expiresAt: t.expose("expiresAt", { type: "DateTime", nullable: true }),
    lastRefreshedAt: t.expose("lastRefreshedAt", { type: "DateTime", nullable: true }),
    status: t.expose("status", { type: MeetingIntegrationConnectedAccountStatusPothosEnum }),
    scopes: t.exposeStringList("scopes", { nullable: true }),
  }),
});

const TestMeetingConnectionResultRef =
  gqlSchemaBuilder.objectRef<TestMeetingConnectionReturnType>("TestMeetingConnectionResult");

export const TestMeetingConnectionResultPothosObject = TestMeetingConnectionResultRef.implement({
  fields: t => ({
    id: t.field({
      type: "String",
      resolve: result => `${result.mode}:${result.latencyMs}`,
    }),
    ok: t.exposeBoolean("ok"),
    latencyMs: t.exposeInt("latencyMs"),
    mode: t.expose("mode", { type: MeetingConnectionTestModePothosEnum }),
    testJoinUrl: t.exposeString("testJoinUrl", { nullable: true }),
    deleted: t.exposeBoolean("deleted", { nullable: true }),
    upstreamResponseSummary: t.exposeString("upstreamResponseSummary"),
    errorCode: t.exposeString("errorCode", { nullable: true }),
    errorMessage: t.exposeString("errorMessage", { nullable: true }),
    rawUpstreamPayload: t.expose("rawUpstreamPayload", { type: "JSON", nullable: true }),
    requiredScopes: t.exposeStringList("requiredScopes", { nullable: true }),
    grantedScopes: t.exposeStringList("grantedScopes", { nullable: true }),
  }),
});

const AdminRevokeTokenResultRef = gqlSchemaBuilder.objectRef<AdminRevokeTokenReturnType>("AdminRevokeTokenResult");

export const AdminRevokeTokenResultPothosObject = AdminRevokeTokenResultRef.implement({
  fields: t => ({
    id: t.field({
      type: "String",
      resolve: result => `${result.userId}:${result.providerSlug}`,
    }),
    userId: t.exposeString("userId"),
    providerSlug: t.exposeString("providerSlug"),
    revoked: t.exposeBoolean("revoked"),
  }),
});

// ─── OAuth Connect / Disconnect object types ──────────────────────────────────

const MyConnectedMeetingProviderRef =
  gqlSchemaBuilder.objectRef<MyConnectedMeetingProviderReturnType>("MyConnectedMeetingProvider");

export const MyConnectedMeetingProviderPothosObject = MyConnectedMeetingProviderRef.implement({
  fields: t => ({
    id: t.field({
      type: "String",
      resolve: provider => `${provider.providerSlug}:${provider.email ?? provider.providerSlug}`,
    }),
    providerSlug: t.exposeString("providerSlug"),
    email: t.exposeString("email", { nullable: true }),
    connectedAt: t.expose("connectedAt", { type: "DateTime", nullable: true }),
    expiresAt: t.expose("expiresAt", { type: "DateTime", nullable: true }),
  }),
});

const ConnectMeetingProviderOAuthResultRef = gqlSchemaBuilder.objectRef<ConnectMeetingProviderOAuthReturnType>(
  "ConnectMeetingProviderOAuthResult"
);

export const ConnectMeetingProviderOAuthResultPothosObject = ConnectMeetingProviderOAuthResultRef.implement({
  fields: t => ({
    id: t.field({
      type: "String",
      resolve: result => result.state,
    }),
    authorizeUrl: t.exposeString("authorizeUrl"),
    state: t.exposeString("state"),
  }),
});

const DisconnectMeetingProviderOAuthResultRef = gqlSchemaBuilder.objectRef<DisconnectMeetingProviderOAuthReturnType>(
  "DisconnectMeetingProviderOAuthResult"
);

export const DisconnectMeetingProviderOAuthResultPothosObject = DisconnectMeetingProviderOAuthResultRef.implement({
  fields: t => ({
    id: t.field({
      type: "String",
      resolve: result => result.providerSlug,
    }),
    ok: t.exposeBoolean("ok"),
    providerSlug: t.exposeString("providerSlug"),
  }),
});

// ─── Input Types ──────────────────────────────────────────────────────────────

export const TestMeetingConnectionInputPothosObject = gqlSchemaBuilder
  .inputRef<TestMeetingConnectionSubmitInput>("TestMeetingConnectionInput")
  .implement({
    fields: t => ({
      providerSlug: t.field({ type: MeetingIntegrationProviderSlugPothosEnum, required: true }),
      mode: t.field({ type: MeetingConnectionTestModePothosEnum, required: true }),
    }),
  });

export const AdminRevokeTokenInputPothosObject = gqlSchemaBuilder
  .inputRef<AdminRevokeTokenSubmitInput>("AdminRevokeTokenInput")
  .implement({
    fields: t => ({
      userId: t.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      providerSlug: t.field({ type: MeetingIntegrationProviderSlugPothosEnum, required: true }),
    }),
  });

export const ConnectMeetingProviderOAuthInputPothosObject = gqlSchemaBuilder
  .inputRef<ConnectMeetingProviderOAuthSubmitInput>("ConnectMeetingProviderOAuthInput")
  .implement({
    fields: t => ({
      providerSlug: t.field({ type: MeetingIntegrationProviderSlugPothosEnum, required: true }),
      returnPath: t.string({ required: true, directives: { constraint: { maxLength: 2048 } } }),
    }),
  });

export const DisconnectMeetingProviderOAuthInputPothosObject = gqlSchemaBuilder
  .inputRef<DisconnectMeetingProviderOAuthSubmitInput>("DisconnectMeetingProviderOAuthInput")
  .implement({
    fields: t => ({
      providerSlug: t.field({ type: MeetingIntegrationProviderSlugPothosEnum, required: true }),
    }),
  });

// ─── Helpers ──────────────────────────────────────────────────────────────────

function canViewMeetingIntegrations(ctx: BaseContext): boolean {
  return (
    ctx.isSuperAdmin ||
    ctx.permissions.includes(AppPermission.SETTINGS_VIEW) ||
    ctx.permissions.includes(AppPermission.SETTINGS_EDIT_MEETING_INTEGRATIONS)
  );
}

function assertCanViewMeetingIntegrations(ctx: BaseContext, tErrors: ErrorsLabels): void {
  if (!canViewMeetingIntegrations(ctx)) {
    throw new GraphQLError(tErrors.insufficientPermissions, {
      extensions: { code: "FORBIDDEN" },
    });
  }
}

async function resolveAuthCtx(ctx: BaseContext): Promise<{ actorUserId: string; tErrors: ErrorsLabels }> {
  const actorUserId = await requireAuth(ctx);
  const tErrors = ctx.t().errorsTranslations;
  return { actorUserId, tErrors };
}

function hasManageOwnMeetingConfigs(ctx: BaseContext): boolean {
  return (
    ctx.isSuperAdmin ||
    ctx.permissions.includes(AppPermission.MEETING_CONFIGS_MANAGE_OWN) ||
    ctx.permissions.includes(AppPermission.SETTINGS_EDIT_MEETING_INTEGRATIONS)
  );
}

function assertCanManageOwnMeetingConfigs(ctx: BaseContext, tErrors: ErrorsLabels): void {
  if (!hasManageOwnMeetingConfigs(ctx)) {
    throw new GraphQLError(tErrors.insufficientPermissions, {
      extensions: { code: "FORBIDDEN" },
    });
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

gqlSchemaBuilder.queryField("meetingIntegrationProviders", t =>
  t.field({
    type: [MeetingIntegrationProviderPothosObject],
    authScopes: { loggedIn: true },
    resolve: async (_root, _args, ctx) => {
      const { actorUserId, tErrors } = await resolveAuthCtx(ctx);
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
      const { actorUserId, tErrors } = await resolveAuthCtx(ctx);
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
      const { actorUserId, tErrors } = await resolveAuthCtx(ctx);
      assertCanManageOwnMeetingConfigs(ctx, tErrors);
      return MeetingOAuthService.listOwnConnectedProviders(actorUserId, tErrors);
    },
  })
);

// ─── Mutations ────────────────────────────────────────────────────────────────

gqlSchemaBuilder.mutationField("testMeetingProviderConnection", t =>
  t.field({
    type: TestMeetingConnectionResultPothosObject,
    authScopes: { permission: AppPermission.SETTINGS_EDIT_MEETING_INTEGRATIONS, notImpersonating: true },
    args: {
      input: t.arg({ type: TestMeetingConnectionInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const { actorUserId, tErrors } = await resolveAuthCtx(ctx);
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
      const { actorUserId, tErrors } = await resolveAuthCtx(ctx);
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
      const { actorUserId, tErrors } = await resolveAuthCtx(ctx);
      assertCanManageOwnMeetingConfigs(ctx, tErrors);
      try {
        return await MeetingOAuthService.connectProviderOAuth(args.input, actorUserId, tErrors);
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
      const { actorUserId, tErrors } = await resolveAuthCtx(ctx);
      assertCanManageOwnMeetingConfigs(ctx, tErrors);
      return MeetingOAuthService.disconnectProviderOAuth(args.input, actorUserId, tErrors);
    },
  })
);
