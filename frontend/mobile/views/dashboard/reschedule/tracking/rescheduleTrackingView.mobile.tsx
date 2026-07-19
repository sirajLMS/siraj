"use client";

import { Box, MenuItem, Select, type SelectChangeEvent } from "@mui/material";
import type { LeaveRequestStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { getTrackingStatusLabel } from "@/frontend/common/views/dashboard/reschedule/tracking/tracking.helpers";
import type { RescheduleTrackingViewProps } from "@/frontend/common/views/dashboard/reschedule/tracking/tracking.types";
import { STATUS_FILTER_OPTIONS } from "@/frontend/common/views/dashboard/reschedule/tracking/tracking.types";
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
  const tableLabels = {
    newDate: labels.newDate,
    leaveRequest: labels.leaveRequest,
    rescheduled: labels.rescheduled,
    pendingLeave: labels.pendingLeave,
    viewDetails: labels.viewDetails,
    approveLeave: labels.approveLeave,
    rejectLeave: labels.rejectLeave,
    noEntries: labels.noEntries,
    statusPending: labels.statusPending,
    statusRescheduled: labels.statusRescheduled,
    statusApproved: labels.statusApproved,
    statusCancelled: labels.statusCancelled,
  };

  const handleStatusFilterChange = (e: SelectChangeEvent<LeaveRequestStatus | "">) => {
    const value = e.target.value;
    onFilterChange(value === "" ? null : value);
  };

  const filterSelect = (
    <Select<LeaveRequestStatus | "">
      value={statusFilter ?? ""}
      onChange={handleStatusFilterChange}
      size="small"
      displayEmpty
      sx={theme => ({
        minWidth: 140,
        typography: "bodyMd",
        backgroundColor: theme.palette.surfaceContainerLow,
        "& .MuiSelect-select": { py: 0.5 },
      })}
    >
      {STATUS_FILTER_OPTIONS.map(status => (
        <MenuItem key={status} value={status}>
          {getTrackingStatusLabel(status, labels)}
        </MenuItem>
      ))}
    </Select>
  );

  return (
    <MobilePageContainer>
      <MobilePageHeader title={labels.pageTitle} edgeToEdge={false} />

      <MobileMetricCardGrid metrics={metrics} />

      <MobileSectionPanel
        title={labels.sectionTitle}
        contentInset={false}
        actions={<Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>{filterSelect}</Box>}
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
