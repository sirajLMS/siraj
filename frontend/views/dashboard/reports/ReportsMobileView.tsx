"use client";

import { Box, Typography } from "@mui/material";
import { PageContainer, PageHeader } from "@/frontend/components/ui";
import type {
  LedgerStatus,
  ReportLedgerRow,
  ReportsSummary,
  ReportTeacherOption,
  ReportType,
} from "@/frontend/stores/reportsStore";
import { EngagementRateCard } from "./components/EngagementRateCard";
import { FinancialDistributionCard } from "./components/FinancialDistributionCard";
import { PerformanceLedgerCardList } from "./components/PerformanceLedgerCardList";
import { ReportFiltersCollapsible } from "./components/ReportFiltersCollapsible";
import type { ReportFiltersFormLabels } from "./components/ReportFiltersForm";

interface ReportsMobileViewProps {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly filtersTitle: string;
  readonly filtersLabels: ReportFiltersFormLabels;
  readonly summaryLabels: {
    readonly engagementRate: string;
    readonly engagementGrowth: string;
    readonly financialDistribution: string;
    readonly egpLabel: string;
    readonly usdLabel: string;
  };
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
  readonly fromDate: string;
  readonly toDate: string;
  readonly teacherId: string;
  readonly reportType: ReportType;
  readonly teachers: readonly ReportTeacherOption[];
  readonly rows: readonly ReportLedgerRow[];
  readonly summary: ReportsSummary;
  readonly canGenerate: boolean;
  readonly onFromDateChange: (date: string) => void;
  readonly onToDateChange: (date: string) => void;
  readonly onTeacherChange: (teacherId: string) => void;
  readonly onReportTypeChange: (reportType: ReportType) => void;
  readonly onSubmit: () => void;
}

export function ReportsMobileView({
  pageTitle,
  pageSubtitle,
  filtersTitle,
  filtersLabels,
  summaryLabels,
  ledgerTitle,
  ledgerLabels,
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
}: Readonly<ReportsMobileViewProps>) {
  return (
    <PageContainer>
      <PageHeader title={pageTitle} subtitle={pageSubtitle} titleVariant="headlineMd" />

      <ReportFiltersCollapsible
        title={filtersTitle}
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

      <EngagementRateCard
        rate={summary.engagementRate}
        growth={summary.engagementGrowth}
        title={summaryLabels.engagementRate}
        subtitle={summaryLabels.engagementGrowth}
        increaseLabel=""
        compact
      />

      <FinancialDistributionCard
        egpPercent={summary.egpPercent}
        usdPercent={summary.usdPercent}
        title={summaryLabels.financialDistribution}
        subtitle=""
        egpLabel={summaryLabels.egpLabel}
        usdLabel={summaryLabels.usdLabel}
        compact
      />

      <Box>
        <Typography variant="titleLg" sx={{ color: theme => theme.palette.primary.main, mb: 2, px: 0.5 }}>
          {ledgerTitle}
        </Typography>
        <PerformanceLedgerCardList rows={rows} labels={ledgerLabels} />
      </Box>
    </PageContainer>
  );
}
