import { ProfileService } from "@/backend/services";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import { UnifiedProfilePothosObject } from "../pothos/profile.pothos";
import { requireAuth } from "../utils/requireAuth";

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
