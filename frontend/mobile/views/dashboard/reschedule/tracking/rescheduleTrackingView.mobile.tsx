"use client";

import { Box } from "@mui/material";
import { buildTrackingTableLabels } from "@/frontend/common/views/dashboard/reschedule/tracking/__shared__/rescheduleTrackingShared";
import { TrackingFilterSelect } from "@/frontend/common/views/dashboard/reschedule/tracking/__shared__/trackingFilterShared";
import type { RescheduleTrackingViewProps } from "@/frontend/common/views/dashboard/reschedule/tracking/tracking.types";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { MobileMetricCardGrid } from "@/frontend/mobile/components/ui/card/MobileMetricCardGrid";
import { MobileSectionPanel } from "@/frontend/mobile/components/ui/container";
import { RescheduleTrackingCardListMobile } from "@/frontend/mobile/views/dashboard/reschedule/tracking/components/rescheduleTrackingCardList.mobile";

export function RescheduleTrackingViewMobile({
  metrics,
  rows,
  labels,
  onApprove: _onApprove,
  onReject: _onReject,
  onView,
  onExport: _onExport,
  onFilterChange,
  statusFilter,
  page,
  pageSize,
  totalCount,
  onPageChange,
  loading: _loading,
}: Readonly<RescheduleTrackingViewProps>) {
  const tableLabels = buildTrackingTableLabels(labels);

  return (
    <MobilePageContainer>
      <MobilePageHeader title={labels.pageTitle} edgeToEdge={false} />

      <MobileMetricCardGrid metrics={metrics} />

      <MobileSectionPanel
        title={labels.sectionTitle}
        contentInset={false}
        actions={
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <TrackingFilterSelect statusFilter={statusFilter} onFilterChange={onFilterChange} labels={labels} />
          </Box>
        }
      >
        <Box sx={{ p: 2 }}>
          <RescheduleTrackingCardListMobile
            rows={rows}
            labels={tableLabels}
            onView={onView}
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={onPageChange}
          />
        </Box>
      </MobileSectionPanel>
    </MobilePageContainer>
  );
}
