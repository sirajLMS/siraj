"use client";

import { HistoryOutlined, VideocamOffOutlined, VideocamOutlined } from "@mui/icons-material";
import { alpha, Box, IconButton, Tooltip, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { AppDataGrid, GridPagination, PersonProfileLinkCell, StatusBadge } from "@/frontend/components/ui";
import { profileHrefForTeacher, studentHref } from "@/frontend/utils/profileHref";
import type { SchedulePagination } from "../ParentDashboardView";
import type { ParentDashboardLabels } from "../types/parentDashboardLabels";
import type { ParentBookingStatus, ParentScheduleRow } from "../types/parentDashboardTypes";
import { ParentClassStatusIndicator } from "./ParentClassStatusIndicator";

interface ParentScheduleDataGridProps {
  readonly rows: readonly ParentScheduleRow[];
  readonly labels: ParentDashboardLabels;
  readonly onHistory: (id: string) => void;
  readonly onJoinVideo: (id: string) => void;
  readonly pagination?: SchedulePagination;
}

function resolveBookingBadge(status: ParentBookingStatus): { category: "session" | "trackingStatus"; status: string } {
  if (status === "rescheduled") {
    return { category: "trackingStatus", status: "rescheduled" };
  }
  return { category: "session", status: "confirmed" };
}

function formatDuration(template: string, minutes: number): string {
  return template.replace("{minutes}", String(minutes));
}

function formatRowNumber(value: number): string {
  return String(value).padStart(2, "0");
}

export function ParentScheduleDataGrid({
  rows,
  labels,
  onHistory,
  onJoinVideo,
  pagination,
}: Readonly<ParentScheduleDataGridProps>) {
  const columns = useMemo<GridColDef<ParentScheduleRow>[]>(() => {
    return [
      {
        field: "rowNumber",
        headerName: labels.schedule.rowNumber,
        width: 70,
        renderCell: ({ row }) => (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant, alignSelf: "center" })}>
            {formatRowNumber(row.rowNumber)}
          </Typography>
        ),
      },
      {
        field: "classTime",
        headerName: labels.schedule.classTime,
        flex: 1,
        minWidth: 140,
        renderCell: ({ row }) => (
          <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
            <Typography variant="bodyMd" sx={{ fontWeight: 700, color: theme => theme.palette.primary.main }}>
              {row.classTime}
            </Typography>
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {formatDuration(labels.schedule.duration, row.durationMinutes)}
            </Typography>
          </Box>
        ),
      },
      {
        field: "studentName",
        headerName: labels.schedule.studentName,
        flex: 1.2,
        minWidth: 180,
        renderCell: ({ row }) => (
          <PersonProfileLinkCell
            href={row.studentId ? studentHref(row.studentId) : undefined}
            name={row.studentName}
            avatarUrl={row.studentAvatarUrl}
            showAvatar
            avatarSize={32}
            fallbackInitial={row.studentInitials?.[0] ?? "?"}
            typographyVariant="bodyMd"
            fontWeight={600}
          />
        ),
      },
      {
        field: "teacherName",
        headerName: labels.schedule.teacherName,
        flex: 1.2,
        minWidth: 180,
        renderCell: ({ row }) => (
          <PersonProfileLinkCell
            href={row.teacherId ? profileHrefForTeacher({ teacherId: row.teacherId }) : undefined}
            name={row.teacherName}
            avatarUrl={row.teacherAvatarUrl}
            avatarSize={32}
            typographyVariant="bodyMd"
            fontWeight={400}
            emphasizeLink={Boolean(row.teacherId)}
          />
        ),
      },
      {
        field: "history",
        headerName: labels.schedule.history,
        width: 90,
        sortable: false,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => (
          <Box sx={{ display: "flex", justifyContent: "center", width: "100%", height: "100%", alignItems: "center" }}>
            <Tooltip title={labels.schedule.history}>
              <IconButton
                size="small"
                onClick={() => {
                  onHistory(row.id);
                }}
                sx={theme => ({ color: theme.palette.header })}
              >
                <HistoryOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
      {
        field: "bookingStatus",
        headerName: labels.schedule.status,
        width: 140,
        renderCell: ({ row }) => {
          const badge = resolveBookingBadge(row.bookingStatus);
          return (
            <StatusBadge
              category={badge.category}
              status={badge.status}
              label={labels.bookingStatus[row.bookingStatus]}
            />
          );
        },
      },
      {
        field: "contact",
        headerName: labels.schedule.contact,
        width: 100,
        sortable: false,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => {
          const VideoIcon = row.videoEnabled ? VideocamOutlined : VideocamOffOutlined;
          return (
            <Box
              sx={{ display: "flex", justifyContent: "center", width: "100%", height: "100%", alignItems: "center" }}
            >
              <IconButton
                size="small"
                disabled={!row.videoEnabled}
                onClick={() => {
                  onJoinVideo(row.id);
                }}
                aria-label={labels.schedule.joinVideo}
                sx={theme => ({
                  color: theme.palette.info.main,
                  opacity: row.videoEnabled ? 1 : 0.5,
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.info.main, 0.08),
                  },
                })}
              >
                <VideoIcon fontSize="small" />
              </IconButton>
            </Box>
          );
        },
      },
      {
        field: "liveClassStatus",
        headerName: labels.schedule.classStatus,
        flex: 1,
        minWidth: 160,
        renderCell: ({ row }) => (
          <ParentClassStatusIndicator
            status={row.liveClassStatus}
            label={labels.liveClassStatus[row.liveClassStatus]}
          />
        ),
      },
    ];
  }, [labels, onHistory, onJoinVideo]);

  const isServerPagination = pagination !== undefined;

  return (
    <AppDataGrid<ParentScheduleRow>
      rows={rows}
      columns={columns}
      getRowId={row => row.id}
      autoHeight
      rowHeight={72}
      ariaLabel="parent-schedule-table"
      emptyMessage={labels.schedule.noEntries}
      {...(isServerPagination
        ? {
            paginationMode: "server" as const,
            rowCount: pagination.totalCount,
            paginationModel: { page: pagination.page, pageSize: pagination.pageSize },
            onPaginationModelChange: model => {
              pagination.onPageChange(model.page);
            },
            pageSizeOptions: [pagination.pageSize],
            slots: { pagination: GridPagination },
          }
        : { hideFooter: rows.length <= 10 })}
    />
  );
}
