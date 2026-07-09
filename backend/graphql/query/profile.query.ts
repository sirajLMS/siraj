import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { UnifiedProfilePothosObject } from "@/backend/graphql/pothos/profile.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { ProfileService } from "@/backend/services";

gqlSchemaBuilder.queryField("profileByUserId", t =>
  t.field({
    type: UnifiedProfilePothosObject,
    authScopes: { loggedIn: true },
    args: {
      userId: t.arg.string({ required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return ProfileService.getProfileByUserId(actorUserId, args.userId, ctx.locale);
    },
  })
);
