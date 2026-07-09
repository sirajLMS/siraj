import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { NotificationPreferencePothosObject } from "@/backend/graphql/pothos/notification-preferences.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { NotificationPreferencesService } from "@/backend/services/notification/notification-preferences.service";

gqlSchemaBuilder.queryFields(t => ({
  notificationPreferences: t.field({
    type: [NotificationPreferencePothosObject],
    authScopes: { loggedIn: true },
    resolve: async (_root, _args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return NotificationPreferencesService.getPreferences(actorUserId, ctx.locale);
    },
  }),
}));
