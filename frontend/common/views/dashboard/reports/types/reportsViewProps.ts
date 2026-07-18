// NEW FOR PLAN v5: shared view-side props contracts for the reports tier
// pairs. Each `interface Xxx(Mobile|Desktop)Props` pair that was duplicated
// inline inside `frontend/{mobile,desktop}/views/dashboard/reports/**` is
// unified here as ONE `XxxProps` (specs.md §4.1 Class B — diff is empty after
// whitespace normalization). The mobile-only "filters collapsible" wraps the
// form with an extra `title` field and an `expanded`/`onToggleExpanded`
// stateful pair, so it gets a `ReportFiltersCollapsibleProps` variant that
// extends the form props (Class C — diverges only on collapsible chrome).

import type {
  PerformanceLedgerCardLabels,
  ReportFiltersFormLabels,
  ReportsDataGridLabels,
} from "@/frontend/common/views/dashboard/reports/types/reportsLabelTypes";
import type {
  CurrencyDistributionSlice,
  ReportLedgerRow,
  ReportPaidAmount,
  ReportsSummary,
  ReportTeacherOption,
  ReportType,
} from "@/frontend/common/views/dashboard/reports/types/reportsTypes";

export interface ReportFiltersFormProps {
  readonly fromDate: string;
  readonly toDate: string;
  readonly teacherId: string;
  readonly reportType: ReportType;
  readonly teachers: readonly ReportTeacherOption[];
  readonly labels: ReportFiltersFormLabels;
  readonly canGenerate: boolean;
  readonly onFromDateChange: (date: string) => void;
  readonly onToDateChange: (date: string) => void;
  readonly onTeacherChange: (teacherId: string) => void;
  readonly onReportTypeChange: (reportType: ReportType) => void;
  readonly onSubmit: () => void;
}

// Mobile-only collapsible chrome. The twin desktop "filters panel" is a thin
// pass-through with no `title`/no collapse — declaring this variant here keeps
// mobile's collapsible chrome fields out of the shared form contract. See
// specs.md §4.1 Class C ("genuinely different" — variant only adds the named
// extra fields `title`, `expanded`, `onToggleExpanded`).
export interface ReportFiltersCollapsibleProps extends ReportFiltersFormProps {
  readonly title: string;
  readonly expanded: boolean;
  readonly onToggleExpanded: () => void;
}

export interface PerformanceLedgerCardProps {
  readonly row: ReportLedgerRow;
  readonly labels: PerformanceLedgerCardLabels;
  // NEW FOR PLAN v5: gate flag lifted from `useUserStore` in tier (specs.md
  // §3 N3) — the ViewModel is the sole subscriber; the card just renders.
  readonly showFinancials: boolean;
  // NEW FOR PLAN v5: prebuilt per-row paid-amounts display string (specs.md
  // §3 N11 + §6.2) — the ViewModel owns the locale/label bindings; the card
  // never calls `date-fns`/`buildFxDisplayMessages`/`useUserStore` itself.
  readonly paidLabel: string;
  readonly onClick?: (row: ReportLedgerRow) => void;
}

export interface PerformanceLedgerCardListProps {
  readonly rows: readonly ReportLedgerRow[];
  readonly labels: PerformanceLedgerCardLabels;
  // NEW FOR PLAN v5: bound formatter + gate flag lifted from tier; list
  // computes `paidLabel` per row and threads `showFinancials` down.
  readonly showFinancials: boolean;
  readonly formatPaidAmounts: (paidAmounts: readonly ReportPaidAmount[]) => string;
  readonly loading?: boolean;
  readonly onRowClick?: (row: ReportLedgerRow) => void;
}

export interface ReportsDataGridProps {
  readonly rows: readonly ReportLedgerRow[];
  readonly labels: ReportsDataGridLabels;
  readonly reportType: ReportType;
  readonly loading?: boolean;
  readonly onRowClick?: (row: ReportLedgerRow) => void;
  // NEW FOR PLAN v5: bound formatter + gate flag lifted from tier; the data
  // grid passes them down to its child ledger cards.
  readonly showFinancials: boolean;
  readonly formatPaidAmounts: (paidAmounts: readonly ReportPaidAmount[]) => string;
}

export interface ReportsTotalsSectionProps {
  readonly summary: ReportsSummary;
  readonly rows: readonly ReportLedgerRow[];
  readonly totalsLabel: string;
  // NEW FOR PLAN v5: precomputed financial totals display, lifted out of tier
  // so neither twin calls `useUserStore`/`useMemo`/`useLocale` (specs.md §3 N3
  // + N11). The ViewModel owns the derivation; tier renders it.
  readonly totalsDisplay: { readonly primary: string; readonly breakdown?: string; readonly ariaLabel?: string };
  // NEW FOR PLAN v5: gate flag lifted from `useUserStore` in tier — the
  // ViewModel is the sole subscriber.
  readonly showFinancials: boolean;
}

export interface EngagementRateCardProps {
  readonly rate: number;
  readonly growth: number | null;
  readonly title: string;
  readonly subtitle: string;
  readonly increaseLabel: string;
}

export interface FinancialDistributionCardProps {
  readonly currencyDistribution: readonly CurrencyDistributionSlice[];
  readonly title: string;
  readonly subtitle: string;
}
