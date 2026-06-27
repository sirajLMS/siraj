// cspell:disable
export type ReportType = "by_teacher" | "by_student" | "by_date";

export type LedgerStatus = "active" | "on_break";

export interface ReportTeacherOption {
  readonly id: string;
  readonly name: string;
}

export interface ReportLedgerRow {
  readonly id: string;
  readonly name: string;
  readonly studentName: string;
  readonly avatarInitials: string;
  readonly status: LedgerStatus;
  readonly taken: number;
  readonly absent: number;
  readonly leave: number;
  readonly pending: number;
  readonly hours: string;
  readonly paidEgp: number;
  readonly paidUsd: number;
}

export interface ReportsSummary {
  readonly engagementRate: number;
  readonly engagementGrowth: number | null;
  readonly egpPercent: number;
  readonly usdPercent: number;
  readonly totalHours: string;
  readonly totalEgp: number;
  readonly totalUsd: number;
}

export interface ReportFilters {
  readonly fromDate: string;
  readonly toDate: string;
  readonly teacherId: string;
  readonly reportType: ReportType;
}
