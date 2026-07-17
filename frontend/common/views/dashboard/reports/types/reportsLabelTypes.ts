import type { LedgerStatus, ReportType } from "@/frontend/common/views/dashboard/reports/types/reportsTypes";

/**
 * Shared label contracts used by both mobile and desktop reports variants.
 * Kept in the tier-neutral common layer so the ViewModel can import them
 * without reaching into `@/frontend/mobile/**` or `@/frontend/desktop/**`.
 */

export interface ReportFiltersFormLabels {
  readonly fromDate: string;
  readonly toDate: string;
  readonly teacher: string;
  readonly allTeachers: string;
  readonly reportType: string;
  readonly submit: string;
  readonly reportTypes: {
    readonly byTeacher: string;
    readonly byStudent: string;
    readonly byDate: string;
  };
}

export interface ReportsDataGridLabels {
  readonly name: string;
  readonly taken: string;
  readonly absent: string;
  readonly leave: string;
  readonly pending: string;
  readonly hours: string;
  readonly paid: string;
  readonly noEntries: string;
}

export interface PerformanceLedgerCardLabels {
  readonly studentLabel: (name: string) => string;
  readonly paid: string;
  readonly statusLabels: Record<LedgerStatus, string>;
  readonly taken: string;
  readonly absent: string;
  readonly leave: string;
  readonly pending: string;
  readonly hours: string;
}

export interface ReportsTotalsSectionLabels {
  readonly totalsLabel: string;
}

export interface ReportFiltersCollapsibleLabels extends ReportFiltersFormLabels {
  readonly title: string;
}

export interface EngagementRateCardLabels {
  readonly rate: number;
  readonly growth: number | null;
  readonly title: string;
  readonly subtitle: string;
  readonly increaseLabel: string;
}

export interface FinancialDistributionCardLabels {
  readonly title: string;
  readonly subtitle: string;
}

export type ReportsReportType = ReportType;
