import type {
  AttendanceEvaluation as GraphqlAttendanceEvaluation,
  LessonReportStatus as GraphqlLessonReportStatus,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { LessonReportLabels } from "@/shared/locale/types/dashboard/lms/lessonReports";

export type AttendanceEvaluationValue = `${GraphqlAttendanceEvaluation}`;
export type LessonReportStatusValue = `${GraphqlLessonReportStatus}`;

export interface LessonReportFormState {
  readonly attendanceEvaluation: AttendanceEvaluationValue;
  readonly durationMinutes: number;
  readonly completionPercentage: number;
  readonly teacherNotes: string;
}

export interface LessonReportFormSubmitInput {
  readonly classInstanceId: string;
  readonly attendanceEvaluation: AttendanceEvaluationValue;
  readonly durationMinutes: number;
  readonly completionPercentage: number;
  readonly teacherNotes?: string | null;
}

export type LessonReportFormLabels = Pick<
  LessonReportLabels,
  | "attendanceEvaluation"
  | "durationMinutes"
  | "completionPercentage"
  | "teacherNotes"
  | "present"
  | "absent"
  | "late"
  | "submit"
  | "dialogTitle"
  | "cancel"
  | "submitting"
  | "submitFailed"
  | "attendanceRequired"
  | "durationMin"
  | "durationMax"
  | "completionMin"
  | "completionMax"
>;
