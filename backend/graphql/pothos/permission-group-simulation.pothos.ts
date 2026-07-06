import { GraphQLError } from "graphql";
import { setAuthCookies } from "@/backend/lib/auth/cookies";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionGroupSimulationService } from "@/backend/services/auth/permission-group-simulation.service";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import {
  EndPermissionGroupSimulationResponsePothosObject,
  PermissionGroupSimulationStatusPothosObject,
  SimulatablePermissionGroupPothosObject,
  StartPermissionGroupSimulationResponsePothosObject,
} from "./permission-group-simulation.objects.pothos";

export {
  EndPermissionGroupSimulationResponsePothosObject,
  PermissionGroupSimulationStatusPothosObject,
  SimulatablePermissionGroupPothosObject,
  StartPermissionGroupSimulationResponsePothosObject,
};

gqlSchemaBuilder.queryFields(t => ({
  permissionGroupSimulationStatus: t.field({
    type: PermissionGroupSimulationStatusPothosObject,
    authScopes: { loggedIn: true },
    resolve: async (_parent, _args, ctx) => {
      const actorUserId = ctx.realUserId ?? ctx.user?.id;
      if (!actorUserId || !ctx.sessionId) {
        return { isActive: false };
      }

      return PermissionGroupSimulationService.getStatusForSession(
        ctx.sessionId,
        actorUserId,
        ctx.isSimulatingGroup && ctx.simulatedGroupSlug
          ? { groupSlug: ctx.simulatedGroupSlug }
          : undefined
      );
    },
  }),

  simulatablePermissionGroups: t.field({
    type: [SimulatablePermissionGroupPothosObject],
    authScopes: { superAdmin: true, notImpersonating: true },
    resolve: async (_parent, _args, ctx) => {
      const actorUserId = ctx.realUserId ?? ctx.user?.id;
      if (!actorUserId) {
        return [];
      }
      const groups = await PermissionGroupSimulationService.listSimulatableGroups(actorUserId);
      if (ctx.isSimulatingGroup && ctx.simulatedGroupSlug) {
        return groups.filter(group => group.slug !== ctx.simulatedGroupSlug);
      }
      return groups;
    },
  }),
}));

gqlSchemaBuilder.mutationFields(t => ({
  startPermissionGroupSimulation: t.field({
    type: StartPermissionGroupSimulationResponsePothosObject,
    authScopes: { superAdmin: true, notImpersonating: true },
    args: {
      groupSlug: t.arg.string({ required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const tErrors = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
      const actorUserId = ctx.realUserId ?? ctx.user?.id;
      if (!actorUserId || !ctx.sessionId) {
        throw new GraphQLError(tErrors("auth.groupSimulationSessionInvalid"), {
          extensions: { code: "FORBIDDEN" },
        });
      }

      const result = await PermissionGroupSimulationService.startSimulation(
        {
          actorUserId,
          groupSlug: args.groupSlug,
          sessionId: ctx.sessionId,
          ipAddress: ctx.ipAddress ?? null,
        },
        ctx.locale
      );

      if (ctx.refreshToken) {
        setAuthCookies(ctx.cookies, ctx.sessionId, ctx.refreshToken, result.token);
      } else if (ctx.cookies) {
        setAuthCookies(ctx.cookies, ctx.sessionId, "", result.token);
      }

      return result;
    },
  }),

  endPermissionGroupSimulation: t.field({
    type: EndPermissionGroupSimulationResponsePothosObject,
    authScopes: { loggedIn: true },
    resolve: async (_parent, _args, ctx) => {
      const tErrors = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
      const actorUserId = ctx.realUserId ?? ctx.user?.id;
      if (!actorUserId || !ctx.sessionId) {
        throw new GraphQLError(tErrors("auth.groupSimulationSessionInvalid"), {
          extensions: { code: "FORBIDDEN" },
        });
      }

      const result = await PermissionGroupSimulationService.endSimulation(
        actorUserId,
        ctx.sessionId,
        ctx.locale,
        ctx.ipAddress,
        ctx.isSimulatingGroup ? ctx.simulatedGroupSlug : null
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
