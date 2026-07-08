import { NotificationPreferencesService } from "@/backend/services/notification/notification-preferences.service";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import {
  NotificationPreferenceInputPothosObject,
  NotificationPreferencePothosObject,
} from "../pothos/notification-preferences.pothos";
import { requireAuth } from "../utils/requireAuth";

gqlSchemaBuilder.mutationField("updateNotificationPreferences", t =>
  t.field({
    type: [NotificationPreferencePothosObject],
    authScopes: { loggedIn: true },
    args: {
      input: t.arg({ type: [NotificationPreferenceInputPothosObject], required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return NotificationPreferencesService.updatePreferences(actorUserId, args.input, ctx.locale);
    },
  })
);
