"use client";

import { PageContainer, SectionPanel } from "@/frontend/common/components/ui";
import type { ReportsViewModel } from "@/frontend/common/views/dashboard/reports/useReportsViewModel";
import {
  MobileCardList,
  MobileCardListItem,
  MobileContentStack,
  MobilePageHeader,
} from "@/frontend/mobile/components/ui";
import { EngagementRateCardMobile } from "@/frontend/mobile/views/dashboard/reports/components/engagementRateCard.mobile";
import { FinancialDistributionCardMobile } from "@/frontend/mobile/views/dashboard/reports/components/financialDistributionCard.mobile";
import { PerformanceLedgerCardMobile } from "@/frontend/mobile/views/dashboard/reports/components/performanceLedgerCard.mobile";
import { ReportFiltersCollapsibleMobile } from "@/frontend/mobile/views/dashboard/reports/components/reportFiltersCollapsible.mobile";
import { ReportsTotalsSectionMobile } from "@/frontend/mobile/views/dashboard/reports/components/reportsTotalsSection.mobile";

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
        <ReportFiltersCollapsibleMobile
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

        <EngagementRateCardMobile
          rate={summary.engagementRate}
          growth={summary.engagementGrowth}
          title={labels.summaryLabels.engagementRate}
          subtitle={labels.summaryLabels.engagementGrowth}
          increaseLabel=""
        />

        <FinancialDistributionCardMobile
          currencyDistribution={summary.currencyDistribution}
          title={labels.summaryLabels.financialDistribution}
          subtitle={labels.summaryLabels.financialSubtitle}
        />

        <SectionPanel title={labels.ledgerTitle}>
          <ReportsTotalsSectionMobile summary={summary} rows={rows} totalsLabel={labels.totalsLabel} />

          <MobileCardList
            rows={rows}
            getKey={row => row.id}
            loading={loading}
            emptyMessage={labels.tableLabels.noEntries}
            gap={2}
            renderItem={row => (
              <MobileCardListItem key={row.id} interactive={Boolean(onRowClick)}>
                <PerformanceLedgerCardMobile row={row} labels={labels.ledgerLabels} onClick={onRowClick} />
              </MobileCardListItem>
            )}
          />
        </SectionPanel>
      </MobileContentStack>
    </PageContainer>
  );
}
