"use client";

import { Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import type { ComponentProps, ComponentType } from "react";
import type { useAppLocale } from "@/frontend/common/providers/localeContext";
import { classHref, profileHrefForTeacher } from "@/frontend/common/utils/profileHref";
import type { UpcomingClassDisplay } from "@/frontend/common/views/dashboard/students/status/types";
import type { useStudentStatusLabels } from "@/frontend/common/views/dashboard/students/status/useStudentStatusLabels";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import { DesktopClassProfileLinkCell } from "@/frontend/desktop/components/ui/display/classProfileLink/ClassProfileLinkCell.desktop";
import { DesktopPersonProfileLinkCell } from "@/frontend/desktop/components/ui/display/personProfileLink/PersonProfileLinkCell.desktop";
import {
  JoinCellContent,
  ScheduleCellContent,
} from "@/frontend/desktop/views/dashboard/students/status/components/upcomingClassesTable.desktop.cells";

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

export function buildUpcomingClassesColumns({
  t,
  locale,
}: UpcomingClassesColumnsContext): GridColDef<UpcomingClassDisplay>[] {
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
      renderCell: params => <ScheduleCellContent locale={locale} row={params.row} />,
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
      renderCell: params => <JoinCellContent t={t} row={params.row} />,
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
