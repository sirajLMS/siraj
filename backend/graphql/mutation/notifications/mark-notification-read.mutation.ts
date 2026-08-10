import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { NotificationAlertsService } from "@/backend/services/notification/notification-alerts.service";

/**
 * `markNotificationRead` — mark a single delivery as OPENED by deliveryId.
 */
gqlSchemaBuilder.mutationField("markNotificationRead", t =>
  t.field({
    type: "Boolean",
    authScopes: { loggedIn: true },
    args: {
      deliveryId: t.arg.id({ required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      await NotificationAlertsService.markOneAlertRead(actorUserId, args.deliveryId, ctx.locale);
      return true;
    },
  })
);
