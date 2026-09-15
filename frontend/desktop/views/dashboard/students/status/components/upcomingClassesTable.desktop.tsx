"use client";

import { VideocamOffOutlined } from "@mui/icons-material";
import { Box, Tooltip, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import type { ComponentProps, ComponentType } from "react";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { classHref, profileHrefForTeacher } from "@/frontend/common/utils/profileHref";
import {
  formatDateTime,
  formatTime,
} from "@/frontend/common/views/dashboard/students/status/components/__shared__/upcomingClassesTableShared";
import type {
  UpcomingClassDisplay,
  UpcomingClassesTableProps,
} from "@/frontend/common/views/dashboard/students/status/types";
import { useStudentStatusLabels } from "@/frontend/common/views/dashboard/students/status/useStudentStatusLabels";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui/dataGrid/DesktopAppDataGrid";
import { DesktopClassProfileLinkCell } from "@/frontend/desktop/components/ui/display/classProfileLink/ClassProfileLinkCell.desktop";
import { DesktopMeetingJoinAction } from "@/frontend/desktop/components/ui/display/meetingConfig";
import { DesktopPersonProfileLinkCell } from "@/frontend/desktop/components/ui/display/personProfileLink/PersonProfileLinkCell.desktop";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";

type ProfileLinkCellProps = ComponentProps<typeof DesktopClassProfileLinkCell>;
type ProfileLinkCellComponent = ComponentType<ProfileLinkCellProps>;

type ProfileLinkColumnConfig = {
  readonly field: string;
  readonly headerName: string;
  readonly flex: number;
  readonly minWidth: number;
  readonly avatarSize: number;
  readonly Cell: ProfileLinkCellComponent;
  readonly href: (row: UpcomingClassDisplay) => string | null | undefined;
  readonly name: (row: UpcomingClassDisplay) => string;
  readonly avatarUrl: (row: UpcomingClassDisplay) => string | null | undefined;
};

function profileLinkColumn(config: ProfileLinkColumnConfig): GridColDef<UpcomingClassDisplay> {
  const { Cell, avatarSize, href, name, avatarUrl } = config;
  return {
    field: config.field,
    headerName: config.headerName,
    flex: config.flex,
    minWidth: config.minWidth,
    renderCell: params => (
      <Cell
        href={href(params.row)}
        name={name(params.row)}
        avatarUrl={avatarUrl(params.row)}
        avatarSize={avatarSize}
        typographyVariant="bodyMd"
        fontWeight={700}
      />
    ),
  };
}

type UpcomingClassesColumnsContext = {
  readonly t: ReturnType<typeof useStudentStatusLabels>;
  readonly locale: ReturnType<typeof useAppLocale>;
};

function buildUpcomingClassesColumns({ t, locale }: UpcomingClassesColumnsContext): GridColDef<UpcomingClassDisplay>[] {
  return [
    profileLinkColumn({
      field: "subjectName",
      headerName: t.table.subject,
      flex: 1.4,
      minWidth: 180,
      avatarSize: 40,
      Cell: DesktopClassProfileLinkCell,
      href: row => classHref(row.id),
      name: row => row.subjectName?.trim() ?? "—",
      avatarUrl: row => row.avatarUrl,
    }),
    profileLinkColumn({
      field: "instructor",
      headerName: t.table.instructor,
      flex: 1.3,
      minWidth: 180,
      avatarSize: 36,
      Cell: DesktopPersonProfileLinkCell,
      href: row => profileHrefForTeacher({ teacherId: row.teacherId }),
      name: row => row.instructor,
      avatarUrl: row => row.teacherAvatarUrl,
    }),
    {
      field: "scheduledStartAt",
      headerName: t.table.dateTime,
      flex: 1.3,
      minWidth: 180,
      renderCell: params => (
        <Box sx={{ py: 1.5 }}>
          <Typography variant="bodyMd" sx={{ fontWeight: 700 }}>
            {formatDateTime(locale, params.row.scheduledStartAt)}
          </Typography>
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {`${formatTime(locale, params.row.scheduledStartAt)} - ${formatTime(locale, params.row.scheduledEndAt)}`}
          </Typography>
        </Box>
      ),
    },
    {
      field: "durationMinutes",
      headerName: t.table.duration,
      flex: 0.7,
      minWidth: 100,
      renderCell: params => (
        <Typography variant="bodyMd">{t.table.minutesShort(params.row.durationMinutes)}</Typography>
      ),
    },
    {
      field: "isFrozen",
      headerName: t.table.holdStatus,
      flex: 0.9,
      minWidth: 130,
      renderCell: params => (
        <DesktopStatusBadge
          category="classSession"
          status={params.row.isFrozen ? "hold" : "active"}
          label={params.row.isFrozen ? t.table.frozen.toUpperCase() : t.table.active.toUpperCase()}
        />
      ),
    },
    {
      field: "join",
      headerName: t.table.join,
      width: 88,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: params =>
        isJoinableClassInstance(params.row.executionState, params.row.outcome, { isFrozen: params.row.isFrozen }) ? (
          <DesktopMeetingJoinAction
            variant="icon"
            joinUrl={params.row.meetingJoinUrl}
            meeting={params.row.effectiveMeeting}
            emptyRole="parent"
            label={t.table.joinSession}
          />
        ) : (
          <Tooltip title={t.table.sessionEnded}>
            <Box
              sx={{ display: "flex", justifyContent: "center", width: "100%", height: "100%", alignItems: "center" }}
            >
              <VideocamOffOutlined sx={theme => ({ fontSize: 20, color: theme.palette.text.disabled })} />
            </Box>
          </Tooltip>
        ),
    },
    {
      field: "executionState",
      headerName: t.table.status,
      flex: 1,
      minWidth: 140,
      renderCell: params => (
        <DesktopStatusBadge
          category="classInstance"
          status={params.row.executionState}
          label={params.row.isFrozen ? t.table.frozen.toUpperCase() : params.row.executionState}
        />
      ),
    },
  ];
}

export function UpcomingClassesTableDesktop({ classes }: Readonly<UpcomingClassesTableProps>) {
  const t = useStudentStatusLabels();
  const locale = useAppLocale();

  const columns = buildUpcomingClassesColumns({ t, locale });

  const pendingCount = classes.filter(c => c.isFrozen).length;

  return (
    <DesktopSectionPanel
      title={t.sections.upcomingClasses}
      subTitle={t.table.footerInfo}
      actions={
        pendingCount > 0 ? (
          <DesktopStatusBadge category="classSession" status="hold" label={t.table.pendingHolds(pendingCount)} />
        ) : null
      }
      contentPadding={false}
    >
      <DesktopAppDataGrid
        rows={classes}
        columns={columns}
        rowHeight={72}
        autoHeight
        paginationOptions={{ mode: "client", pageSize: 10 }}
        disableRowSelectionOnClick
        sx={theme => ({
          border: "none",
          width: "100%",
          "& .MuiDataGrid-columnHeader": {
            backgroundColor: theme.palette.background.default,
            color: theme.palette.onSurfaceVariant,
            typography: "labelSm",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          },
        })}
      />
    </DesktopSectionPanel>
  );
}
