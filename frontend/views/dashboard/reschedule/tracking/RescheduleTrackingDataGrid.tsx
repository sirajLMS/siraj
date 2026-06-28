"use client";

import { LeaveRequestStatus as GqlLeaveRequestStatus, RescheduleDateLabel as GqlRescheduleDateLabel } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  CheckOutlined,
  CloseOutlined,
  Details as DetailsIcon,
  HistoryOutlined,
  WarningAmberOutlined,
} from "@mui/icons-material";
import { Avatar, Box, IconButton, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { AppDataGrid, GridPagination } from "@/frontend/components/ui";
import { StatusBadge } from "@/frontend/components/ui/StatusBadge";
import type { TrackingRow } from "./types";

interface RescheduleTrackingDataGridHeaders {
  readonly teacherName: string;
  readonly studentClass: string;
  readonly scheduledDate: string;
  readonly timeSlot: string;
  readonly classStatus: string;
  readonly action: string;
}

interface RescheduleTrackingDataGridLabels {
  readonly newDate: string;
  readonly leaveRequest: string;
  readonly rescheduled: string;
  readonly pendingLeave: string;
  readonly viewDetails: string;
  readonly approveLeave: string;
  readonly rejectLeave: string;
  readonly noEntries: string;
}

interface RescheduleTrackingDataGridProps {
  readonly rows: readonly TrackingRow[];
  readonly headers: RescheduleTrackingDataGridHeaders;
  readonly labels: RescheduleTrackingDataGridLabels;
  readonly onApprove: (id: string) => void;
  readonly onReject: (id: string) => void;
  readonly onView: (id: string) => void;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
}

export function RescheduleTrackingDataGrid({
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
}: RescheduleTrackingDataGridProps) {
  const columns = useMemo<GridColDef<TrackingRow>[]>(
    () => [
      {
        field: "teacherName",
        headerName: headers.teacherName,
        flex: 1.2,
        minWidth: 200,
        renderCell: ({ row }) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, alignSelf: "center", height: "100%" }}>
            <Avatar
              src={row.teacherAvatarUrl}
              sx={theme => ({
                width: 36,
                height: 36,
                fontSize: "12px",
                fontWeight: 700,
                backgroundColor: theme.palette.secondaryContainer,
                color: theme.palette.onSecondaryContainer,
              })}
            >
              {row.teacherInitials}
            </Avatar>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.5,
              }}
            >
              <Typography variant="bodyMd" sx={{ fontWeight: 700 }}>
                {row.teacherName}
              </Typography>
              <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
                ID: {row.teacherId}
              </Typography>
            </Box>
          </Box>
        ),
      },
      {
        field: "studentClass",
        headerName: headers.studentClass,
        flex: 1,
        minWidth: 160,
        renderCell: ({ row }) => (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {row.studentClass}
          </Typography>
        ),
      },
      {
        field: "scheduledDate",
        headerName: headers.scheduledDate,
        flex: 1,
        minWidth: 160,
        renderCell: ({ row }) => {
          const isLeaveRequest = row.dateLabel === GqlRescheduleDateLabel.LeaveRequest;
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
        renderCell: ({ row }) => (
          <StatusBadge
            category="trackingStatus"
            status={row.status}
            label={row.status === GqlLeaveRequestStatus.Rescheduled ? labels.rescheduled : labels.pendingLeave}
            icon={
              row.status === GqlLeaveRequestStatus.Rescheduled ? (
                <HistoryOutlined sx={{ fontSize: 14, color: "inherit" }} />
              ) : (
                <WarningAmberOutlined sx={{ fontSize: 14, color: "inherit" }} />
              )
            }
          />
        ),
      },
      {
        field: "actions",
        headerName: headers.action,
        width: 100,
        sortable: false,
        align: "right",
        headerAlign: "center",
        renderCell: ({ row }) => {
          if (row.status === GqlLeaveRequestStatus.Pending) {
            return (
              <Box sx={{ height: "100%", display: "flex", alignItems: "center" }}>
                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, width: "100%" }}>
                  <Tooltip title={labels.approveLeave}>
                    <IconButton
                      id={`approve-leave-${row.id}`}
                      size="small"
                      onClick={() => {
                        onApprove(row.id);
                      }}
                      sx={theme => ({
                        fontSize: "11px",
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
                      id={`reject-leave-${row.id}`}
                      size="small"
                      onClick={() => {
                        onReject(row.id);
                      }}
                      sx={theme => ({
                        fontSize: "11px",
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
                id={`view-tracking-${row.id}`}
                onClick={() => {
                  onView(row.id);
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
    <AppDataGrid<TrackingRow>
      rows={rows}
      columns={columns}
      getRowId={row => row.id}
      autoHeight
      ariaLabel="reschedule-tracking-table"
      emptyMessage={labels.noEntries}
      rowHeight={80}
      {...(isServerPagination
        ? {
            paginationMode: "server" as const,
            rowCount: totalCount,
            paginationModel: { page, pageSize },
            onPaginationModelChange: model => {
              onPageChange(model.page);
            },
            pageSizeOptions: [pageSize],
            slots: { pagination: GridPagination },
          }
        : {})}
    />
  );
}
