import { GraphQLError } from "graphql";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { UserPothosObject } from "@/backend/graphql/pothos/users";
import { setAuthCookies } from "@/backend/lib/auth/cookies";
import { ImpersonationService } from "@/backend/services/auth/impersonation.service";
import type {
  EndImpersonationReturnType,
  ImpersonationStatusReturnType,
  StartImpersonationReturnType,
} from "@/backend/types";

const ImpersonationStatusPothosObjectRef =
  gqlSchemaBuilder.objectRef<ImpersonationStatusReturnType>("ImpersonationStatus");

export const ImpersonationStatusPothosObject = ImpersonationStatusPothosObjectRef.implement({
  fields: t => ({
    id: t.exposeID("targetUserId", { nullable: true }),
    isActive: t.exposeBoolean("isActive"),
    startedAt: t.expose("startedAt", { type: "DateTime", nullable: true }),
    expiresAt: t.expose("expiresAt", { type: "DateTime", nullable: true }),
    reason: t.exposeString("reason", { nullable: true }),
    targetUser: t.loadable({
      type: UserPothosObject,
      nullable: true,
      load: (ids: string[], ctx) => UserPothosObject.getDataloader(ctx).loadMany(ids),
      resolve: parent => parent.targetUserId,
    }),
    actorUser: t.loadable({
      type: UserPothosObject,
      nullable: true,
      load: (ids: string[], ctx) => UserPothosObject.getDataloader(ctx).loadMany(ids),
      resolve: parent => parent.actorUserId,
    }),
  }),
});

const StartImpersonationResponsePothosObjectRef = gqlSchemaBuilder.objectRef<
  StartImpersonationReturnType & { targetUserId: string }
>("StartImpersonationResponse");

export const StartImpersonationResponsePothosObject = StartImpersonationResponsePothosObjectRef.implement({
  fields: t => ({
    id: t.exposeID("impersonationSessionId"),
    token: t.exposeString("token"),
    expiresAt: t.expose("expiresAt", { type: "DateTime" }),
    impersonationSessionId: t.exposeString("impersonationSessionId"),
    targetUser: t.loadable({
      type: UserPothosObject,
      load: (ids: string[], ctx) => UserPothosObject.getDataloader(ctx).loadMany(ids),
      resolve: parent => parent.targetUserId,
    }),
  }),
});

const EndImpersonationResponsePothosObjectRef =
  gqlSchemaBuilder.objectRef<EndImpersonationReturnType>("EndImpersonationResponse");

export const EndImpersonationResponsePothosObject = EndImpersonationResponsePothosObjectRef.implement({
  fields: t => ({
    token: t.exposeString("token"),
  }),
});

gqlSchemaBuilder.queryFields(t => ({
  impersonationStatus: t.field({
    type: ImpersonationStatusPothosObject,
    authScopes: { loggedIn: true },
    resolve: async (_parent, _args, ctx) => {
      const actorUserId = ctx.actorUserId ?? ctx.user?.id;
      if (!actorUserId || !ctx.sessionId) {
        return { isActive: false };
      }

      return ImpersonationService.getStatusForSession(ctx.sessionId, actorUserId);
    },
  }),
}));

gqlSchemaBuilder.mutationFields(t => ({
  startImpersonation: t.field({
    type: StartImpersonationResponsePothosObject,
    authScopes: { superAdmin: true, notImpersonating: true, notSimulatingGroup: true },
    args: {
      targetUserId: t.arg.string({ required: true }),
      reason: t.arg.string({ required: false }),
    },
    resolve: async (_parent, args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      if (ctx.isImpersonating) {
        throw new GraphQLError(tErrors.auth.impersonationNotAllowedDuringSession, {
          extensions: { code: "FORBIDDEN" },
        });
      }
      const actorUserId = ctx.actorUserId ?? ctx.user?.id;
      if (!actorUserId || !ctx.sessionId) {
        throw new GraphQLError(tErrors.auth.impersonationSessionInvalid, {
          extensions: { code: "FORBIDDEN" },
        });
      }

      const result = await ImpersonationService.startImpersonation(
        {
          actorUserId,
          targetUserId: args.targetUserId,
          sessionId: ctx.sessionId,
          reason: args.reason ?? null,
          ipAddress: ctx.ipAddress ?? null,
          userAgent: null,
        },
        tErrors
      );

      if (ctx.refreshToken) {
        setAuthCookies(ctx.cookies, ctx.sessionId, ctx.refreshToken, result.token);
      } else if (ctx.cookies) {
        setAuthCookies(ctx.cookies, ctx.sessionId, "", result.token);
      }

      return {
        ...result,
        targetUserId: args.targetUserId,
      };
    },
  }),

  endImpersonation: t.field({
    type: EndImpersonationResponsePothosObject,
    authScopes: { loggedIn: true },
    resolve: async (_parent, _args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      const actorUserId = ctx.actorUserId ?? ctx.user?.id;
      if (!actorUserId || !ctx.sessionId) {
        throw new GraphQLError(tErrors.auth.impersonationSessionInvalid, {
          extensions: { code: "FORBIDDEN" },
        });
      }

      const result = await ImpersonationService.endImpersonation(actorUserId, ctx.sessionId, tErrors, ctx.ipAddress);

      if (ctx.refreshToken) {
        setAuthCookies(ctx.cookies, ctx.sessionId, ctx.refreshToken, result.token);
      } else if (ctx.cookies) {
        setAuthCookies(ctx.cookies, ctx.sessionId, "", result.token);
      }

      return result;
    },
  }),
}));
