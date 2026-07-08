"use client";

import { FileDownloadOutlined } from "@mui/icons-material";
import { Box, MenuItem, Select, type SelectChangeEvent, useMediaQuery, useTheme } from "@mui/material";
import { MetricCardGrid } from "@/frontend/components/reports/MetricCardGrid";
import { ExportButton, PageContainer, PageHeader, SectionPanel } from "@/frontend/components/ui";
import type { LeaveRequestStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import { RescheduleTrackingCardList } from "./RescheduleTrackingCardList";
import { RescheduleTrackingDataGrid } from "./RescheduleTrackingDataGrid";
import { getTrackingStatusLabel } from "./tracking.helpers";
import type { RescheduleTrackingViewProps } from "./tracking.types";
import { STATUS_FILTER_OPTIONS } from "./tracking.types";

export function RescheduleTrackingView({
  metrics,
  rows,
  labels,
  loading,
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
}: RescheduleTrackingViewProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

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
          isMobile ? (
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>{filterSelect}</Box>
          ) : (
            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
              {filterSelect}
              <ExportButton id="tracking-export-btn" startIcon={<FileDownloadOutlined />} onClick={onExport}>
                {labels.exportData}
              </ExportButton>
            </Box>
          )
        }
      >
        {isMobile ? (
          <Box sx={{ p: 2 }}>
            <RescheduleTrackingCardList
              rows={rows}
              labels={tableLabels}
              onView={onView}
              page={page}
              pageSize={pageSize}
              totalCount={totalCount}
              onPageChange={onPageChange}
            />
          </Box>
        ) : (
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
        )}
      </SectionPanel>
    </PageContainer>
  );
}
