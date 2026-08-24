import { z } from "zod";

/**
 * Monthly appraisal form schema (RHF + Zod).
 *
 * Grades are optional integers 1..5 (sparse rubric — null fields omitted from
 * the report card per R1.3). `learningTargets` is the only required rubric
 * field (R1.1). `month` defaults to the first of the current month.
 */
export function buildMonthlyAppraisalFormSchema(
  validation: Readonly<{ learningTargetsRequired: string; gradeOutOfRange: string }>
) {
  return z.object({
    studentId: z.string().min(1),
    month: z.string().min(1),
    behaviorGrade: z.number().int().min(1).max(5).nullable().optional(),
    behaviorComment: z.string().max(2000).nullable().optional(),
    attendanceGrade: z.number().int().min(1).max(5).nullable().optional(),
    attendanceComment: z.string().max(2000).nullable().optional(),
    punctualityGrade: z.number().int().min(1).max(5).nullable().optional(),
    punctualityComment: z.string().max(2000).nullable().optional(),
    overallGrade: z.number().int().min(1).max(5).nullable().optional(),
    overallComment: z.string().max(2000).nullable().optional(),
    learningTargets: z.string().min(1, { message: validation.learningTargetsRequired }),
  });
}

export type MonthlyAppraisalFormData = z.infer<ReturnType<typeof buildMonthlyAppraisalFormSchema>>;

export const DEFAULT_APPRAISAL_FORM_VALUES: MonthlyAppraisalFormData = {
  studentId: "",
  month: new Date().toISOString().slice(0, 8) + "01",
  behaviorGrade: null,
  behaviorComment: null,
  attendanceGrade: null,
  attendanceComment: null,
  punctualityGrade: null,
  punctualityComment: null,
  overallGrade: null,
  overallComment: null,
  learningTargets: "",
};

/** Rubric field pairs (grade + comment) for iteration in the form UI. */
export const RUBRIC_FIELDS = [
  { gradeKey: "behaviorGrade", commentKey: "behaviorComment", labelKey: "behavior" },
  { gradeKey: "attendanceGrade", commentKey: "attendanceComment", labelKey: "attendance" },
  { gradeKey: "punctualityGrade", commentKey: "punctualityComment", labelKey: "punctuality" },
  { gradeKey: "overallGrade", commentKey: "overallComment", labelKey: "overall" },
] as const;
