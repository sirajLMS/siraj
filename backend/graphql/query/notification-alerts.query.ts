import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { NotificationAlertsResultPothosObject } from "@/backend/graphql/pothos/notifications/notification-alerts.pothos";
import { NotificationAlertsService } from "@/backend/services/notification/notification-alerts.service";

gqlSchemaBuilder.queryFields(t => ({
  notificationAlerts: t.field({
    type: NotificationAlertsResultPothosObject,
    authScopes: { loggedIn: true },
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user) {
        throw new Error("Unauthorized");
      }
      return NotificationAlertsService.getAlerts(ctx.user.id, ctx.locale);
    },
  }),
}));
