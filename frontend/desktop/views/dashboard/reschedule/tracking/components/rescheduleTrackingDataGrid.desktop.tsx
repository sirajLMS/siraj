"use client";

import { CheckOutlined, CloseOutlined, Details as DetailsIcon } from "@mui/icons-material";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { LeaveRequestStatus, RescheduleDateLabel } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import {
  getTrackingStatusIcon,
  getTrackingStatusLabel,
} from "@/frontend/common/views/dashboard/reschedule/tracking/tracking.helpers";
import type {
  RescheduleTrackingDataGridProps,
  TrackingRow,
} from "@/frontend/common/views/dashboard/reschedule/tracking/tracking.types";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui/dataGrid/DesktopAppDataGrid";
import { DesktopPersonProfileLinkCell } from "@/frontend/desktop/components/ui/display";

export function RescheduleTrackingDataGridDesktop({
  rows,
  headers,
  labels,
  onApprove,
  onReject,
  onView,
  page = 0,
  pageSize = 10,
  totalCount,
  onPageChange,
  loading = false,
}: RescheduleTrackingDataGridProps) {
  const columns = useMemo<GridColDef<TrackingRow>[]>(
    () => [
      {
        field: "teacherName",
        headerName: headers.teacherName,
        flex: 1.2,
        minWidth: 200,
        renderCell: ({ row }) => (
          <DesktopPersonProfileLinkCell
            href={profileHrefForTeacher({ teacherId: row.teacherId })}
            name={row.teacherName ?? ""}
            avatarUrl={row.teacherAvatarUrl}
            avatarSize={36}
            typographyVariant="bodyMd"
            fontWeight={700}
          />
        ),
      },
      {
        field: "studentName",
        headerName: headers.studentName,
        flex: 1,
        minWidth: 160,
        renderCell: ({ row }) => (
          <DesktopPersonProfileLinkCell
            href={row.studentId ? studentHref(row.studentId) : undefined}
            name={row.studentName ?? ""}
            avatarSize={36}
            typographyVariant="bodyMd"
            fontWeight={400}
            emphasizeLink={Boolean(row.studentId)}
          />
        ),
      },
      {
        field: "scheduledDate",
        headerName: headers.scheduledDate,
        flex: 1,
        minWidth: 160,
        renderCell: ({ row }) => {
          const isLeaveRequest = row.dateLabel === RescheduleDateLabel.LeaveRequest;
          return (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 0.8,
                alignSelf: "center",
                height: "100%",
                justifyContent: "center",
              }}
            >
              <Typography variant="bodyMd">{row.scheduledDate}</Typography>
              <Box
                sx={theme => ({
                  display: "inline-flex",
                  alignItems: "center",
                  px: 1,
                  py: 0.25,
                  borderRadius: 0.75,
                  backgroundColor: isLeaveRequest ? theme.palette.error.main : theme.palette.primary.main,
                  width: "fit-content",
                })}
              >
                <Typography
                  variant="labelSm"
                  sx={theme => ({
                    color: isLeaveRequest ? theme.palette.onError : theme.palette.onPrimary,
                    fontWeight: 700,
                  })}
                >
                  {isLeaveRequest ? labels.leaveRequest : labels.newDate}
                </Typography>
              </Box>
            </Box>
          );
        },
      },
      {
        field: "timeSlot",
        headerName: headers.timeSlot,
        width: 140,
        flex: 1,
        renderCell: ({ row }) => (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary, whiteSpace: "nowrap" })}>
            {row.timeSlot}
          </Typography>
        ),
      },
      {
        field: "status",
        headerName: headers.classStatus,
        width: 160,
        flex: 1,
        renderCell: ({ row }) => {
          const status = row.status ?? LeaveRequestStatus.Pending;
          const hasStatus = row.status !== null;
          return (
            <DesktopStatusBadge
              category="trackingStatus"
              status={status}
              label={hasStatus ? getTrackingStatusLabel(status, { ...labels, filterAll: "" }) : ""}
              icon={hasStatus ? getTrackingStatusIcon(status, { fontSize: 14, color: "inherit" }) : null}
            />
          );
        },
      },
      {
        field: "actions",
        headerName: headers.action,
        width: 100,
        sortable: false,
        align: "right",
        headerAlign: "center",
        renderCell: ({ row }) => {
          const rowId = row.id ?? "";
          if (row.status !== null && row.status === LeaveRequestStatus.Pending) {
            return (
              <Box sx={{ height: "100%", display: "flex", alignItems: "center" }}>
                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, width: "100%" }}>
                  <Tooltip title={labels.approveLeave}>
                    <IconButton
                      id={`approve-leave-${rowId}`}
                      size="small"
                      onClick={() => {
                        onApprove(rowId);
                      }}
                      sx={theme => ({
                        typography: "labelUppercase",
                        borderRadius: 1.5,
                        boxShadow: "none",
                        backgroundColor: theme.palette.primary.main,
                        color: theme.palette.onPrimary,
                        "&:hover": {
                          backgroundColor: alpha(theme.palette.primary.dark, 0.9),
                        },
                      })}
                    >
                      <CheckOutlined />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={labels.rejectLeave}>
                    <IconButton
                      id={`reject-leave-${rowId}`}
                      size="small"
                      onClick={() => {
                        onReject(rowId);
                      }}
                      sx={theme => ({
                        typography: "labelUppercase",
                        borderRadius: 1.5,
                        boxShadow: "none",
                        backgroundColor: theme.palette.error.main,
                        color: theme.palette.onError,
                        "&:hover": {
                          backgroundColor: alpha(theme.palette.error.dark, 0.9),
                        },
                      })}
                    >
                      <CloseOutlined />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            );
          }

          return (
            <Tooltip title={labels.viewDetails}>
              <IconButton
                id={`view-tracking-${rowId}`}
                onClick={() => {
                  onView(rowId);
                }}
                sx={theme => ({
                  color: theme.palette.primary.main,
                })}
              >
                <DetailsIcon />
              </IconButton>
            </Tooltip>
          );
        },
      },
    ],
    [headers, labels, onApprove, onReject, onView]
  );

  const isServerPagination = totalCount !== undefined && onPageChange !== undefined;

  return (
    <DesktopAppDataGrid<TrackingRow>
      rows={rows}
      columns={columns}
      loading={loading}
      getRowId={row => row.id ?? ""}
      autoHeight
      ariaLabel="reschedule-tracking-table"
      emptyMessage={labels.noEntries}
      rowHeight={80}
      paginationOptions={
        isServerPagination
          ? buildServerPaginationOptions({
              page,
              pageSize,
              totalCount,
              onPageChange,
              pageSizeOptions: [pageSize],
            })
          : { mode: "client" }
      }
    />
  );
}
