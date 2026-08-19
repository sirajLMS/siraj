import { GraphQLError } from "graphql";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { NotificationAlertsResultPothosObject } from "@/backend/graphql/pothos/notifications/notification-alerts.pothos";
import { NotificationAlertsService } from "@/backend/services";
import type { UserPermissionContext } from "@/backend/types";

gqlSchemaBuilder.queryFields(t => ({
  notificationAlerts: t.field({
    type: NotificationAlertsResultPothosObject,
    authScopes: { loggedIn: true },
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user) {
        const tErrors = ctx.t().errorsTranslations;
        throw new GraphQLError(tErrors.unauthorized, { extensions: { code: "UNAUTHENTICATED" } });
      }
      const userPermissionContext: UserPermissionContext = {
        permissions: ctx.permissions,
        permissionGroups: ctx.permissionGroups,
        isSuperAdmin: ctx.isSuperAdmin,
        role: ctx.role,
      };
      return NotificationAlertsService.getAlerts(ctx.user.id, userPermissionContext, ctx.locale);
    },
  }),
}));
