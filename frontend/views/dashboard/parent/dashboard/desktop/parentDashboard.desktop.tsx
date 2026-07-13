"use client";

import { FilterListOutlined } from "@mui/icons-material";
import { Box, Grid } from "@mui/material";
import { FilterButton, PageContainer, PrimaryPageAction, SectionPanel } from "@/frontend/common/components/ui";
import { AcademicProgressSummary } from "@/frontend/views/dashboard/parent/dashboard/components/AcademicProgressSummary";
import { ParentDashboardMetricsRow } from "@/frontend/views/dashboard/parent/dashboard/components/ParentDashboardMetrics";
import { ParentScheduleDataGrid } from "@/frontend/views/dashboard/parent/dashboard/components/ParentScheduleDataGrid";
import { ParentSupportFab } from "@/frontend/views/dashboard/parent/dashboard/components/ParentSupportFab";
import { WorkshopPromoCard } from "@/frontend/views/dashboard/parent/dashboard/components/WorkshopPromoCard";
import type { ParentDashboardViewModel } from "@/frontend/views/dashboard/parent/dashboard/useParentDashboardViewModel";

export function ParentDashboardDesktopView({
  metrics,
  scheduleRows,
  studentProgress,
  workshopPromo,
  schedulePagination,
  labels,
  onFilter,
  onViewFullWeek,
  onHistory,
  onDownloadReport,
  onLearnMore,
  onSupport,
}: Readonly<ParentDashboardViewModel>) {
  return (
    <PageContainer>
      <Box sx={{ mb: 4 }}>
        <ParentDashboardMetricsRow metrics={metrics} labels={labels.metrics} isMobile={false} />
      </Box>

      <SectionPanel
        title={labels.schedule.title}
        actions={
          <>
            <FilterButton startIcon={<FilterListOutlined />} onClick={onFilter}>
              {labels.schedule.filter}
            </FilterButton>
            <PrimaryPageAction onClick={onViewFullWeek}>{labels.schedule.viewFullWeek}</PrimaryPageAction>
          </>
        }
        sx={{ mb: 4 }}
      >
        <ParentScheduleDataGrid
          rows={scheduleRows}
          labels={labels}
          onHistory={onHistory}
          pagination={schedulePagination}
        />
      </SectionPanel>

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

      <ParentSupportFab label={labels.support.liveSupport} onClick={onSupport} />
    </PageContainer>
  );
}
