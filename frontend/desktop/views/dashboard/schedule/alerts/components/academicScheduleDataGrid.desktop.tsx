"use client";

import { Box } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { MeetingJoinAction } from "@/frontend/common/components/ui/display/meetingConfig/MeetingJoinAction";
import { classHref, profileHrefForTeacher } from "@/frontend/common/utils/profileHref";
import type { AcademicClassRow, ClassSessionStatus } from "@/frontend/common/views/dashboard/schedule/alerts/types";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import {
  DesktopAppDataGrid,
  DesktopClassProfileLinkCell,
  DesktopPersonProfileLinkCell,
} from "@/frontend/desktop/components/ui";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import { ClassSessionActionButtonDesktop } from "@/frontend/desktop/views/dashboard/schedule/alerts/components/classSessionActionButton.desktop";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";

function shouldShowScheduleAlertJoin(row: AcademicClassRow): boolean {
  if (row.sessionStatus !== "upcoming" && row.sessionStatus !== "active") {
    return false;
  }
  return isJoinableClassInstance(row.executionState, row.outcome, { isFrozen: row.isFrozen ?? false });
}

export interface AcademicScheduleDataGridDesktopLabels {
  readonly className: string;
  readonly instructor: string;
  readonly time: string;
  readonly room: string;
  readonly status: string;
  readonly joinSession: string;
  readonly leaveClass: string;
  readonly leaveDisabledReason: string;
  readonly viewClassAudit: string;
  readonly contactAdmin: string;
  readonly active: string;
  readonly upcoming: string;
  readonly missed: string;
  readonly hold: string;
  readonly noEntries: string;
}

interface AcademicScheduleDataGridDesktopProps {
  readonly rows: readonly AcademicClassRow[];
  readonly labels: AcademicScheduleDataGridDesktopLabels;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalClasses?: number;
  readonly onLeave: (id: string) => void;
  readonly onViewClassAudit: (id: string) => void;
  readonly onPageChange?: (page: number) => void;
  readonly loading?: boolean;
}

const SESSION_STATUS_LABELS: Record<ClassSessionStatus, keyof AcademicScheduleDataGridDesktopLabels> = {
  active: "active",
  upcoming: "upcoming",
  missed: "missed",
  hold: "hold",
};

export function AcademicScheduleDataGridDesktop({
  rows,
  page = 0,
  pageSize = 10,
  totalClasses,
  labels,
  onLeave,
  onViewClassAudit,
  onPageChange,
  loading = false,
}: AcademicScheduleDataGridDesktopProps) {
  const columns = useMemo<GridColDef<AcademicClassRow>[]>(() => {
    const actionLabels = {
      joinSession: labels.joinSession,
      leaveClass: labels.leaveClass,
      leaveDisabledReason: labels.leaveDisabledReason,
      viewClassAudit: labels.viewClassAudit,
      contactAdmin: labels.contactAdmin,
    };

    return [
      {
        field: "className",
        headerName: labels.className,
        flex: 1.2,
        minWidth: 200,
        renderCell: ({ row }) => (
          <DesktopClassProfileLinkCell
            href={classHref(row.id)}
            name={row.className}
            avatarSize={40}
            typographyVariant="bodyMd"
            fontWeight={700}
          />
        ),
      },
      {
        field: "instructor",
        headerName: labels.instructor,
        flex: 1,
        minWidth: 140,
        renderCell: ({ row }) => (
          <DesktopPersonProfileLinkCell
            href={profileHrefForTeacher({ teacherId: row.instructorId })}
            name={row.instructor}
            avatarSize={32}
            typographyVariant="bodyMd"
            fontWeight={400}
          />
        ),
      },
      {
        field: "time",
        headerName: labels.time,
        flex: 1,
        minWidth: 160,
      },
      {
        field: "room",
        headerName: labels.room,
        width: 130,
      },
      {
        field: "sessionStatus",
        headerName: labels.status,
        width: 280,
        sortable: false,
        align: "right",
        headerAlign: "right",
        renderCell: ({ row }) => (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 2,
              width: "100%",
              height: "100%",
            }}
          >
            <DesktopStatusBadge
              category="classSession"
              status={row.sessionStatus}
              label={labels[SESSION_STATUS_LABELS[row.sessionStatus]]}
            />
            {shouldShowScheduleAlertJoin(row) ? (
              <MeetingJoinAction
                variant="icon"
                joinUrl={row.meetingJoinUrl}
                meeting={row.effectiveMeeting}
                emptyRole="parent"
                label={labels.joinSession}
                id={`join-session-${row.id}`}
              />
            ) : null}
            <ClassSessionActionButtonDesktop
              action={row.action}
              classId={row.id}
              labels={actionLabels}
              onLeave={onLeave}
              onViewClassAudit={onViewClassAudit}
            />
          </Box>
        ),
      },
    ];
  }, [labels, onLeave, onViewClassAudit]);

  const isServerPagination = totalClasses !== undefined && onPageChange !== undefined;

  return (
    <DesktopAppDataGrid<AcademicClassRow>
      rows={rows}
      columns={columns}
      loading={loading}
      getRowId={row => row.id}
      autoHeight
      rowHeight={100}
      ariaLabel="academic-schedule-table"
      emptyMessage={labels.noEntries}
      paginationOptions={
        isServerPagination
          ? buildServerPaginationOptions({
              page,
              pageSize,
              totalCount: totalClasses,
              onPageChange,
              pageSizeOptions: [pageSize],
            })
          : { mode: "client" }
      }
    />
  );
}
