"use client";

import { FileDownloadOutlined } from "@mui/icons-material";
import { Box, MenuItem, Select, type SelectChangeEvent } from "@mui/material";
import { MetricCardGrid } from "@/frontend/common/components/reports/MetricCardGrid";
import { ExportButton, PageContainer, PageHeader, SectionPanel } from "@/frontend/common/components/ui";
import type { LeaveRequestStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { RescheduleTrackingDataGrid } from "@/frontend/common/views/dashboard/reschedule/tracking/RescheduleTrackingDataGrid";
import { getTrackingStatusLabel } from "@/frontend/common/views/dashboard/reschedule/tracking/tracking.helpers";
import type { RescheduleTrackingViewProps } from "@/frontend/common/views/dashboard/reschedule/tracking/tracking.types";
import { STATUS_FILTER_OPTIONS } from "@/frontend/common/views/dashboard/reschedule/tracking/tracking.types";

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
  const tableHeaders = {
    teacherName: labels.teacherName,
    studentName: labels.studentName,
    scheduledDate: labels.scheduledDate,
    timeSlot: labels.timeSlot,
    classStatus: labels.classStatus,
    action: labels.action,
  };

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
    <PageContainer>
      <PageHeader title={labels.pageTitle} />

      <MetricCardGrid metrics={metrics} size={{ md: 4, lg: "grow" }} />

      <SectionPanel
        title={labels.sectionTitle}
        actions={
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
            {filterSelect}
            <ExportButton id="tracking-export-btn" startIcon={<FileDownloadOutlined />} onClick={onExport}>
              {labels.exportData}
            </ExportButton>
          </Box>
        }
      >
        <RescheduleTrackingDataGrid
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
      </SectionPanel>
    </PageContainer>
  );
}
