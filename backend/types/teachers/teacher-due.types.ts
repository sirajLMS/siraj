import type { teacherDues } from "@/backend/db/schema";
import type { CurrencyCode, TeacherDueStatus } from "@/backend/enum";

export type TeacherDueSelectType = typeof teacherDues.$inferSelect;
export type TeacherDueInsertType = typeof teacherDues.$inferInsert;

export type TeacherDueReturnType = Omit<TeacherDueSelectType, "status" | "currency"> & {
  status: TeacherDueStatus;
  currency: CurrencyCode;
};

export interface TeacherMonthlyReportReturnType {
  teacherId: string;
  teacherName: string;
  year: number;
  month: number;
  lessonsTaught: number;
  approvedCount: number;
  cancelledCount: number;
  totalAccruedHours: number;
  totalDueAmount: number;
  totalPaidAmount: number;
  currency: CurrencyCode;
}

export interface TeacherPendingDuesSummaryReturnType {
  totalCount: number;
  totalAmount: number;
  currency: CurrencyCode;
}
