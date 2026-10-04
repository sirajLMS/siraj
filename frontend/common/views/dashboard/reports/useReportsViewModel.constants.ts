import type {
  ReportFiltersFormLabels,
  ReportsDataGridLabels,
} from "@/frontend/common/views/dashboard/reports/types/reportsLabelTypes";
import type { LedgerStatus, ReportsSummary } from "@/frontend/common/views/dashboard/reports/types/reportsTypes";

export interface ReportsViewLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly filtersTitle: string;
  readonly exportCsv: string;
  readonly printReport: string;
  readonly filtersLabels: ReportFiltersFormLabels;
  readonly tableLabels: ReportsDataGridLabels;
  readonly summaryLabels: {
    readonly engagementRate: string;
    readonly engagementGrowth: string;
    readonly increase: string;
    readonly financialDistribution: string;
    readonly financialSubtitle: string;
  };
  readonly totalsLabel: string;
  readonly ledgerTitle: string;
  readonly ledgerLabels: {
    readonly studentLabel: (name: string) => string;
    readonly paid: string;
    readonly statusLabels: Record<LedgerStatus, string>;
    readonly taken: string;
    readonly absent: string;
    readonly leave: string;
    readonly pending: string;
    readonly hours: string;
  };
}

/**
 * Fallback labels used when the Container invokes the ViewModel without
 * arguments, so every rendered string is defined even without translations.
 */
export const DEFAULT_LABELS: ReportsViewLabels = {
  pageTitle: "",
  pageSubtitle: "",
  filtersTitle: "",
  exportCsv: "",
  printReport: "",
  filtersLabels: {
    fromDate: "",
    toDate: "",
    teacher: "",
    allTeachers: "",
    reportType: "",
    submit: "",
    reportTypes: {
      byTeacher: "",
      byStudent: "",
      byDate: "",
    },
  },
  tableLabels: {
    name: "",
    taken: "",
    absent: "",
    leave: "",
    pending: "",
    hours: "",
    paid: "",
    noEntries: "",
  },
  summaryLabels: {
    engagementRate: "",
    engagementGrowth: "",
    increase: "",
    financialDistribution: "",
    financialSubtitle: "",
  },
  totalsLabel: "",
  ledgerTitle: "",
  ledgerLabels: {
    studentLabel: (name: string) => name,
    paid: "",
    statusLabels: {
      active: "",
      on_break: "",
    },
    taken: "",
    absent: "",
    leave: "",
    pending: "",
    hours: "",
  },
};

export const DEFAULT_SUMMARY: ReportsSummary = {
  engagementRate: 0,
  engagementGrowth: null,
  currencyDistribution: [],
  totalHours: "",
};
