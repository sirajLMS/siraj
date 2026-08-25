// Auto-extracted from pothos/ (types-review R3-P3).
// Mutation field registrations relocated to the mutation layer per mutation/AGENTS.md.

import { AppPermission } from "@/backend/enum";
import { requireUserId } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { ChangeParentLifecycleResultRef } from "@/backend/graphql/pothos/parents/parent-lifecycle.pothos";
import { ParentStatusPothosEnum } from "@/backend/graphql/pothos/shared/enum.pothos";
import { ParentLifecycleService } from "@/backend/services";

gqlSchemaBuilder.mutationField("changeParentLifecycleStatus", t =>
  t.field({
    type: ChangeParentLifecycleResultRef,
    authScopes: { permission: AppPermission.PARENT_MANAGE_STATUS },
    args: {
      parentId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      newStatus: t.arg({ type: ParentStatusPothosEnum, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      return ParentLifecycleService.changeLifecycleStatus(
        requireUserId(ctx),
        args.parentId,
        args.newStatus,
        ctx.locale
      );
    },
  })
);
