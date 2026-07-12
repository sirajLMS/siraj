"use client";

import { useMediaQuery, useTheme } from "@mui/material";
import type { ReportFiltersFormLabels } from "@/frontend/views/dashboard/reports/components/ReportFiltersForm";
import type { ReportsDataGridLabels } from "@/frontend/views/dashboard/reports/components/ReportsDataGrid";
import { ReportsDesktopView } from "@/frontend/views/dashboard/reports/ReportsDesktopView";
import { ReportsMobileView } from "@/frontend/views/dashboard/reports/ReportsMobileView";
import type { LedgerStatus } from "@/frontend/views/dashboard/reports/types/reportsTypes";
import type {
  ReportsSharedViewProps,
  ReportsSummaryLabels,
} from "@/frontend/views/dashboard/reports/types/reportsViewTypes";

export interface ReportsViewLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly filtersTitle: string;
  readonly exportCsv: string;
  readonly printReport: string;
  readonly filtersLabels: ReportFiltersFormLabels;
  readonly tableLabels: ReportsDataGridLabels;
  readonly summaryLabels: ReportsSummaryLabels;
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

interface ReportsViewProps extends ReportsSharedViewProps {
  readonly labels: ReportsViewLabels;
}

export function ReportsView({
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
  onFromDateChange,
  onToDateChange,
  onTeacherChange,
  onReportTypeChange,
  onSubmit,
  onExportCsv,
  onPrintReport,
  onRowClick,
}: Readonly<ReportsViewProps>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (isMobile) {
    return (
      <ReportsMobileView
        pageTitle={labels.pageTitle}
        pageSubtitle={labels.pageSubtitle}
        filtersTitle={labels.filtersTitle}
        filtersLabels={labels.filtersLabels}
        summaryLabels={labels.summaryLabels}
        totalsLabel={labels.totalsLabel}
        ledgerTitle={labels.ledgerTitle}
        ledgerLabels={labels.ledgerLabels}
        fromDate={fromDate}
        toDate={toDate}
        teacherId={teacherId}
        reportType={reportType}
        teachers={teachers}
        rows={rows}
        summary={summary}
        canGenerate={canGenerate}
        onFromDateChange={onFromDateChange}
        onToDateChange={onToDateChange}
        onTeacherChange={onTeacherChange}
        onReportTypeChange={onReportTypeChange}
        onSubmit={onSubmit}
        onRowClick={onRowClick}
      />
    );
  }

  return (
    <ReportsDesktopView
      pageTitle={labels.pageTitle}
      pageSubtitle={labels.pageSubtitle}
      filtersLabels={labels.filtersLabels}
      tableLabels={labels.tableLabels}
      summaryLabels={labels.summaryLabels}
      totalsLabel={labels.totalsLabel}
      exportCsvLabel={labels.exportCsv}
      printReportLabel={labels.printReport}
      fromDate={fromDate}
      toDate={toDate}
      teacherId={teacherId}
      reportType={reportType}
      teachers={teachers}
      rows={rows}
      summary={summary}
      canGenerate={canGenerate}
      loading={loading}
      onFromDateChange={onFromDateChange}
      onToDateChange={onToDateChange}
      onTeacherChange={onTeacherChange}
      onReportTypeChange={onReportTypeChange}
      onSubmit={onSubmit}
      onExportCsv={onExportCsv}
      onPrintReport={onPrintReport}
      onRowClick={onRowClick}
    />
  );
}
