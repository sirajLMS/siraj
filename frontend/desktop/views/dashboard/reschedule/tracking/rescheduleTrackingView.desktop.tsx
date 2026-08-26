"use client";

import { FileDownloadOutlined } from "@mui/icons-material";
import {
  buildTrackingTableHeaders,
  buildTrackingTableLabels,
} from "@/frontend/common/views/dashboard/reschedule/tracking/__shared__/rescheduleTrackingShared";
import {
  TrackingFilterActionsContainer,
  TrackingFilterSelect,
} from "@/frontend/common/views/dashboard/reschedule/tracking/__shared__/trackingFilterShared";
import type { RescheduleTrackingViewProps } from "@/frontend/common/views/dashboard/reschedule/tracking/tracking.types";
import {
  DesktopExportButton,
  DesktopPageContainer,
  DesktopPageHeader,
  DesktopSectionPanel,
} from "@/frontend/desktop/components/ui";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card";
import { RescheduleTrackingDataGridDesktop } from "@/frontend/desktop/views/dashboard/reschedule/tracking/components/rescheduleTrackingDataGrid.desktop";

export function RescheduleTrackingViewDesktop({
  metrics,
  rows,
  labels,
  onApprove,
  onReject,
  onView,
  onExport,
  onFilterChange,
  statusFilter,
  page,
  pageSize,
  totalCount,
  onPageChange,
  loading,
}: Readonly<RescheduleTrackingViewProps>) {
  const tableHeaders = buildTrackingTableHeaders(labels);
  const tableLabels = buildTrackingTableLabels(labels);

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={labels.pageTitle} />

      <DesktopMetricCardGrid metrics={metrics} size={{ md: 4, lg: 3 }} />

      <DesktopSectionPanel
        contentPadding={false}
        title={labels.sectionTitle}
        actions={
          <TrackingFilterActionsContainer>
            <TrackingFilterSelect statusFilter={statusFilter} onFilterChange={onFilterChange} labels={labels} />
            <DesktopExportButton id="tracking-export-btn" startIcon={<FileDownloadOutlined />} onClick={onExport}>
              {labels.exportData}
            </DesktopExportButton>
          </TrackingFilterActionsContainer>
        }
      >
        <RescheduleTrackingDataGridDesktop
          rows={rows}
          headers={tableHeaders}
          labels={tableLabels}
          onApprove={onApprove}
          onReject={onReject}
          onView={onView}
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={onPageChange}
          loading={loading}
        />
      </DesktopSectionPanel>
    </DesktopPageContainer>
  );
}
