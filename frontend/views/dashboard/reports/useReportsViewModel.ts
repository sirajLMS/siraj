"use client";

import { useReportsStore } from "@/frontend/stores/reportsStore";
import type { ReportFiltersFormLabels } from "@/frontend/views/dashboard/reports/components/ReportFiltersForm";
import type { ReportsDataGridLabels } from "@/frontend/views/dashboard/reports/components/ReportsDataGrid";
import type {
  LedgerStatus,
  ReportLedgerRow,
  ReportsSummary,
  ReportTeacherOption,
  ReportType,
} from "@/frontend/views/dashboard/reports/types/reportsTypes";

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
    readonly studentLabel: string;
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
  readonly labels: ReportsViewLabels;
  readonly teachers: readonly ReportTeacherOption[];
  readonly rows: readonly ReportLedgerRow[];
  readonly summary: ReportsSummary;
  readonly canGenerate: boolean;
  readonly loading?: boolean;
  readonly onSubmit: () => void;
  readonly onExportCsv: () => void;
  readonly onPrintReport: () => void;
  readonly onRowClick?: (row: ReportLedgerRow) => void;
}

export interface ReportsViewModel {
  readonly labels: ReportsViewLabels;
  readonly fromDate: string;
  readonly toDate: string;
  readonly teacherId: string;
  readonly reportType: ReportType;
  readonly teachers: readonly ReportTeacherOption[];
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
}

export function useReportsViewModel(props: Readonly<UseReportsViewModelProps>): ReportsViewModel {
  const fromDate = useReportsStore(state => state.fromDate);
  const toDate = useReportsStore(state => state.toDate);
  const teacherId = useReportsStore(state => state.teacherId);
  const reportType = useReportsStore(state => state.reportType);
  const setFromDate = useReportsStore(state => state.setFromDate);
  const setToDate = useReportsStore(state => state.setToDate);
  const setTeacherId = useReportsStore(state => state.setTeacherId);
  const setReportType = useReportsStore(state => state.setReportType);

  const { labels, teachers, rows, summary, canGenerate, loading, onSubmit, onExportCsv, onPrintReport, onRowClick } =
    props;

  return {
    labels,
    fromDate,
    toDate,
    teacherId,
    reportType,
    teachers,
    rows,
    summary,
    canGenerate,
    loading,
    onFromDateChange: setFromDate,
    onToDateChange: setToDate,
    onTeacherChange: setTeacherId,
    onReportTypeChange: setReportType,
    onSubmit,
    onExportCsv,
    onPrintReport,
    onRowClick,
  };
}
