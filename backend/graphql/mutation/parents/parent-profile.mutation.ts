// Auto-extracted from pothos/ (types-review R3-P3).
// Mutation field registrations relocated to the mutation layer per mutation/AGENTS.md.

import { AppPermission } from "@/backend/enum";
import { requireUserId } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  DeactivateParentResultRef,
  EditQuotaResultRef,
  ReactivateParentResultRef,
} from "@/backend/graphql/pothos/parents/parent-profile.pothos";
import { ParentProfileService, StudentManagementService } from "@/backend/services";

gqlSchemaBuilder.mutationField("deactivateParent", t =>
  t.field({
    type: DeactivateParentResultRef,
    authScopes: { permission: AppPermission.PARENT_MANAGE_STATUS },
    args: {
      parentId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    },
    resolve: async (_root, args, ctx) => {
      return ParentProfileService.deactivateAccount(requireUserId(ctx), args.parentId, ctx.locale);
    },
  })
);

gqlSchemaBuilder.mutationField("reactivateParent", t =>
  t.field({
    type: ReactivateParentResultRef,
    authScopes: { permission: AppPermission.PARENT_MANAGE_STATUS },
    args: {
      parentId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    },
    resolve: async (_root, args, ctx) => {
      return ParentProfileService.reactivateAccount(requireUserId(ctx), args.parentId, ctx.locale);
    },
  })
);

gqlSchemaBuilder.mutationField("updateStudentQuota", t =>
  t.field({
    type: EditQuotaResultRef,
    authScopes: { permission: AppPermission.STUDENT_QUOTA_EDIT_EDIT_OTHER },
    args: {
      studentId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      newClassesRemaining: t.arg.int({ required: true, directives: { constraint: { min: 0, max: 1000000 } } }),
      expectedVersion: t.arg.int({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      return StudentManagementService.editQuota(
        requireUserId(ctx),
        args.studentId,
        tErrors,
        args.newClassesRemaining,
        args.expectedVersion ?? undefined
      );
    },
  })
);
