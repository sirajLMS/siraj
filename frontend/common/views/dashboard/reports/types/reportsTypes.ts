// cspell:disable
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";

export type ReportType = "by_teacher" | "by_student" | "by_date";

export type LedgerStatus = "active" | "on_break";

export interface ReportTeacherOption {
  readonly id: string;
  readonly name: string;
}

export interface ReportPaidAmount {
  readonly id: string;
  readonly amount: string;
  readonly currency: CurrencyCode;
  readonly displayAmount?: {
    readonly id: string;
    readonly amount?: string | null;
    readonly currency?: CurrencyCode | null;
    readonly stale?: boolean | null;
  } | null;
}

export interface ReportLedgerRow {
  readonly id: string;
  readonly entityId: string | null;
  readonly name: string;
  readonly studentName: string;
  readonly avatarInitials: string;
  readonly status: LedgerStatus;
  readonly taken: number;
  readonly absent: number;
  readonly leave: number;
  readonly pending: number;
  readonly hours: string;
  readonly paidAmounts: readonly ReportPaidAmount[];
}

export interface CurrencyDistributionSlice {
  readonly currency: CurrencyCode;
  readonly percent: number;
  readonly label: string;
  readonly amount: number;
  readonly formattedAmount?: string;
}

export interface ReportsSummary {
  readonly engagementRate: number;
  readonly engagementGrowth: number | null;
  readonly currencyDistribution: readonly CurrencyDistributionSlice[];
  readonly totalHours: string;
}

export interface ReportFilters {
  readonly fromDate: string;
  readonly toDate: string;
  readonly teacherId: string;
  readonly reportType: ReportType;
}
