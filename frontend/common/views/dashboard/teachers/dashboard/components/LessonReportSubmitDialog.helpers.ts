import type { ZodError } from "zod";
import { AttendanceEvaluation } from "@/frontend/common/graphql/generated/gql/graphql";
import type { AttendanceEvaluationValue } from "@/frontend/common/views/dashboard/teachers/dashboard/types/lessonReportFormTypes";

export interface LessonReportFormState {
  readonly attendanceEvaluation: AttendanceEvaluationValue;
  readonly durationMinutes: number;
  readonly completionPercentage: number;
  readonly teacherNotes: string;
}

export function buildInitialLessonReportForm(defaultDurationMinutes?: number): LessonReportFormState {
  return {
    attendanceEvaluation: AttendanceEvaluation.Present,
    durationMinutes: defaultDurationMinutes ?? 60,
    completionPercentage: 100,
    teacherNotes: "",
  };
}

/**
 * Flattens Zod issues into the first message per top-level form field so the
 * UI can surface a single validation error per control.
 */
export function collectLessonReportFieldErrors(error: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}
