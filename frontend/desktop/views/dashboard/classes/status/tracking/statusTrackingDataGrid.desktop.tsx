"use client";

import type { GridColDef } from "@mui/x-data-grid";
import { useCallback, useMemo } from "react";
import { MeetingJoinAction } from "@/frontend/common/components/ui/display/meetingConfig/MeetingJoinAction";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { classHref, profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import {
  STATUS_ROW_SX,
  statusRowClassName,
} from "@/frontend/common/views/dashboard/classes/status/tracking/components/__shared__/statusTrackingGridShared";
import { STATUS_LABEL_KEYS } from "@/frontend/common/views/dashboard/classes/status/tracking/constants/statusLabelKeys.constants";
import { StatusAction } from "@/frontend/common/views/dashboard/classes/status/tracking/StatusBadgeAction";
import {
  computeSessionStatus,
  formatScheduleRange,
  type StatusTrackingDataGridProps,
  type StatusTrackingScheduleRow,
} from "@/frontend/common/views/dashboard/classes/status/tracking/types";
import {
  createStatusActionLabels,
  renderStatusTrackingJoinCell,
} from "@/frontend/common/views/dashboard/classes/status/tracking/utils/statusTrackingGridShared";
import { getStatusIcon } from "@/frontend/common/views/dashboard/classes/status/tracking/utils/statusTrackingIcons.utils";
import { DesktopAppDataGrid, DesktopStatusBadge } from "@/frontend/desktop/components/ui";
import { DesktopClassProfileLinkCell } from "@/frontend/desktop/components/ui/display/classProfileLink/ClassProfileLinkCell.desktop";
import {
  DesktopPersonProfileLinkCell,
  type DesktopPersonProfileLinkCellProps,
} from "@/frontend/desktop/components/ui/display/personProfileLink/PersonProfileLinkCell.desktop";

export function StatusTrackingDataGridDesktop({
  rows,
  labels,
  onActivate,
  onReschedule,
  onVerify,
  loading = false,
}: StatusTrackingDataGridProps) {
  const locale = useAppLocale();

  // Helper to render a profile link cell with common props, reducing duplication across columns
  const renderProfileCell = useCallback(
    (props: DesktopPersonProfileLinkCellProps) => (
      <DesktopPersonProfileLinkCell {...props} typographyVariant="bodyMd" />
    ),
    []
  );

  // RENDER OPT JUSTIFICATION: cache `useMemo` to maintain stable column array identity for the MUI AppDataGrid consumer (prevents column re-allocation across renders when labels/locale props are unchanged)
  const columns = useMemo<GridColDef<StatusTrackingScheduleRow>[]>(() => {
    const actionLabels = createStatusActionLabels(labels);

    return [
      {
        field: "courseName",
        headerName: labels.class,
        flex: 1.2,
        minWidth: 180,
        renderCell: ({ row }) => (
          <DesktopClassProfileLinkCell
            href={row.id ? classHref(row.id) : undefined}
            name={row.courseName?.trim() ?? "—"}
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
        renderCell: ({ row }) =>
          renderProfileCell({
            href: row.studentId ? studentHref(row.studentId) : undefined,
            name: row.studentName ?? "",
            avatarUrl: row.studentAvatarUrl,
            avatarSize: 40,
            fontWeight: 700,
          }),
      },
      {
        field: "teacherName",
        headerName: labels.teacher,
        flex: 1,
        minWidth: 140,
        renderCell: ({ row }) =>
          renderProfileCell({
            href: profileHrefForTeacher({ teacherId: row.teacherId }),
            name: row.teacherName ?? "",
            avatarUrl: row.teacherAvatarUrl,
            avatarSize: 32,
            fontWeight: 600,
          }),
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
            <DesktopStatusBadge
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
        renderCell: ({ row }) => renderStatusTrackingJoinCell(row, labels, MeetingJoinAction),
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
  }, [labels, locale, onActivate, onReschedule, onVerify, renderProfileCell]);

  return (
    <DesktopAppDataGrid<StatusTrackingScheduleRow>
      rows={rows}
      columns={columns}
      loading={loading}
      getRowId={row => row.id ?? ""}
      autoHeight
      rowHeight={100}
      ariaLabel="status-tracking-table"
      emptyMessage={labels.noEntries}
      paginationOptions={{ mode: "client" }}
      getRowClassName={({ row }) => statusRowClassName(row)}
      sx={STATUS_ROW_SX}
    />
  );
}
