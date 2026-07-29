"use client";

import { VideocamOffOutlined } from "@mui/icons-material";
import { Box, Tooltip } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid/AppDataGrid";
import { MeetingJoinAction } from "@/frontend/common/components/ui/display/meetingConfig/MeetingJoinAction";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { classHref, profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import { STATUS_LABEL_KEYS } from "@/frontend/common/views/dashboard/classes/status/tracking/constants/statusLabelKeys.constants";
import { StatusAction } from "@/frontend/common/views/dashboard/classes/status/tracking/StatusBadgeAction";
import {
  computeSessionStatus,
  formatScheduleRange,
  SessionStatus,
  type StatusTrackingDataGridProps,
  type StatusTrackingRow,
} from "@/frontend/common/views/dashboard/classes/status/tracking/types";
import { getStatusIcon } from "@/frontend/common/views/dashboard/classes/status/tracking/utils/statusTrackingIcons.utils";
import { DesktopClassProfileLinkCell } from "@/frontend/desktop/components/ui/display/classProfileLink/ClassProfileLinkCell.desktop";
import { DesktopPersonProfileLinkCell } from "@/frontend/desktop/components/ui/display/personProfileLink/PersonProfileLinkCell.desktop";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";

export function StatusTrackingDataGridDesktop({
  rows,
  labels,
  onActivate,
  onReschedule,
  onVerify,
  loading = false,
}: StatusTrackingDataGridProps) {
  const locale = useAppLocale();
  // RENDER OPT JUSTIFICATION: cache `useMemo` to maintain stable column array identity for the MUI AppDataGrid consumer (prevents column re-allocation across renders when labels/locale props are unchanged)
  const columns = useMemo<GridColDef<StatusTrackingRow>[]>(() => {
    const actionLabels = {
      joinSession: labels.joinSession,
      activate: labels.activate,
      reschedule: labels.reschedule,
      verifyDocuments: labels.verifyDocuments,
      administrativeHold: labels.administrativeHold,
      holdDescription: labels.holdDescription,
    };

    return [
      {
        field: "courseName",
        headerName: labels.class,
        flex: 1.2,
        minWidth: 180,
        renderCell: ({ row }) => (
          <DesktopClassProfileLinkCell
            href={row.id ? classHref(row.id) : undefined}
            name={row.courseName?.trim() || "—"}
            avatarUrl={row.avatarUrl}
            avatarSize={40}
            typographyVariant="bodyMd"
            fontWeight={700}
          />
        ),
      },
      {
        field: "studentName",
        headerName: labels.student,
        flex: 1.1,
        minWidth: 160,
        renderCell: ({ row }) => (
          <DesktopPersonProfileLinkCell
            href={row.studentId ? studentHref(row.studentId) : undefined}
            name={row.studentName ?? ""}
            avatarUrl={row.studentAvatarUrl}
            avatarSize={40}
            typographyVariant="bodyMd"
            fontWeight={700}
          />
        ),
      },
      {
        field: "teacherName",
        headerName: labels.teacher,
        flex: 1,
        minWidth: 140,
        renderCell: ({ row }) => (
          <DesktopPersonProfileLinkCell
            href={profileHrefForTeacher({ teacherId: row.teacherId })}
            name={row.teacherName ?? ""}
            avatarUrl={row.teacherAvatarUrl}
            avatarSize={32}
            typographyVariant="bodyMd"
            fontWeight={600}
          />
        ),
      },
      {
        field: "schedule",
        headerName: labels.schedule,
        flex: 1,
        minWidth: 140,
        valueGetter: (_value, row) => formatScheduleRange(row.scheduledStartAt, row.scheduledEndAt, locale),
      },
      {
        field: "status",
        headerName: labels.status,
        width: 180,
        renderCell: ({ row }) => {
          const status = computeSessionStatus(row.studentStatus, row.isFrozen, row.executionState);
          return (
            <StatusBadge
              category="sessionTracking"
              status={status}
              label={labels[STATUS_LABEL_KEYS[status]]}
              icon={getStatusIcon(status)}
            />
          );
        },
      },
      {
        field: "join",
        headerName: "",
        width: 56,
        sortable: false,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => {
          const sessionStatus = computeSessionStatus(row.studentStatus, row.isFrozen, row.executionState);
          if (sessionStatus !== SessionStatus.REGULAR) return null;
          if (isJoinableClassInstance(row.executionState, row.outcome, { isFrozen: row.isFrozen ?? false })) {
            return (
              <Box
                sx={{ display: "flex", justifyContent: "center", width: "100%", height: "100%", alignItems: "center" }}
              >
                <MeetingJoinAction
                  variant="icon"
                  joinUrl={row.meetingJoinUrl}
                  meeting={row.effectiveMeeting}
                  emptyRole="class"
                  label={labels.joinSession}
                  setupHref={`/classes/${row.id}#meeting-configs`}
                />
              </Box>
            );
          }
          return (
            <Tooltip title={labels.sessionEnded}>
              <Box
                sx={{ display: "flex", justifyContent: "center", width: "100%", height: "100%", alignItems: "center" }}
              >
                <VideocamOffOutlined sx={theme => ({ fontSize: 20, color: theme.palette.text.disabled })} />
              </Box>
            </Tooltip>
          );
        },
      },
      {
        field: "actions",
        headerName: labels.actions,
        width: 200,
        flex: 1,
        sortable: false,
        align: "right",
        headerAlign: "center",
        renderCell: ({ row }) => (
          <StatusAction
            row={row}
            labels={actionLabels}
            onActivate={onActivate}
            onReschedule={onReschedule}
            onVerify={onVerify}
          />
        ),
      },
    ];
  }, [labels, locale, onActivate, onReschedule, onVerify]);

  return (
    <AppDataGrid<StatusTrackingRow>
      rows={rows}
      columns={columns}
      loading={loading}
      getRowId={row => row.id ?? ""}
      autoHeight
      rowHeight={100}
      ariaLabel="status-tracking-table"
      emptyMessage={labels.noEntries}
      paginationOptions={{ mode: "client" }}
      getRowClassName={({ row }) =>
        computeSessionStatus(row.studentStatus, row.isFrozen, row.executionState) === SessionStatus.SUSPENDED_PENDING
          ? "status-row-suspended"
          : ""
      }
      sx={{
        "& .status-row-suspended": {
          backgroundColor: theme => alpha(theme.palette.status.blocked, 0.08),
          "&:hover": {
            backgroundColor: theme => alpha(theme.palette.status.blocked, 0.12),
          },
        },
      }}
    />
  );
}
