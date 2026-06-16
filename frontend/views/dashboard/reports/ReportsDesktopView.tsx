"use client";

import { FileDownloadOutlined, PrintOutlined } from "@mui/icons-material";
import { Grid } from "@mui/material";
import { BaseCard, FilterButton, PageContainer, PageHeader, SectionPanel } from "@/frontend/components/ui";
import { EngagementRateCard } from "./components/EngagementRateCard";
import { FinancialDistributionCard } from "./components/FinancialDistributionCard";
import type { ReportFiltersFormLabels } from "./components/ReportFiltersForm";
import { ReportFiltersForm } from "./components/ReportFiltersForm";
import { ReportsDataGrid, type ReportsDataGridLabels } from "./components/ReportsDataGrid";
import { ReportsTotalsRow } from "./components/ReportsTotalsRow";
import type { ReportsSharedViewProps, ReportsSummaryLabels } from "./types/reportsViewTypes";

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
  onFromDateChange,
  onToDateChange,
  onTeacherChange,
  onReportTypeChange,
  onSubmit,
  onExportCsv,
  onPrintReport,
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
        <ReportsDataGrid rows={rows} labels={tableLabels} />
        <ReportsTotalsRow summary={summary} totalsLabel={totalsLabel} />
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
            egpPercent={summary.egpPercent}
            usdPercent={summary.usdPercent}
            title={summaryLabels.financialDistribution}
            subtitle={summaryLabels.financialSubtitle}
            egpLabel={summaryLabels.egpLabel}
            usdLabel={summaryLabels.usdLabel}
          />
        </Grid>
      </Grid>
    </PageContainer>
  );
}
