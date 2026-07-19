import type { lessonReports } from "@/backend/db/schema";
import type { AttendanceEvaluation, LessonReportStatus } from "@/backend/enum";

export type LessonReportSelectType = typeof lessonReports.$inferSelect;
export type LessonReportInsertType = typeof lessonReports.$inferInsert;

export type LessonReportReturnType = Omit<LessonReportSelectType, "status" | "attendanceEvaluation"> & {
  status: LessonReportStatus;
  attendanceEvaluation: AttendanceEvaluation;
  teacherName?: string | null;
  studentName?: string | null;
  subjectName?: string | null;
  classAvatarUrl?: string | null;
};

export interface LessonReportSubmitInput {
  classInstanceId: string;
  attendanceEvaluation: AttendanceEvaluation;
  durationMinutes: number;
  teacherNotes?: string;
  completionPercentage: number;
}

export interface LessonReviewInput {
  reportId: string;
  rejectionReason?: string;
}

export interface PendingReviewCountReturnType {
  pendingCount: number;
}
