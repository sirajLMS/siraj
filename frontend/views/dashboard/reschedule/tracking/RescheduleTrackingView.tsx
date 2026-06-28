"use client";

import { FileDownloadOutlined } from "@mui/icons-material";
import { Box, MenuItem, Select, type SelectChangeEvent, useMediaQuery, useTheme } from "@mui/material";
import { MetricCardGrid } from "@/frontend/components/reports/MetricCardGrid";
import { ExportButton, PageContainer, PageHeader, SectionPanel } from "@/frontend/components/ui";
import { LeaveRequestStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import type { MetricItem } from "@/frontend/views/dashboard/types/dashboard";
import { RescheduleTrackingCardList } from "./RescheduleTrackingCardList";
import { RescheduleTrackingDataGrid } from "./RescheduleTrackingDataGrid";
import type { TrackingRow } from "./types";
import { getTrackingStatusLabel } from "./types";

interface RescheduleTrackingViewLabels {
  readonly pageTitle: string;
  readonly sectionTitle: string;
  readonly exportData: string;
  readonly filterAll: string;
  readonly teacherName: string;
  readonly studentName: string;
  readonly scheduledDate: string;
  readonly timeSlot: string;
  readonly classStatus: string;
  readonly action: string;
  readonly newDate: string;
  readonly leaveRequest: string;
  readonly rescheduled: string;
  readonly pendingLeave: string;
  readonly viewDetails: string;
  readonly approveLeave: string;
  readonly rejectLeave: string;
  readonly showingOf: string;
  readonly noEntries: string;
  readonly statusPending: string;
  readonly statusRescheduled: string;
  readonly statusApproved: string;
  readonly statusCancelled: string;
}

interface RescheduleTrackingViewProps {
  readonly metrics: readonly MetricItem[];
  readonly rows: readonly TrackingRow[];
  readonly labels: RescheduleTrackingViewLabels;
  readonly onApprove: (id: string) => void;
  readonly onReject: (id: string) => void;
  readonly onView: (id: string) => void;
  readonly onExport: () => void;
  readonly onFilterChange: (status: LeaveRequestStatus | null) => void;
  readonly statusFilter: LeaveRequestStatus | null;
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly onPageChange: (page: number) => void;
}

const STATUS_FILTER_OPTIONS: readonly (LeaveRequestStatus | "")[] = [
  "",
  LeaveRequestStatus.Pending,
  LeaveRequestStatus.Rescheduled,
  LeaveRequestStatus.Approved,
  LeaveRequestStatus.Cancelled,
] as const;

export function RescheduleTrackingView({
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
    onFilterChange(value === "" ? null : (value as LeaveRequestStatus));
  };

  const filterSelect = (
    <Select<LeaveRequestStatus | "">
      value={statusFilter ?? ""}
      onChange={handleStatusFilterChange}
      size="small"
      displayEmpty
      sx={theme => ({
        minWidth: 140,
        fontSize: "0.875rem",
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
          />
        )}
      </SectionPanel>
    </PageContainer>
  );
}
