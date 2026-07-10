"use client";

import { FileDownloadOutlined, PrintOutlined } from "@mui/icons-material";
import { Grid } from "@mui/material";
import { BaseCard, FilterButton, PageContainer, PageHeader, SectionPanel } from "@/frontend/components/ui";
import { EngagementRateCard } from "@/frontend/views/dashboard/reports/components/EngagementRateCard";
import { FinancialDistributionCard } from "@/frontend/views/dashboard/reports/components/FinancialDistributionCard";
import type { ReportFiltersFormLabels } from "@/frontend/views/dashboard/reports/components/ReportFiltersForm";
import { ReportFiltersForm } from "@/frontend/views/dashboard/reports/components/ReportFiltersForm";
import {
  ReportsDataGrid,
  type ReportsDataGridLabels,
} from "@/frontend/views/dashboard/reports/components/ReportsDataGrid";
import { ReportsTotalsSection } from "@/frontend/views/dashboard/reports/components/ReportsTotalsSection";
import type {
  ReportsSharedViewProps,
  ReportsSummaryLabels,
} from "@/frontend/views/dashboard/reports/types/reportsViewTypes";

interface ReportsDesktopViewProps extends ReportsSharedViewProps {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly filtersLabels: ReportFiltersFormLabels;
  readonly tableLabels: ReportsDataGridLabels;
  readonly summaryLabels: ReportsSummaryLabels;
  readonly totalsLabel: string;
  readonly exportCsvLabel: string;
  readonly printReportLabel: string;
}

export function ReportsDesktopView({
  pageTitle,
  pageSubtitle,
  filtersLabels,
  tableLabels,
  summaryLabels,
  totalsLabel,
  exportCsvLabel,
  printReportLabel,
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
}: Readonly<ReportsDesktopViewProps>) {
  return (
    <PageContainer>
      <PageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        actions={
          <>
            <FilterButton startIcon={<FileDownloadOutlined />} disabled={!canGenerate} onClick={onExportCsv}>
              {exportCsvLabel}
            </FilterButton>
            <FilterButton startIcon={<PrintOutlined />} disabled={!canGenerate} onClick={onPrintReport}>
              {printReportLabel}
            </FilterButton>
          </>
        }
      />

      <BaseCard>
        <ReportFiltersForm
          fromDate={fromDate}
          toDate={toDate}
          teacherId={teacherId}
          reportType={reportType}
          teachers={teachers}
          labels={filtersLabels}
          canGenerate={canGenerate}
          onFromDateChange={onFromDateChange}
          onToDateChange={onToDateChange}
          onTeacherChange={onTeacherChange}
          onReportTypeChange={onReportTypeChange}
          onSubmit={onSubmit}
        />
      </BaseCard>

      <SectionPanel>
        <ReportsDataGrid
          rows={rows}
          labels={tableLabels}
          reportType={reportType}
          loading={loading}
          onRowClick={onRowClick}
        />
        <ReportsTotalsSection summary={summary} rows={rows} totalsLabel={totalsLabel} variant="desktop" />
      </SectionPanel>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <EngagementRateCard
            rate={summary.engagementRate}
            growth={summary.engagementGrowth}
            title={summaryLabels.engagementRate}
            subtitle={summaryLabels.engagementGrowth}
            increaseLabel={summaryLabels.increase}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <FinancialDistributionCard
            currencyDistribution={summary.currencyDistribution}
            title={summaryLabels.financialDistribution}
            subtitle={summaryLabels.financialSubtitle}
          />
        </Grid>
      </Grid>
    </PageContainer>
  );
}
