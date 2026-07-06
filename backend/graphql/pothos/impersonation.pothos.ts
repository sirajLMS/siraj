import { GraphQLError } from "graphql";
import { UserRepository } from "@/backend/db/repo";
import { setAuthCookies } from "@/backend/lib/auth/cookies";
import { getBackendTranslations } from "@/backend/lib/intl";
import { ImpersonationService } from "@/backend/services/auth/impersonation.service";
import type {
  EndImpersonationReturnType,
  ImpersonationStatusReturnType,
  StartImpersonationReturnType,
} from "@/backend/types/impersonation.types";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import { UserPothosObject } from "./user.pothos";

export type ImpersonationStatusPothosDefinition = ImpersonationStatusReturnType;

export type StartImpersonationResponsePothosDefinition = StartImpersonationReturnType & {
  targetUserId: string;
};

const ImpersonationStatusPothosObjectRef =
  gqlSchemaBuilder.objectRef<ImpersonationStatusPothosDefinition>("ImpersonationStatus");

export const ImpersonationStatusPothosObject = ImpersonationStatusPothosObjectRef.implement({
  fields: t => ({
    isActive: t.exposeBoolean("isActive"),
    startedAt: t.expose("startedAt", { type: "DateTime", nullable: true }),
    expiresAt: t.expose("expiresAt", { type: "DateTime", nullable: true }),
    reason: t.exposeString("reason", { nullable: true }),
    targetUser: t.field({
      type: UserPothosObject,
      nullable: true,
      resolve: parent => (parent.targetUserId ? UserRepository.findById(parent.targetUserId) : null),
    }),
    actorUser: t.field({
      type: UserPothosObject,
      nullable: true,
      resolve: parent => (parent.actorUserId ? UserRepository.findById(parent.actorUserId) : null),
    }),
  }),
});

const StartImpersonationResponsePothosObjectRef = gqlSchemaBuilder.objectRef<StartImpersonationResponsePothosDefinition>(
  "StartImpersonationResponse"
);

export const StartImpersonationResponsePothosObject = StartImpersonationResponsePothosObjectRef.implement({
  fields: t => ({
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
      const tErrors = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
      const actorUserId = ctx.actorUserId ?? ctx.user?.id;
      if (!actorUserId || !ctx.sessionId) {
        throw new GraphQLError(tErrors("auth.impersonationSessionInvalid"), {
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
        ctx.locale
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
      const tErrors = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
      const actorUserId = ctx.actorUserId ?? ctx.user?.id;
      if (!actorUserId || !ctx.sessionId) {
        throw new GraphQLError(tErrors("auth.impersonationSessionInvalid"), {
          extensions: { code: "FORBIDDEN" },
        });
      }

      const result = await ImpersonationService.endImpersonation(
        actorUserId,
        ctx.sessionId,
        ctx.locale,
        ctx.ipAddress
      );

      if (ctx.refreshToken) {
        setAuthCookies(ctx.cookies, ctx.sessionId, ctx.refreshToken, result.token);
      } else if (ctx.cookies) {
        setAuthCookies(ctx.cookies, ctx.sessionId, "", result.token);
      }

      return result;
    },
  }),
}));
