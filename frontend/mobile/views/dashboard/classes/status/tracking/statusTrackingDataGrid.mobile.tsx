"use client";

import { VideocamOffOutlined } from "@mui/icons-material";
import { Box, Tooltip } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
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
import { MobileStatusBadge } from "@/frontend/mobile/components/ui/badge";
import { MobileAppDataGrid } from "@/frontend/mobile/components/ui/dataGrid/MobileAppDataGrid";
import { MobileClassProfileLinkCell } from "@/frontend/mobile/components/ui/display/classProfileLink/ClassProfileLinkCell.mobile";
import { MobileMeetingJoinAction } from "@/frontend/mobile/components/ui/display/meetingConfig";
import { MobilePersonProfileLinkCell } from "@/frontend/mobile/components/ui/display/personProfileLink/PersonProfileLinkCell.mobile";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";
import { useAppLocale } from "@/shared/locale";

// Helper to render profile link cells with consistent styling
function renderProfileLinkCell({
  type,
  name,
  href,
  avatarUrl,
  avatarSize = 40,
  typographyVariant = "bodyMd",
  fontWeight = 700,
}: {
  type: "class" | "teacher" | "student";
  name: string;
  href?: string;
  avatarUrl?: string | null;
  avatarSize?: number;
  typographyVariant?: string;
  fontWeight?: number;
}) {
  if (type === "class") {
    return (
      <MobileClassProfileLinkCell
        href={href}
        name={name}
        avatarUrl={avatarUrl}
        avatarSize={avatarSize}
        typographyVariant={typographyVariant}
        fontWeight={fontWeight}
      />
    );
  }
  return (
    <MobilePersonProfileLinkCell
      href={href}
      name={name}
      avatarUrl={avatarUrl}
      avatarSize={avatarSize}
      typographyVariant={typographyVariant}
      fontWeight={fontWeight}
    />
  );
}

// Column definition helpers
function createCourseColumn(labels: StatusTrackingDataGridProps["labels"]) {
  return {
    field: "courseName",
    headerName: labels.class,
    flex: 1.2,
    minWidth: 180,
    renderCell: ({ row }: { row: StatusTrackingRow }) =>
      renderProfileLinkCell({
        type: "class",
        name: row.courseName?.trim() || "—",
        href: row.id ? classHref(row.id) : undefined,
        avatarUrl: row.avatarUrl,
        avatarSize: 40,
        typographyVariant: "bodyMd",
        fontWeight: 700,
      }),
  } satisfies GridColDef<StatusTrackingRow>;
}

function createStudentColumn(labels: StatusTrackingDataGridProps["labels"]) {
  return {
    field: "studentName",
    headerName: labels.student,
    flex: 1.1,
    minWidth: 160,
    renderCell: ({ row }: { row: StatusTrackingRow }) =>
      renderProfileLinkCell({
        type: "student",
        name: row.studentName ?? "",
        href: row.studentId ? studentHref(row.studentId) : undefined,
        avatarUrl: row.studentAvatarUrl,
        avatarSize: 40,
        typographyVariant: "bodyMd",
        fontWeight: 700,
      }),
  } satisfies GridColDef<StatusTrackingRow>;
}

function createTeacherColumn(labels: StatusTrackingDataGridProps["labels"]) {
  return {
    field: "teacherName",
    headerName: labels.teacher,
    flex: 1,
    minWidth: 140,
    renderCell: ({ row }: { row: StatusTrackingRow }) =>
      renderProfileLinkCell({
        type: "teacher",
        name: row.teacherName ?? "",
        href: profileHrefForTeacher({ teacherId: row.teacherId }),
        avatarUrl: row.teacherAvatarUrl,
        avatarSize: 32,
        typographyVariant: "bodyMd",
        fontWeight: 600,
      }),
  } satisfies GridColDef<StatusTrackingRow>;
}

function createScheduleColumn(labels: StatusTrackingDataGridProps["labels"], locale: string) {
  return {
    field: "schedule",
    headerName: labels.schedule,
    flex: 1,
    minWidth: 140,
    valueGetter: (_value: unknown, row: StatusTrackingRow) =>
      formatScheduleRange(row.scheduledStartAt, row.scheduledEndAt, locale),
  } satisfies GridColDef<StatusTrackingRow>;
}

