"use client";

import { FileDownloadOutlined, PrintOutlined } from "@mui/icons-material";
import { Grid } from "@mui/material";
import { BaseCard, FilterButton, PageContainer, PageHeader, SectionPanel } from "@/frontend/components/ui";
import { EngagementRateCard } from "@/frontend/views/dashboard/reports/components/EngagementRateCard";
import { FinancialDistributionCard } from "@/frontend/views/dashboard/reports/components/FinancialDistributionCard";
import { ReportFiltersForm } from "@/frontend/views/dashboard/reports/components/ReportFiltersForm";
import { ReportsDataGrid } from "@/frontend/views/dashboard/reports/components/ReportsDataGrid";
import { ReportsTotalsSection } from "@/frontend/views/dashboard/reports/components/ReportsTotalsSection";
import type { ReportsViewModel } from "@/frontend/views/dashboard/reports/useReportsViewModel";

export function ReportsDesktopView({
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
}: Readonly<ReportsViewModel>) {
  return (
    <PageContainer>
      <PageHeader
        title={labels.pageTitle}
        subtitle={labels.pageSubtitle}
        actions={
          <>
            <FilterButton startIcon={<FileDownloadOutlined />} disabled={!canGenerate} onClick={onExportCsv}>
              {labels.exportCsv}
            </FilterButton>
            <FilterButton startIcon={<PrintOutlined />} disabled={!canGenerate} onClick={onPrintReport}>
              {labels.printReport}
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
          labels={labels.filtersLabels}
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
          labels={labels.tableLabels}
          reportType={reportType}
          loading={loading}
          onRowClick={onRowClick}
        />
        <ReportsTotalsSection summary={summary} rows={rows} totalsLabel={labels.totalsLabel} variant="desktop" />
      </SectionPanel>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <EngagementRateCard
            rate={summary.engagementRate}
            growth={summary.engagementGrowth}
            title={labels.summaryLabels.engagementRate}
            subtitle={labels.summaryLabels.engagementGrowth}
            increaseLabel={labels.summaryLabels.increase}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <FinancialDistributionCard
            currencyDistribution={summary.currencyDistribution}
            title={labels.summaryLabels.financialDistribution}
            subtitle={labels.summaryLabels.financialSubtitle}
          />
        </Grid>
      </Grid>
    </PageContainer>
  );
}
