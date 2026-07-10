import type { CurrencyCode } from "@/backend/enum";
import type { AttendanceReportFilters, ReportGroupingMode } from "@/backend/db/repo/books/report.repository";

export type { AttendanceReportFilters, ReportGroupingMode } from "@/backend/db/repo/books/report.repository";

export interface AttendanceReportPaidAmountReturnType {
  readonly id: string;
  readonly amount: string;
  readonly currency: CurrencyCode;
}

export interface AttendanceReportRowReturnType {
  readonly groupKey: string;
  readonly groupLabel: string;
  readonly takenClasses: number;
  readonly absentClasses: number;
  readonly leaveClasses: number;
  readonly pendingClasses: number;
  readonly totalHours: number;
  readonly paidAmounts: readonly AttendanceReportPaidAmountReturnType[];
  readonly engagementGrowth: number | null;
}

export interface AttendanceReportResult {
  readonly rows: readonly AttendanceReportRowReturnType[];
  readonly engagementGrowth: number | null;
}
