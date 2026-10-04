"use client";

import { useMemo } from "react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { buildFxDisplayMessages } from "@/frontend/common/lib/buildFxDisplayMessages";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { useReportsStore } from "@/frontend/common/stores/reportsStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type {
  ReportLedgerRow,
  ReportPaidAmount,
  ReportsSummary,
  ReportType,
} from "@/frontend/common/views/dashboard/reports/types/reportsTypes";
import {
  DEFAULT_LABELS,
  DEFAULT_SUMMARY,
  type ReportsViewLabels,
} from "@/frontend/common/views/dashboard/reports/useReportsViewModel.constants";
import {
  computeReportsTotalsDisplay,
  type ReportsTotalsDisplay,
} from "@/frontend/common/views/dashboard/reports/useReportsViewModel.helpers";
import { formatReportPaidAmounts } from "@/frontend/common/views/dashboard/reports/utils/formatReportPaidAmounts";
import { Translation, useAppTranslation } from "@/shared/locale";

export type { ReportsTotalsDisplay } from "@/frontend/common/views/dashboard/reports/useReportsViewModel.helpers";

export interface UseReportsViewModelProps {
  /**
   * All fields are optional so the page can render `<ReportsContainer />`
   * with no props; the ViewModel supplies empty/no-op defaults for any
   * omitted labels, rows, or handlers.
   */
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
  /** Collapsible filters state; only the mobile tier renders collapse chrome. */
  readonly filtersExpanded: boolean;
  readonly onToggleFiltersExpanded: () => void;
  /** Permission gate for financial columns, resolved from the user store. */
  readonly showFinancials: boolean;
  /** Precomputed financials totals display owned by the ViewModel. */
  readonly totalsDisplay: ReportsTotalsDisplay;
  /**
   * Locale-bound formatter for ledger card paid amounts, so tier components
   * never import locale/FX dependencies themselves.
   */
  readonly formatPaidAmounts: (paidAmounts: readonly ReportPaidAmount[]) => string;
}

export function useReportsViewModel(props: Readonly<UseReportsViewModelProps> = {}): ReportsViewModel {
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
  const tProfile = useAppTranslation(Translation.Profile.Base);
  const tErrors = useAppTranslation(Translation.Errors);

  const { labels, rows, summary, canGenerate, loading, onSubmit, onExportCsv, onPrintReport, onRowClick } = props;
  const safeLabels = useMemo(() => labels ?? DEFAULT_LABELS, [labels]);
  const safeRows = useMemo(() => rows ?? [], [rows]);
  const safeSummary = useMemo(() => summary ?? DEFAULT_SUMMARY, [summary]);
  const safeCanGenerate = canGenerate ?? false;
  const safeOnSubmit = onSubmit ?? (() => undefined);
  const safeOnExportCsv = onExportCsv ?? (() => undefined);
  const safeOnPrintReport = onPrintReport ?? (() => undefined);

  const fxMessages = useMemo(
    () =>
      buildFxDisplayMessages({ convertedAmount: tProfile.convertedAmount }, tErrors, {
        convertedTotalApprox: tProfile.convertedTotalApprox,
      }),
    [tProfile, tErrors]
  );

  const totalsDisplay = useMemo(
    () => computeReportsTotalsDisplay(safeRows, locale, tProfile.notSet, fxMessages),
    [safeRows, locale, tProfile, fxMessages]
  );

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
    formatPaidAmounts: paidAmounts => formatReportPaidAmounts(paidAmounts, locale, fxMessages),
  };
}
