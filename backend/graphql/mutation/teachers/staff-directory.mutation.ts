// Auto-extracted from pothos/ (types-review R3-P3).
// Mutation field registrations relocated to the mutation layer per mutation/AGENTS.md.

import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  ManagerDirectoryRowPothosObject,
  UpdateManagerProfileInputPothosObject,
} from "@/backend/graphql/pothos/teachers/staff-directory.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { ManagerProfileService } from "@/backend/services";

gqlSchemaBuilder.mutationField("updateManagerProfile", t =>
  t.field({
    type: ManagerDirectoryRowPothosObject,
    authScopes: { superAdmin: true },
    args: {
      staffProfileId: t.arg.id({ required: true }),
      input: t.arg({ type: UpdateManagerProfileInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const locale = ctx.locale || "en";

      return await ManagerProfileService.updateManagerProfile(actorUserId, args.staffProfileId, args.input, locale);
    },
    description: "Updates a manager's profile fields.",
  })
);
