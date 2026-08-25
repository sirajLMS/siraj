// Auto-extracted from pothos/ (types-review R3-P3).
// Query field registrations relocated to the query layer per query/AGENTS.md.

import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  MonthlyAppraisalPothosObject,
  MonthlyAppraisalStudentEntryPothosObject,
} from "@/backend/graphql/pothos/reports/monthly-appraisal.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { MonthlyAppraisalService } from "@/backend/services";

gqlSchemaBuilder.queryField("myMonthlyAppraisal", t =>
  t.field({
    type: MonthlyAppraisalPothosObject,
    authScopes: { permission: AppPermission.APPRAISAL_VIEW },
    description: "Returns the authenticated student's monthly appraisal for a given month (or null if none).",
    args: {
      month: t.arg({ type: "DateTime", required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      return MonthlyAppraisalService.getMyMonthlyAppraisal(userId, args.month, ctx.locale);
    },
  })
);

gqlSchemaBuilder.queryField("studentMonthlyAppraisals", t =>
  t.field({
    type: [MonthlyAppraisalPothosObject],
    authScopes: { permission: AppPermission.APPRAISAL_VIEW },
    description:
      "Returns all monthly appraisals for a student. Caller must be the student, their parent, or an assigned teacher.",
    args: {
      studentId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      return MonthlyAppraisalService.getStudentMonthlyAppraisals(userId, args.studentId, ctx.locale);
    },
  })
);

gqlSchemaBuilder.queryField("teacherMonthlyAppraisalStudents", t =>
  t.field({
    type: [MonthlyAppraisalStudentEntryPothosObject],
    authScopes: { permission: AppPermission.APPRAISAL_SUBMIT },
    description:
      "Returns the teacher's assigned students with an optional appraisal summary for the given month (teacher appraisal list view).",
    args: {
      month: t.arg({ type: "DateTime", required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      return MonthlyAppraisalService.getTeacherMonthlyAppraisalStudents(userId, args.month ?? undefined, ctx.locale);
    },
  })
);
