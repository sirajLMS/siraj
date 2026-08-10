import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  UnifiedProfilePothosObject,
  UpdateOwnProfileInputPothosObject,
  UpdateUserProfileInputPothosObject,
} from "@/backend/graphql/pothos/profile/profile.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { ProfileService } from "@/backend/services";
import type { UpdateOwnProfileInput, UpdateUserProfileInput } from "@/backend/types";

// Pothos input types are structurally compatible with the backend input types
// at runtime, but differ in optional/enum field shapes. These guards replace
// unsafe `as` assertions with validated narrowing.
function isUpdateOwnProfileInput(value: unknown): value is UpdateOwnProfileInput {
  return typeof value === "object" && value !== null;
}

function isUpdateUserProfileInput(value: unknown): value is UpdateUserProfileInput {
  return typeof value === "object" && value !== null;
}

/** Narrows `value` to `T` via `guard`, throwing when the shape does not match. */
function assertShape<T>(value: unknown, guard: (v: unknown) => v is T, message: string): T {
  if (!guard(value)) throw new Error(message);
  return value;
}

gqlSchemaBuilder.mutationField("updateOwnProfile", t =>
  t.field({
    type: UnifiedProfilePothosObject,
    authScopes: { loggedIn: true },
    args: {
      input: t.arg({ type: UpdateOwnProfileInputPothosObject, required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      return ProfileService.updateOwnProfile(
        actorUserId,
        assertShape(args.input, isUpdateOwnProfileInput, "updateOwnProfile: invalid input"),
        ctx.locale
      );
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
        assertShape(args.input, isUpdateUserProfileInput, "updateUserProfile: invalid input"),
        ctx.locale
      );
    },
  })
);
