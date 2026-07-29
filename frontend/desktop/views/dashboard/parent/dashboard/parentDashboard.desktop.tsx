"use client";

import { FilterListOutlined } from "@mui/icons-material";
import { Box, Grid } from "@mui/material";
import type { ParentDashboardViewModel } from "@/frontend/common/views/dashboard/parent/dashboard/useParentDashboardViewModel";
import {
  DesktopFilterButton,
  DesktopPageContainer,
  DesktopPrimaryPageAction,
  DesktopSectionPanel,
} from "@/frontend/desktop/components/ui";
import { AcademicProgressSummaryDesktop } from "@/frontend/desktop/views/dashboard/parent/dashboard/components/academicProgressSummary.desktop";
import { ParentDashboardMetricsRowDesktop } from "@/frontend/desktop/views/dashboard/parent/dashboard/components/parentDashboardMetrics.desktop";
import { ParentScheduleDataGridDesktop } from "@/frontend/desktop/views/dashboard/parent/dashboard/components/parentScheduleDataGrid.desktop";
import { ParentSupportFabDesktop } from "@/frontend/desktop/views/dashboard/parent/dashboard/components/parentSupportFab.desktop";
import { WorkshopPromoCardDesktop } from "@/frontend/desktop/views/dashboard/parent/dashboard/components/workshopPromoCard.desktop";

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
    <DesktopPageContainer>
      <Box sx={{ mb: 4 }}>
        <ParentDashboardMetricsRowDesktop metrics={metrics} labels={labels.metrics} />
      </Box>

      <DesktopSectionPanel
        contentPadding={false}
        title={labels.schedule.title}
        actions={
          <>
            <DesktopFilterButton startIcon={<FilterListOutlined />} onClick={onFilter}>
              {labels.schedule.filter}
            </DesktopFilterButton>
            <DesktopPrimaryPageAction onClick={onViewFullWeek}>{labels.schedule.viewFullWeek}</DesktopPrimaryPageAction>
          </>
        }
        sx={{ mb: 4 }}
      >
        <ParentScheduleDataGridDesktop
          rows={scheduleRows}
          labels={labels}
          onHistory={onHistory}
          pagination={schedulePagination}
        />
      </DesktopSectionPanel>

      <Grid container spacing={3}>
        {workshopPromo && (
          <Grid size={{ xs: 12, lg: 6 }}>
            <WorkshopPromoCardDesktop promo={workshopPromo} labels={labels.workshop} onLearnMore={onLearnMore} />
          </Grid>
        )}
        <Grid size={{ xs: 12, lg: workshopPromo ? 6 : 12 }}>
          <AcademicProgressSummaryDesktop
            studentProgress={studentProgress}
            labels={labels.progress}
            onDownloadReport={onDownloadReport}
          />
        </Grid>
      </Grid>

      <ParentSupportFabDesktop label={labels.support.liveSupport} onClick={onSupport} />
    </DesktopPageContainer>
  );
}
