import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  LessonReportPothosObject,
  LessonReportSubmitInput,
} from "@/backend/graphql/pothos/classes/lesson-report.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { LessonReportService, PermissionsService } from "@/backend/services";

gqlSchemaBuilder.mutationField("submitLessonReport", t =>
  t.field({
    type: LessonReportPothosObject,
    description: "Submit a lesson report for a completed class instance (teacher action)",
    authScopes: { loggedIn: true },
    args: {
      classInstanceId: t.arg.id({ required: true }),
      input: t.arg({ type: LessonReportSubmitInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.LESSON_REPORTS_SUBMIT);
      if (!hasPermission) {
        const tErrors = ctx.t().errorsTranslations;
        throw new Error(tErrors.insufficientPermissions);
      }

      return LessonReportService.submitReport(
        actorUserId,
        {
          classInstanceId: args.input.classInstanceId,
          attendanceEvaluation: args.input.attendanceEvaluation,
          durationMinutes: args.input.durationMinutes,
          teacherNotes: args.input.teacherNotes ?? undefined,
          completionPercentage: args.input.completionPercentage,
        },
        ctx.locale
      );
    },
  })
);

gqlSchemaBuilder.mutationField("approveLessonReport", t =>
  t.field({
    type: LessonReportPothosObject,
    description: "Approve a pending lesson report (supervisor/manager action)",
    authScopes: { loggedIn: true },
    args: {
      reportId: t.arg.id({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.LESSON_REPORTS_APPROVE);
      if (!hasPermission) {
        const tErrors = ctx.t().errorsTranslations;
        throw new Error(tErrors.insufficientPermissions);
      }

      return LessonReportService.approveReport(actorUserId, args.reportId, ctx.locale);
    },
  })
);

gqlSchemaBuilder.mutationField("rejectLessonReport", t =>
  t.field({
    type: LessonReportPothosObject,
    description: "Reject a pending lesson report with a rejection reason (supervisor/manager action)",
    authScopes: { loggedIn: true },
    args: {
      reportId: t.arg.id({ required: true }),
      rejectionReason: t.arg.string({ required: true, directives: { constraint: { maxLength: 2000 } } }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.LESSON_REPORTS_REJECT);
      if (!hasPermission) {
        const tErrors = ctx.t().errorsTranslations;
        throw new Error(tErrors.insufficientPermissions);
      }

      return LessonReportService.rejectReport(
        actorUserId,
        {
          reportId: args.reportId,
          rejectionReason: args.rejectionReason,
        },
        ctx.locale
      );
    },
  })
);
