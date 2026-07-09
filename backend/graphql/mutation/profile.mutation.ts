import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  UnifiedProfilePothosObject,
  UpdateOwnProfileInputPothosObject,
  UpdateUserProfileInputPothosObject,
} from "@/backend/graphql/pothos/profile.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { ProfileService } from "@/backend/services";
import type { UpdateOwnProfileInput, UpdateUserProfileInput } from "@/backend/types";

gqlSchemaBuilder.mutationField("updateOwnProfile", t =>
  t.field({
    type: UnifiedProfilePothosObject,
    authScopes: { loggedIn: true },
    args: {
      input: t.arg({ type: UpdateOwnProfileInputPothosObject, required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return ProfileService.updateOwnProfile(actorUserId, args.input as UpdateOwnProfileInput, ctx.locale);
    },
  })
);

gqlSchemaBuilder.mutationField("updateUserProfile", t =>
  t.field({
    type: UnifiedProfilePothosObject,
    authScopes: { loggedIn: true },
    args: {
      userId: t.arg.string({ required: true }),
      input: t.arg({ type: UpdateUserProfileInputPothosObject, required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return ProfileService.updateUserProfile(
        actorUserId,
        args.userId,
        args.input as UpdateUserProfileInput,
        ctx.locale
      );
    },
  })
);
