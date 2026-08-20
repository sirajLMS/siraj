import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { setBillingFxDisplayCurrencyForSubject } from "@/backend/graphql/pothos/billing/fx-display.pothos";
import { UnifiedProfilePothosObject } from "@/backend/graphql/pothos/profile/profile.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { ProfileService } from "@/backend/services";

gqlSchemaBuilder.queryField("profileByUserId", t =>
  t.field({
    type: UnifiedProfilePothosObject,
    authScopes: { loggedIn: true },
    args: {
      userId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    },
    resolve: async (_parent, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      await setBillingFxDisplayCurrencyForSubject(ctx, args.userId, actorUserId);
      return ProfileService.getProfileByUserId(actorUserId, args.userId, ctx.locale, {
        permissionContext: { permissions: ctx.permissions, isSuperAdmin: ctx.isSuperAdmin },
      });
    },
  })
);
