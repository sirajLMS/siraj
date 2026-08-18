import type { ReportGroupingMode } from "@/backend/enum";
import type { DisplayAmountReturnType } from "@/backend/types";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

export interface AttendanceReportPaidAmountReturnType {
  readonly id: string;
  readonly amount: string;
  readonly currency: CurrencyCode;
  readonly displayAmount?: DisplayAmountReturnType | null;
}

export interface AttendanceReportFilters {
  fromDate: Date;
  toDate: Date;
  teacherId?: string;
  groupBy: ReportGroupingMode;
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

export type AttendanceReportRow = AttendanceReportRowReturnType;
