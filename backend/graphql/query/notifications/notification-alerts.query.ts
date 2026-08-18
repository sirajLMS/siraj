import { GraphQLError } from "graphql";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { NotificationAlertsResultPothosObject } from "@/backend/graphql/pothos/notifications/notification-alerts.pothos";
import { NotificationAlertsService } from "@/backend/services";

gqlSchemaBuilder.queryFields(t => ({
  notificationAlerts: t.field({
    type: NotificationAlertsResultPothosObject,
    authScopes: { loggedIn: true },
    resolve: async (_root, _args, ctx) => {
      if (!ctx.user) {
        const tErrors = ctx.t().errorsTranslations;
        throw new GraphQLError(tErrors.unauthorized, { extensions: { code: "UNAUTHENTICATED" } });
      }
      return NotificationAlertsService.getAlerts(ctx.user.id, ctx.locale);
    },
  }),
}));
