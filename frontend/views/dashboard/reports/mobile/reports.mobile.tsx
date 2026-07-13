"use client";

import {
  MobileCardList,
  MobileCardListItem,
  MobileContentStack,
  MobilePageHeader,
  PageContainer,
  SectionPanel,
} from "@/frontend/common/components/ui";
import { EngagementRateCard } from "@/frontend/views/dashboard/reports/components/EngagementRateCard";
import { FinancialDistributionCard } from "@/frontend/views/dashboard/reports/components/FinancialDistributionCard";
import { PerformanceLedgerCard } from "@/frontend/views/dashboard/reports/components/PerformanceLedgerCard";
import { ReportFiltersCollapsible } from "@/frontend/views/dashboard/reports/components/ReportFiltersCollapsible";
import { ReportsTotalsSection } from "@/frontend/views/dashboard/reports/components/ReportsTotalsSection";
import type { ReportLedgerRow } from "@/frontend/views/dashboard/reports/types/reportsTypes";
import type { ReportsViewModel } from "@/frontend/views/dashboard/reports/useReportsViewModel";

export function ReportsMobileView({
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
  onRowClick,
}: Readonly<ReportsViewModel>) {
  return (
    <PageContainer>
      <MobilePageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} edgeToEdge={false} />

      <MobileContentStack gap={3} paddingBottom={4}>
        <ReportFiltersCollapsible
          title={labels.filtersTitle}
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

        <EngagementRateCard
          rate={summary.engagementRate}
          growth={summary.engagementGrowth}
          title={labels.summaryLabels.engagementRate}
          subtitle={labels.summaryLabels.engagementGrowth}
          increaseLabel=""
          compact
        />

        <FinancialDistributionCard
          currencyDistribution={summary.currencyDistribution}
          title={labels.summaryLabels.financialDistribution}
          subtitle={labels.summaryLabels.financialSubtitle}
          compact
        />

        <SectionPanel title={labels.ledgerTitle}>
          <ReportsTotalsSection summary={summary} rows={rows} totalsLabel={labels.totalsLabel} variant="mobile" />

          <MobileCardList<ReportLedgerRow>
            rows={rows}
            getKey={row => row.id}
            loading={loading}
            emptyMessage={labels.tableLabels.noEntries}
            gap={2}
            renderItem={row => (
              <MobileCardListItem key={row.id} interactive={Boolean(onRowClick)}>
                <PerformanceLedgerCard row={row} labels={labels.ledgerLabels} onClick={onRowClick} />
              </MobileCardListItem>
            )}
          />
        </SectionPanel>
      </MobileContentStack>
    </PageContainer>
  );
}
