import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { StudentMonthlyReportPothosObject } from "@/backend/graphql/pothos/reports/monthly-report.pothos";
import { TeacherMonthlyReportPothosObject } from "@/backend/graphql/pothos/teachers/teacher-due.pothos";
import { StudentMonthlyReportService, TeacherMonthlyReportService } from "@/backend/services/report";

gqlSchemaBuilder.queryField("teacherMonthlyReport", t =>
  t.field({
    type: TeacherMonthlyReportPothosObject,
    description: "Aggregated monthly report for a single teacher: lessons taught, dues, and cancellation count.",
    authScopes: { loggedIn: true },
    args: {
      teacherId: t.arg.id({ required: true }),
      year: t.arg.int({ required: true }),
      month: t.arg.int({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user?.id) {
        throw new Error("unauthenticated");
      }
      return TeacherMonthlyReportService.getMonthlyReport(
        ctx.user.id,
        String(args.teacherId),
        args.year,
        args.month,
        ctx.locale
      );
    },
  })
);

gqlSchemaBuilder.queryField("studentMonthlyReport", t =>
  t.field({
    type: StudentMonthlyReportPothosObject,
    description: "Aggregated monthly report for a single student: attendance, lessons, and credit ledger activity.",
    authScopes: { loggedIn: true },
    args: {
      studentId: t.arg.id({ required: true }),
      year: t.arg.int({ required: true }),
      month: t.arg.int({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      if (!ctx.user?.id) {
        throw new Error("unauthenticated");
      }
      return StudentMonthlyReportService.getMonthlyReport(
        ctx.user.id,
        String(args.studentId),
        args.year,
        args.month,
        ctx.locale
      );
    },
  })
);
