import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { NotificationAlertsService } from "@/backend/services/notification/notification-alerts.service";

/**
 * `markNotificationsRead` mutation (specs.md S7 task B2).
 *
 * Returns the count of deliveries the service attempted to mark as OPENED.
 * Per-row failures inside `NotificationAlertsService.markAlertsRead` are
 * caught and logged there; the mutation still resolves with the count of
 * rows that were touched, so the client can refetch its alert panel
 * regardless. The Pothos schema exposes this as a non-null `Int`.
 */
gqlSchemaBuilder.mutationField("markNotificationsRead", t =>
  t.field({
    type: "Int",
    authScopes: { loggedIn: true },
    resolve: async (_parent, _args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const result = await NotificationAlertsService.markAlertsRead(actorUserId, ctx.locale);
      return result.updatedCount;
    },
  })
);
