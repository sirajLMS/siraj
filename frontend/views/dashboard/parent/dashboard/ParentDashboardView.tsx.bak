"use client";

import { FilterListOutlined } from "@mui/icons-material";
import { Box, Grid, useMediaQuery, useTheme } from "@mui/material";
import { FilterButton, PageContainer, PrimaryPageAction, SectionPanel } from "@/frontend/components/ui";
import { AcademicProgressSummary } from "@/frontend/views/dashboard/parent/dashboard/components/AcademicProgressSummary";
import { ParentDashboardMetricsRow } from "@/frontend/views/dashboard/parent/dashboard/components/ParentDashboardMetrics";
import { ParentScheduleCardList } from "@/frontend/views/dashboard/parent/dashboard/components/ParentScheduleCardList";
import { ParentScheduleDataGrid } from "@/frontend/views/dashboard/parent/dashboard/components/ParentScheduleDataGrid";
import { ParentSupportFab } from "@/frontend/views/dashboard/parent/dashboard/components/ParentSupportFab";
import { ParentWelcomeHero } from "@/frontend/views/dashboard/parent/dashboard/components/ParentWelcomeHero";
import { WorkshopPromoCard } from "@/frontend/views/dashboard/parent/dashboard/components/WorkshopPromoCard";
import type { ParentDashboardLabels } from "@/frontend/views/dashboard/parent/dashboard/types/parentDashboardLabels";
import type {
  ParentDashboardMetrics,
  ParentScheduleRow,
  StudentProgressItem,
  WorkshopPromo,
} from "@/frontend/views/dashboard/parent/dashboard/types/parentDashboardTypes";

export interface SchedulePagination {
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly onPageChange: (page: number) => void;
}

interface ParentDashboardViewProps {
  readonly userName: string;
  readonly metrics: ParentDashboardMetrics;
  readonly scheduleRows: readonly ParentScheduleRow[];
  readonly studentProgress: readonly StudentProgressItem[];
  readonly workshopPromo: WorkshopPromo | null;
  readonly schedulePagination?: SchedulePagination;
  readonly labels: ParentDashboardLabels;
  readonly onFilter: () => void;
  readonly onViewFullWeek: () => void;
  readonly onViewAll: () => void;
  readonly onHistory: (id: string) => void;
  readonly onDownloadReport: () => void;
  readonly onLearnMore: () => void;
  readonly onSupport: () => void;
}

function DesktopScheduleActions({
  labels,
  onFilter,
  onViewFullWeek,
}: {
  readonly labels: ParentDashboardLabels;
  readonly onFilter: () => void;
  readonly onViewFullWeek: () => void;
}) {
  return (
    <>
      <FilterButton startIcon={<FilterListOutlined />} onClick={onFilter}>
        {labels.schedule.filter}
      </FilterButton>
      <PrimaryPageAction onClick={onViewFullWeek}>{labels.schedule.viewFullWeek}</PrimaryPageAction>
    </>
  );
}

function MobileScheduleHeader({
  labels,
  onViewAll,
}: {
  readonly labels: ParentDashboardLabels;
  readonly onViewAll: () => void;
}) {
  return (
    <SectionPanel
      title={labels.schedule.titleMobile}
      actions={
        <PrimaryPageAction variant="text" onClick={onViewAll} sx={{ minWidth: "auto", px: 0 }}>
          {labels.schedule.viewAll}
        </PrimaryPageAction>
      }
    />
  );
}

export function ParentDashboardView({
  userName,
  metrics,
  scheduleRows,
  studentProgress,
  workshopPromo,
  schedulePagination,
  labels,
  onFilter,
  onViewFullWeek,
  onViewAll,
  onHistory,
  onDownloadReport,
  onLearnMore,
  onSupport,
}: Readonly<ParentDashboardViewProps>) {
  const isMobile = useMediaQuery(useTheme().breakpoints.down("lg"));

  return (
    <PageContainer>
      {isMobile && (
        <ParentWelcomeHero
          userName={userName}
          welcomeBackLabel={labels.welcomeBack}
          pendingMessagesLabel={labels.pendingMessages}
        />
      )}

      <Box sx={{ mb: 4 }}>
        <ParentDashboardMetricsRow metrics={metrics} labels={labels.metrics} isMobile={isMobile} />
      </Box>

      {isMobile ? (
        <Box sx={{ mb: 4 }}>
          <MobileScheduleHeader labels={labels} onViewAll={onViewAll} />
          <ParentScheduleCardList rows={scheduleRows} labels={labels} pagination={schedulePagination} />
        </Box>
      ) : (
        <SectionPanel
          title={labels.schedule.title}
          actions={<DesktopScheduleActions labels={labels} onFilter={onFilter} onViewFullWeek={onViewFullWeek} />}
          sx={{ mb: 4 }}
        >
          <ParentScheduleDataGrid
            rows={scheduleRows}
            labels={labels}
            onHistory={onHistory}
            pagination={schedulePagination}
          />
        </SectionPanel>
      )}

      {isMobile ? (
        <AcademicProgressSummary
          studentProgress={studentProgress}
          labels={labels.progress}
          onDownloadReport={onDownloadReport}
        />
      ) : (
        <Grid container spacing={3}>
          {workshopPromo && (
            <Grid size={{ xs: 12, lg: 6 }}>
              <WorkshopPromoCard promo={workshopPromo} labels={labels.workshop} onLearnMore={onLearnMore} />
            </Grid>
          )}
          <Grid size={{ xs: 12, lg: workshopPromo ? 6 : 12 }}>
            <AcademicProgressSummary
              studentProgress={studentProgress}
              labels={labels.progress}
              onDownloadReport={onDownloadReport}
            />
          </Grid>
        </Grid>
      )}

      {!isMobile && <ParentSupportFab label={labels.support.liveSupport} onClick={onSupport} />}
    </PageContainer>
  );
}
