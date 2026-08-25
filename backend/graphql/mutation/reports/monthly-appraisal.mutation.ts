// Auto-extracted from pothos/ (types-review R3-P3).
// Mutation field registrations relocated to the mutation layer per mutation/AGENTS.md.

import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  AddAppraisalFeedbackInputPothosObject,
  MonthlyAppraisalFeedbackPothosObject,
  MonthlyAppraisalPothosObject,
  SubmitMonthlyAppraisalInputPothosObject,
} from "@/backend/graphql/pothos/reports/monthly-appraisal.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { MonthlyAppraisalService } from "@/backend/services";
import type { MonthlyAppraisalReturnType } from "@/backend/types";

gqlSchemaBuilder.mutationField("submitMonthlyAppraisal", t =>
  t.field({
    type: MonthlyAppraisalPothosObject,
    authScopes: { permission: AppPermission.APPRAISAL_SUBMIT },
    description:
      "Submits or updates (upsert) a teacher's monthly appraisal for a student. Teacher identity from auth context.",
    args: {
      input: t.arg({ type: SubmitMonthlyAppraisalInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx): Promise<MonthlyAppraisalReturnType> => {
      const userId = await requireAuth(ctx);
      const input = args.input;
      return MonthlyAppraisalService.submitAppraisal(
        {
          studentId: input.studentId,
          teacherId: "", // service resolves from auth context; placeholder satisfies the type
          month: input.month,
          behaviorGrade: input.behaviorGrade ?? null,
          behaviorComment: input.behaviorComment ?? null,
          attendanceGrade: input.attendanceGrade ?? null,
          attendanceComment: input.attendanceComment ?? null,
          punctualityGrade: input.punctualityGrade ?? null,
          punctualityComment: input.punctualityComment ?? null,
          overallGrade: input.overallGrade ?? null,
          overallComment: input.overallComment ?? null,
          learningTargets: input.learningTargets,
        },
        userId,
        ctx.locale
      );
    },
  })
);

gqlSchemaBuilder.mutationField("addAppraisalFeedback", t =>
  t.field({
    type: MonthlyAppraisalFeedbackPothosObject,
    authScopes: { permission: AppPermission.APPRAISAL_FEEDBACK },
    description: "Appends parent/student feedback to a published monthly appraisal.",
    args: {
      input: t.arg({ type: AddAppraisalFeedbackInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      return MonthlyAppraisalService.addFeedback(
        {
          appraisalId: args.input.appraisalId,
          authorUserId: "", // service resolves from auth context
          body: args.input.body,
        },
        userId,
        ctx.locale
      );
    },
  })
);
