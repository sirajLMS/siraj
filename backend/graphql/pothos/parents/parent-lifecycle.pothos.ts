import { AppPermission } from "@/backend/enum";
import { requireUserId } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { ParentStatusPothosEnum } from "@/backend/graphql/pothos/shared/enum.pothos";
import { ParentLifecycleService } from "@/backend/services";
import type { ChangeParentLifecycleResult } from "@/backend/types";

const ChangeParentLifecycleResultRef =
  gqlSchemaBuilder.objectRef<ChangeParentLifecycleResult>("ChangeParentLifecycleResult");

export const ChangeParentLifecycleResultPothosObject = ChangeParentLifecycleResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    lifecycleStatus: t.expose("lifecycleStatus", { type: ParentStatusPothosEnum }),
  }),
});

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
