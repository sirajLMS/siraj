import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { TeacherDuePothosObject } from "@/backend/graphql/pothos/teachers/teacher-due.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { TeacherDueService } from "@/backend/services/teacher/teacher-due.service";

gqlSchemaBuilder.mutationField("markTeacherDuesPaid", t =>
  t.field({
    type: [TeacherDuePothosObject],
    description: "Mark pending teacher dues as paid (batch operation)",
    authScopes: { permission: AppPermission.TEACHER_DUES_MARK_PAID },
    args: {
      dueIds: t.arg.idList({ required: true }),
      teacherPaymentId: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.TEACHER_DUES_MARK_PAID);
      if (!hasPermission) {
        const tErrors = ctx.t().errorsTranslations;
        throw new Error(tErrors.insufficientPermissions);
      }
      return TeacherDueService.markAsPaid(actorUserId, args.dueIds, args.teacherPaymentId, ctx.locale);
    },
  })
);
