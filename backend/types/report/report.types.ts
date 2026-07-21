export interface StudentMonthlyReportReturnType {
  readonly studentId: string;
  readonly studentName: string;
  readonly year: number;
  readonly month: number;
  readonly totalLessons: number;
  readonly completedLessons: number;
  readonly cancelledLessons: number;
  readonly presentCount: number;
  readonly absentCount: number;
  readonly lateCount: number;
  readonly totalHours: number;
  readonly creditsPurchased: number;
  readonly creditsDeducted: number;
  readonly creditsRefunded: number;
  readonly creditsBalance: number;
}

export interface StudentHeader {
  readonly studentId: string;
  readonly studentName: string;
  readonly classesRemaining: number;
}

// Re-export the canonical TeacherMonthlyReportReturnType so consumers of the report
// types barrel can import it from a single location. The canonical definition lives in
// `@/backend/types/teachers/teacher-due.types.ts` (single-source-of-truth rule).
export type { TeacherMonthlyReportReturnType } from "@/backend/types/teachers/teacher-due.types";
