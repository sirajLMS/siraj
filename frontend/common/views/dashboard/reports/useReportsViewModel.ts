// NEW FOR PLAN v5: prior to the migration wave, the reports tier files owned
// `useUserStore`, `useAppLocale`, `useMemo`, `date-fns`, and `useState` for the
// collapsible. Per specs.md §0 + §6, all of that now lives ONCE in this hook
// (the ViewModel is the SOLE owner of side effects, derived values, and
// store subscriptions) and is handed down to the tier views as plain props.

"use client";

import { useMemo } from "react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { buildFxDisplayMessages } from "@/frontend/common/lib/buildFxDisplayMessages";
import {
  type BillingCurrencyBucket,
  formatBillingCurrencyTotals,
} from "@/frontend/common/lib/formatBillingCurrencyTotals";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { useReportsStore } from "@/frontend/common/stores/reportsStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type {
  ReportFiltersFormLabels,
  ReportsDataGridLabels,
} from "@/frontend/common/views/dashboard/reports/types/reportsLabelTypes";
import type {
  LedgerStatus,
  ReportLedgerRow,
  ReportPaidAmount,
  ReportsSummary,
  ReportType,
} from "@/frontend/common/views/dashboard/reports/types/reportsTypes";
import {
  aggregatePaidAmountTotals,
  formatReportPaidAmounts,
} from "@/frontend/common/views/dashboard/reports/utils/formatReportPaidAmounts";
import { useAppTranslation } from "@/shared/locale";

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

export interface UseReportsViewModelProps {
  // NEW FOR PLAN v5: all fields optional so the Container may invoke the
  // ViewModel with no args (specs.md §6.1 — the Container is the
  // view-orchestrator and the page.tsx renders `<ReportsContainer />` with no
  // props). The VM supplies no-op/empty defaults when callers omit data; a
  // future caller may still pass real labels/rows/handlers to override them.
  readonly labels?: ReportsViewLabels;
  readonly rows?: readonly ReportLedgerRow[];
  readonly summary?: ReportsSummary;
  readonly canGenerate?: boolean;
  readonly loading?: boolean;
  readonly onSubmit?: () => void;
  readonly onExportCsv?: () => void;
  readonly onPrintReport?: () => void;
  readonly onRowClick?: (row: ReportLedgerRow) => void;
}

/** Precomputed paid-amounts totals display (lifted out of tier). */
export interface ReportsTotalsDisplay {
  readonly primary: string;
  readonly breakdown?: string;
  readonly ariaLabel?: string;
}

export interface ReportsViewModel {
  readonly labels: ReportsViewLabels;
  readonly fromDate: string;
  readonly toDate: string;
  readonly teacherId: string;
  readonly reportType: ReportType;
  readonly rows: readonly ReportLedgerRow[];
  readonly summary: ReportsSummary;
  readonly canGenerate: boolean;
  readonly loading?: boolean;
  readonly onFromDateChange: (date: string) => void;
  readonly onToDateChange: (date: string) => void;
  readonly onTeacherChange: (id: string) => void;
  readonly onReportTypeChange: (type: ReportType) => void;
  readonly onSubmit: () => void;
  readonly onExportCsv: () => void;
  readonly onPrintReport: () => void;
  readonly onRowClick?: (row: ReportLedgerRow) => void;
  // NEW FOR PLAN v5: filters-collapsible state lifted out of the mobile tier
  // (the desktop variant renders the form permanently, no collapse chrome).
  readonly filtersExpanded: boolean;
  readonly onToggleFiltersExpanded: () => void;
  // NEW FOR PLAN v5: permission gate lifted out of tier (specs.md §3 N3) —
  // tier files no longer call `useUserStore`.
  readonly showFinancials: boolean;
  // NEW FOR PLAN v5: precomputed financials totals display (specs.md §3 N11 —
  // the `useMemo` derivation is owned by the ViewModel, not the tier).
  readonly totalsDisplay: ReportsTotalsDisplay;
  // NEW FOR PLAN v5: prebuilt pure formatter that tier components call
  // instead of importing `date-fns`/`buildFxDisplayMessages`/`useUserStore`
  // themselves. The closure carries the locale/error labels, so the tier is
  // left only with rendering.
  readonly formatPaidAmounts: (paidAmounts: readonly ReportPaidAmount[]) => string;
}

