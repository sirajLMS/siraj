import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { TeacherDuePothosObject } from "@/backend/graphql/pothos/teachers/teacher-due.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { getBackendTranslations } from "@/backend/lib";
import { PermissionsService } from "@/backend/services";
import { TeacherDueService } from "@/backend/services/teacher/teacher-due.service";

gqlSchemaBuilder.mutationField("markTeacherDuesPaid", t =>
  t.field({
    type: [TeacherDuePothosObject],
    description: "Mark pending teacher dues as paid (batch operation)",
    authScopes: { loggedIn: true },
    args: {
      dueIds: t.arg.idList({ required: true }),
      teacherPaymentId: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.TEACHER_DUES_VIEW);
      if (!hasPermission) {
        const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
        throw new Error(tFunc("insufficientPermissions"));
      }
      return TeacherDueService.markAsPaid(actorUserId, args.dueIds, args.teacherPaymentId, ctx.locale);
    },
  })
);
