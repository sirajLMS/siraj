import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  NotificationPreferenceInputPothosObject,
  NotificationPreferencePothosObject,
} from "@/backend/graphql/pothos/notifications/notification-preferences.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { NotificationPreferencesService } from "@/backend/services";

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
