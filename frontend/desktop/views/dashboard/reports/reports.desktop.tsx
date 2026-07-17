"use client";

import { FileDownloadOutlined, PrintOutlined } from "@mui/icons-material";
import { Grid } from "@mui/material";
import { BaseCard, FilterButton, PageContainer, PageHeader, SectionPanel } from "@/frontend/common/components/ui";
import type { ReportsViewModel } from "@/frontend/common/views/dashboard/reports/useReportsViewModel";
import { EngagementRateCardDesktop } from "@/frontend/desktop/views/dashboard/reports/components/engagementRateCard.desktop";
import { FinancialDistributionCardDesktop } from "@/frontend/desktop/views/dashboard/reports/components/financialDistributionCard.desktop";
import { ReportFiltersFormDesktop } from "@/frontend/desktop/views/dashboard/reports/components/reportFiltersForm.desktop";
import { ReportsDataGridDesktop } from "@/frontend/desktop/views/dashboard/reports/components/reportsDataGrid.desktop";
import { ReportsTotalsSectionDesktop } from "@/frontend/desktop/views/dashboard/reports/components/reportsTotalsSection.desktop";

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
        <ReportFiltersFormDesktop
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
        <ReportsDataGridDesktop
          rows={rows}
          labels={labels.tableLabels}
          reportType={reportType}
          loading={loading}
          onRowClick={onRowClick}
        />
        <ReportsTotalsSectionDesktop summary={summary} rows={rows} totalsLabel={labels.totalsLabel} />
      </SectionPanel>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <EngagementRateCardDesktop
            rate={summary.engagementRate}
            growth={summary.engagementGrowth}
            title={labels.summaryLabels.engagementRate}
            subtitle={labels.summaryLabels.engagementGrowth}
            increaseLabel={labels.summaryLabels.increase}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <FinancialDistributionCardDesktop
            currencyDistribution={summary.currencyDistribution}
            title={labels.summaryLabels.financialDistribution}
            subtitle={labels.summaryLabels.financialSubtitle}
          />
        </Grid>
      </Grid>
    </PageContainer>
  );
}
