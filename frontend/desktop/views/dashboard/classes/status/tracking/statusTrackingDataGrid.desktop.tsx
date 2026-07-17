"use client";

import { BlockOutlined, VideocamOffOutlined, WarningAmberOutlined } from "@mui/icons-material";
import { Box, Tooltip } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { DesktopPersonProfileLink, DesktopPersonProfileLinkCell } from "@/frontend/desktop/components/ui/display";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid/AppDataGrid";
import { MeetingJoinAction } from "@/frontend/common/components/ui/display/meetingConfig/MeetingJoinAction";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import { StatusAction } from "@/frontend/common/views/dashboard/classes/status/tracking/StatusBadgeAction";
import {
  computeSessionStatus,
  formatScheduleRange,
  SessionStatus,
  type StatusTrackingDataGridProps,
  type StatusTrackingRow,
} from "@/frontend/common/views/dashboard/classes/status/tracking/types";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";

const STATUS_LABEL_KEYS: Record<SessionStatus, "regular" | "suspendedPending" | "onLeave" | "pendingVerification"> = {
  [SessionStatus.REGULAR]: "regular",
  [SessionStatus.SUSPENDED_PENDING]: "suspendedPending",
  [SessionStatus.ON_LEAVE]: "onLeave",
  [SessionStatus.PENDING_VERIFICATION]: "pendingVerification",
};

function getStatusIcon(sessionStatus: SessionStatus) {
  if (sessionStatus === SessionStatus.SUSPENDED_PENDING) {
    return <BlockOutlined sx={{ fontSize: 12 }} />;
  }
  if (sessionStatus === SessionStatus.PENDING_VERIFICATION) {
    return <WarningAmberOutlined sx={{ fontSize: 12 }} />;
  }
  return undefined;
}

export function StatusTrackingDataGridDesktop({
  rows,
  labels,
  onActivate,
  onReschedule,
  onVerify,
  loading = false,
}: StatusTrackingDataGridProps) {
  const locale = useAppLocale();
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
        field: "studentName",
        headerName: labels.studentClass,
        flex: 1.3,
        minWidth: 220,
        renderCell: ({ row }) => {
          const studentProfileHref = row.studentId ? studentHref(row.studentId) : undefined;
          const teacherProfileHref = profileHrefForTeacher({ teacherId: row.teacherId });
          return (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, justifyContent: "center", height: "100%" }}>
              <DesktopPersonProfileLinkCell
                href={studentProfileHref}
                name={row.studentName ?? ""}
                avatarUrl={row.studentAvatarUrl}
                avatarSize={40}
                typographyVariant="bodyMd"
                fontWeight={700}
              />
              <DesktopPersonProfileLink
                href={teacherProfileHref}
                name={row.teacherName ?? ""}
                avatarUrl={row.teacherAvatarUrl}
                showAvatar={false}
                typographyVariant="labelMd"
                fontWeight={600}
                emphasizeLink={Boolean(teacherProfileHref)}
              />
            </Box>
          );
        },
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