function createStatusColumn(labels: StatusTrackingDataGridProps["labels"]) {
  return {
    field: "status",
    headerName: labels.status,
    width: 180,
    renderCell: ({ row }: { row: StatusTrackingRow }) => {
      const status = computeSessionStatus(row.studentStatus, row.isFrozen, row.executionState);
      return (
        <MobileStatusBadge
          category="sessionTracking"
          status={status}
          label={labels[STATUS_LABEL_KEYS[status]]}
          icon={getStatusIcon(status)}
        />
      );
    },
  } satisfies GridColDef<StatusTrackingRow>;
}

function createJoinColumn(labels: StatusTrackingDataGridProps["labels"]) {
  return {
    field: "join",
    headerName: "",
    width: 56,
    sortable: false,
    align: "center",
    headerAlign: "center",
    renderCell: ({ row }: { row: StatusTrackingRow }) => {
      const sessionStatus = computeSessionStatus(row.studentStatus, row.isFrozen, row.executionState);
      if (sessionStatus !== SessionStatus.REGULAR) return null;
      if (isJoinableClassInstance(row.executionState, row.outcome, { isFrozen: row.isFrozen ?? false })) {
        return (
          <Box sx={{ display: "flex", justifyContent: "center", width: "100%", height: "100%", alignItems: "center" }}>
            <MobileMeetingJoinAction
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
          <Box sx={{ display: "flex", justifyContent: "center", width: "100%", height: "100%", alignItems: "center" }}>
            <VideocamOffOutlined sx={theme => ({ fontSize: 20, color: theme.palette.text.disabled })} />
          </Box>
        </Tooltip>
      );
    },
  } satisfies GridColDef<StatusTrackingRow>;
}

function createActionsColumn(
  labels: StatusTrackingDataGridProps["labels"],
  actionLabels: ReturnType<typeof createActionLabels>,
  onActivate: StatusTrackingDataGridProps["onActivate"],
  onReschedule: StatusTrackingDataGridProps["onReschedule"],
  onVerify: StatusTrackingDataGridProps["onVerify"]
) {
  return {
    field: "actions",
    headerName: labels.actions,
    width: 80,
    flex: 0,
    sortable: false,
    align: "right",
    headerAlign: "center",
    renderCell: ({ row }: { row: StatusTrackingRow }) => (
      <StatusAction
        row={row}
        labels={actionLabels}
        onActivate={onActivate}
        onReschedule={onReschedule}
        onVerify={onVerify}
      />
    ),
  } satisfies GridColDef<StatusTrackingRow>;
}

function createActionLabels(labels: StatusTrackingDataGridProps["labels"]) {
  return {
    joinSession: labels.joinSession,
    activate: labels.activate,
    reschedule: labels.reschedule,
    verifyDocuments: labels.verifyDocuments,
    administrativeHold: labels.administrativeHold,
    holdDescription: labels.holdDescription,
  };
}

export function StatusTrackingDataGridMobile({
  rows,
  labels,
  onActivate,
  onReschedule,
  onVerify,
  loading = false,
}: StatusTrackingDataGridProps) {
  const locale = useAppLocale();

  // RENDER OPT JUSTIFICATION: cache `useMemo` to maintain stable column array identity for the MUI MobileAppDataGrid consumer (prevents column re-allocation across renders when labels/locale props are unchanged)
  const columns = useMemo<GridColDef<StatusTrackingRow>[]>(() => {
    const actionLabels = createActionLabels(labels);

    return [
      createCourseColumn(labels),
      createStudentColumn(labels),
      createTeacherColumn(labels),
      createScheduleColumn(labels, locale),
      createStatusColumn(labels),
      createJoinColumn(labels),
      createActionsColumn(labels, actionLabels, onActivate, onReschedule, onVerify),
    ];
  }, [labels, locale, onActivate, onReschedule, onVerify]);

  return (
    <MobileAppDataGrid<StatusTrackingRow>
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
      paginationOptions={{ mode: "client" }}
    />
  );
}
