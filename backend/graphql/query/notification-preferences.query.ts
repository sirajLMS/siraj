import { NotificationPreferencesService } from "@/backend/services/notification/notification-preferences.service";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import { NotificationPreferencePothosObject } from "../pothos/notification-preferences.pothos";
import { requireAuth } from "../utils/requireAuth";

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
