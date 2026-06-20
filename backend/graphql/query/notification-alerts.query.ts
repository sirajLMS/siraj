import { NotificationAlertsService } from "@/backend/services/notification/notification-alerts.service";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import { NotificationAlertsResultPothosObject } from "../pothos/notification-alerts.pothos";

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
