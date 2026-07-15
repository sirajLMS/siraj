"use client";

import { ChildCareOutlined, EventOutlined, PaymentsOutlined, TrendingUpOutlined } from "@mui/icons-material";
import { Grid } from "@mui/material";
import type { ReactNode } from "react";
import { PageContainer, PaginationControls, PrimaryPageAction, SectionPanel } from "@/frontend/common/components/ui";
import { MetricCard } from "@/frontend/common/components/ui/card/MetricCard";
import { AcademicProgressSummary } from "@/frontend/common/views/dashboard/parent/dashboard/components/AcademicProgressSummary";
import { ParentWelcomeHero } from "@/frontend/common/views/dashboard/parent/dashboard/components/ParentWelcomeHero";
import type { ParentScheduleRow } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardTypes";
import type { ParentDashboardViewModel } from "@/frontend/common/views/dashboard/parent/dashboard/useParentDashboardViewModel";
import { MobileCardList, MobileContentStack } from "@/frontend/mobile/components/ui";
import { ParentScheduleCardMobile } from "@/frontend/mobile/views/dashboard/parent/dashboard/components/parentScheduleCard.mobile";

function formatCount(value: number): string {
  return String(value).padStart(2, "0");
}

interface MobileScheduleSectionProps {
  readonly scheduleRows: readonly ParentScheduleRow[];
  readonly labels: ParentDashboardViewModel["labels"];
  readonly onViewAll: () => void;
  readonly schedulePagination?: ParentDashboardViewModel["schedulePagination"];
  readonly pageCount: number;
}

function MobileScheduleSection({
  scheduleRows,
  labels,
  onViewAll,
  schedulePagination,
  pageCount,
}: MobileScheduleSectionProps) {
  const renderItem = (row: ParentScheduleRow): ReactNode => <ParentScheduleCardMobile row={row} labels={labels} />;

  return (
    <>
      <SectionPanel
        title={labels.schedule.titleMobile}
        actions={
          <PrimaryPageAction variant="text" onClick={onViewAll} sx={{ minWidth: "auto", px: 0 }}>
            {labels.schedule.viewAll}
          </PrimaryPageAction>
        }
      >
        <MobileCardList<ParentScheduleRow>
          rows={scheduleRows}
          emptyMessage={labels.schedule.noEntries}
          gap={2}
          layout="edge-to-edge"
          getKey={row => row.id}
          renderItem={renderItem}
        />
      </SectionPanel>

      {schedulePagination && schedulePagination.totalCount > 0 && pageCount > 1 ? (
        <PaginationControls
          page={schedulePagination.page}
          pageCount={pageCount}
          rowCount={schedulePagination.totalCount}
          pageSize={schedulePagination.pageSize}
          embedded
          onPageChange={schedulePagination.onPageChange}
        />
      ) : null}
    </>
  );
}

export function ParentDashboardMobileView({
  userName,
  metrics,
  scheduleRows,
  studentProgress,
  schedulePagination,
  labels,
  onViewAll,
  onDownloadReport,
  pageCount,
}: Readonly<ParentDashboardViewModel>) {
  return (
    <PageContainer>
      <MobileContentStack>
        <ParentWelcomeHero
          userName={userName}
          welcomeBackLabel={labels.welcomeBack}
          pendingMessagesLabel={labels.pendingMessages}
          pendingMessagesCount={metrics.pendingMessages}
        />

        <Grid container spacing={2}>
          <Grid size={6}>
            <MetricCard
              icon={ChildCareOutlined}
              label={labels.metrics.totalStudents}
              value={formatCount(metrics.totalStudents)}
              variant="compact"
            />
          </Grid>
          <Grid size={6}>
            <MetricCard
              icon={EventOutlined}
              label={labels.metrics.todaysClasses}
              value={formatCount(metrics.todaysClasses)}
              variant="compact"
            />
          </Grid>
          <Grid size={6}>
            <MetricCard
              icon={PaymentsOutlined}
              label={labels.metrics.pendingInvoices}
              value={metrics.pendingInvoicesAmount}
              variant="error"
            />
          </Grid>
          <Grid size={6}>
            <MetricCard
              icon={TrendingUpOutlined}
              label={labels.metrics.performanceAvg}
              value={`${metrics.performanceAvgMobile}%`}
              variant="compact"
            />
          </Grid>
        </Grid>

        <MobileScheduleSection
          scheduleRows={scheduleRows}
          labels={labels}
          onViewAll={onViewAll}
          schedulePagination={schedulePagination}
          pageCount={pageCount}
        />

        <AcademicProgressSummary
          studentProgress={studentProgress}
          labels={labels.progress}
          onDownloadReport={onDownloadReport}
        />
      </MobileContentStack>
    </PageContainer>
  );
}