export function useReportsViewModel(
  props: Readonly<UseReportsViewModelProps> = {} as Readonly<UseReportsViewModelProps>
): ReportsViewModel {
  const fromDate = useReportsStore(state => state.fromDate);
  const toDate = useReportsStore(state => state.toDate);
  const teacherId = useReportsStore(state => state.teacherId);
  const reportType = useReportsStore(state => state.reportType);
  const setFromDate = useReportsStore(state => state.setFromDate);
  const setToDate = useReportsStore(state => state.setToDate);
  const setTeacherId = useReportsStore(state => state.setTeacherId);
  const setReportType = useReportsStore(state => state.setReportType);
  const filtersExpanded = useReportsStore(state => state.filtersExpanded);
  const toggleFiltersExpanded = useReportsStore(state => state.toggleFiltersExpanded);

  const { hasPermission } = useUserStore();
  const showFinancials = hasPermission(AppPermission.ReportViewFinancials);

  const locale = useAppLocale();
  const tProfile = useAppTranslation().profileTranslations.base;
  const tErrors = useAppTranslation().errorsTranslations;

  const { labels, rows, summary, canGenerate, loading, onSubmit, onExportCsv, onPrintReport, onRowClick } = props;
  // NEW FOR PLAN v5: empty/no-op defaults so the Container can invoke this
  // ViewModel with no arguments (specs.md §6.1) — the page passes `<ReportsContainer />`
  // and the VM supplies safe defaults for callers that omit input data/handlers.
  // Wrapped in `useMemo` so the `useMemo` further down has stable deps.
  const safeLabels = useMemo(() => labels ?? ({} as ReportsViewLabels), [labels]);
  const safeRows = useMemo(() => rows ?? [], [rows]);
  const safeSummary = useMemo(() => summary ?? ({} as ReportsSummary), [summary]);
  const safeCanGenerate = canGenerate ?? false;
  const safeOnSubmit = onSubmit ?? (() => undefined);
  const safeOnExportCsv = onExportCsv ?? (() => undefined);
  const safeOnPrintReport = onPrintReport ?? (() => undefined);

  // NEW FOR PLAN v5: totals display derived ONCE in the ViewModel (lifted from
  // the tier's `useTotalsDisplay` hook which used to live in both
  // `reportsTotalsSection.{mobile,desktop}.tsx`).
  const totalsDisplay = useMemo<ReportsTotalsDisplay>(() => {
    const paidTotals = aggregatePaidAmountTotals(safeRows);
    if (paidTotals.length === 0) {
      return { primary: "—", ariaLabel: tProfile.notSet };
    }

    const buckets: BillingCurrencyBucket[] = paidTotals.map(paid => ({
      amount: paid.amount,
      currency: paid.currency,
      displayAmount: paid.displayAmount
        ? {
            amount: paid.displayAmount.amount,
            currency: paid.displayAmount.currency,
            stale: paid.displayAmount.stale,
          }
        : null,
    }));

    return formatBillingCurrencyTotals(
      buckets,
      locale,
      buildFxDisplayMessages(
        {
          convertedAmount: tProfile.convertedAmount,
        },
        tErrors,
        {
          convertedTotalApprox: tProfile.convertedTotalApprox,
        }
      )
    );
  }, [safeRows, locale, tProfile, tErrors]);

  return {
    labels: safeLabels,
    fromDate,
    toDate,
    teacherId,
    reportType,
    rows: safeRows,
    summary: safeSummary,
    canGenerate: safeCanGenerate,
    loading,
    onFromDateChange: setFromDate,
    onToDateChange: setToDate,
    onTeacherChange: setTeacherId,
    onReportTypeChange: setReportType,
    onSubmit: safeOnSubmit,
    onExportCsv: safeOnExportCsv,
    onPrintReport: safeOnPrintReport,
    onRowClick,
    filtersExpanded,
    onToggleFiltersExpanded: toggleFiltersExpanded,
    showFinancials,
    totalsDisplay,
    // NEW FOR PLAN v5: bound formatter handed down so the performance ledger
    // cards do not import `useUserStore`/`buildFxDisplayMessages` themselves.
    formatPaidAmounts: paidAmounts =>
      formatReportPaidAmounts(
        paidAmounts,
        locale,
        buildFxDisplayMessages(
          {
            convertedAmount: tProfile.convertedAmount,
          },
          tErrors,
          {
            convertedTotalApprox: tProfile.convertedTotalApprox,
          }
        )
      ),
  };
}
