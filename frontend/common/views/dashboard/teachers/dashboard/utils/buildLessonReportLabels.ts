import type { LessonReportFormLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/types/lessonReportFormTypes";
import type { LessonReportLabels } from "@/shared/locale/types/dashboard/lms/lessonReports";

type LessonReportI18n = LessonReportLabels;

/**
 * Forwards the lmsLessonReports translation namespace into the
 * `LessonReportFormLabels` shape consumed by the lesson-report dialog
 * surface. Field access is typed against the translation schema so any
 * missing key surfaces as a compile-time error.
 */
export function buildLessonReportLabels(lessonReportI18n: LessonReportI18n): LessonReportFormLabels {
  return {
    attendanceEvaluation: lessonReportI18n.attendanceEvaluation,
    durationMinutes: lessonReportI18n.durationMinutes,
    completionPercentage: lessonReportI18n.completionPercentage,
    teacherNotes: lessonReportI18n.teacherNotes,
    present: lessonReportI18n.present,
    absent: lessonReportI18n.absent,
    late: lessonReportI18n.late,
    submit: lessonReportI18n.submit,
    dialogTitle: lessonReportI18n.dialogTitle,
    cancel: lessonReportI18n.cancel,
    submitting: lessonReportI18n.submitting,
    submitFailed: lessonReportI18n.submitFailed,
    attendanceRequired: lessonReportI18n.attendanceRequired,
    durationMin: lessonReportI18n.durationMin,
    durationMax: lessonReportI18n.durationMax,
    completionMin: lessonReportI18n.completionMin,
    completionMax: lessonReportI18n.completionMax,
  };
}
