"use client";

import type { ReportsViewModel } from "@/frontend/common/views/dashboard/reports/useReportsViewModel";
import {
  MobileCardList,
  MobileCardListItem,
  MobileContentStack,
  MobilePageContainer,
  MobilePageHeader,
  MobileSectionPanel,
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
  filtersExpanded,
  onToggleFiltersExpanded,
  showFinancials,
  totalsDisplay,
  formatPaidAmounts,
}: Readonly<ReportsViewModel>) {
  return (
    <MobilePageContainer>
      <MobilePageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} edgeToEdge={false} />

      <MobileContentStack gap={3} paddingBottom={4}>
        <ReportFiltersCollapsibleMobile
          title={labels.filtersTitle}
          fromDate={fromDate}
          toDate={toDate}
          teacherId={teacherId}
          reportType={reportType}
          labels={labels.filtersLabels}
          canGenerate={canGenerate}
          expanded={filtersExpanded}
          onToggleExpanded={onToggleFiltersExpanded}
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

        <MobileSectionPanel title={labels.ledgerTitle} contentInset={false}>
          <ReportsTotalsSectionMobile
            summary={summary}
            rows={rows}
            totalsLabel={labels.totalsLabel}
            totalsDisplay={totalsDisplay}
            showFinancials={showFinancials}
          />

          <MobileCardList
            rows={rows}
            getKey={row => row.id}
            loading={loading}
            emptyMessage={labels.tableLabels.noEntries}
            gap={2}
            paginationOptions={{ mode: "client" }}
            renderItem={row => (
              <MobileCardListItem key={row.id} interactive={Boolean(onRowClick)}>
                <PerformanceLedgerCardMobile
                  row={row}
                  labels={labels.ledgerLabels}
                  showFinancials={showFinancials}
                  paidLabel={formatPaidAmounts(row.paidAmounts)}
                  onClick={onRowClick}
                />
              </MobileCardListItem>
            )}
          />
        </MobileSectionPanel>
      </MobileContentStack>
    </MobilePageContainer>
  );
}
