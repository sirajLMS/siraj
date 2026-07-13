import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { LessonReportPothosObject } from "@/backend/graphql/pothos/classes/lesson-report.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { getBackendTranslations } from "@/backend/lib";
import { PermissionsService } from "@/backend/services";
import { LessonReportService } from "@/backend/services/classes/lesson-report.service";

gqlSchemaBuilder.mutationField("submitStudentLessonReportReflection", t =>
  t.field({
    type: LessonReportPothosObject,
    description: "Student adds their reflection/notes to an existing lesson report",
    authScopes: { loggedIn: true },
    args: {
      classInstanceId: t.arg.id({ required: true }),
      studentNotes: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const hasPermission = await PermissionsService.hasPermission(
        actorUserId,
        AppPermission.STUDENT_VIEW_OWN_DASHBOARD
      );
      if (!hasPermission) {
        const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
        throw new Error(tFunc("insufficientPermissions"));
      }
      return LessonReportService.submitStudentReflection(
        actorUserId,
        args.classInstanceId,
        args.studentNotes,
        ctx.locale
      );
    },
  })
);
