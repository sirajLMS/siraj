"use client";

import { Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { studentHref } from "@/frontend/common/utils/profileHref";
import { ClassesLeftProgress } from "@/frontend/common/views/dashboard/admin/parents/students/components/ClassesLeftProgress";
import type {
  StudentDirectoryDataGridLabels,
  StudentDirectoryRowExtended,
} from "@/frontend/common/views/dashboard/admin/parents/students/types";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import {
  buildDirectoryEmailColumn,
  buildDirectoryIndexColumn,
  buildDirectoryNameColumn,
} from "@/frontend/desktop/views/dashboard/admin/parents/home/components/directoryDataGridShared";
import { StudentRowActions } from "@/frontend/desktop/views/dashboard/admin/parents/students/components/studentDirectoryDataGrid.parts";

function formatHours(hours: number): string {
  return `${hours.toFixed(1)} hrs`;
}

export function buildStudentDirectoryColumns({
  labels,
  onViewProfile,
  onViewHistory,
}: Readonly<{
  labels: StudentDirectoryDataGridLabels;
  onViewProfile: (id: string) => void;
  onViewHistory: (id: string) => void;
}>): GridColDef<StudentDirectoryRowExtended>[] {
  return [
    buildDirectoryIndexColumn<StudentDirectoryRowExtended>(labels.index, index => String(index).padStart(2, "0")),
    buildDirectoryNameColumn<StudentDirectoryRowExtended>(labels.student, row =>
      row.id ? studentHref(row.id) : undefined
    ),
    buildDirectoryEmailColumn<StudentDirectoryRowExtended>(labels.email),
    {
      field: "accountStatus",
      headerName: labels.status,
      width: 140,
      renderCell: ({ row }) => (
        <DesktopStatusBadge
          category="studentAccount"
          status={row.accountStatus}
          label={labels.statusLabels[row.accountStatus]}
        />
      ),
    },
    {
      field: "hoursPerWeek",
      headerName: labels.hoursPerWeek,
      width: 120,
      renderCell: ({ row }) => (
        <Typography variant="bodyMd" sx={theme => ({ fontWeight: 500, color: theme.palette.primary.main })}>
          {formatHours(row.hoursPerWeek ?? 0)}
        </Typography>
      ),
    },
    {
      field: "classesRemaining",
      headerName: labels.classesLeft,
      width: 160,
      sortable: false,
      renderCell: ({ row }) => (
        <ClassesLeftProgress
          remaining={row.classesRemaining ?? 0}
          total={row.classesTotal ?? 0}
          accountStatus={row.accountStatus}
        />
      ),
    },
    {
      field: "actions",
      headerName: labels.actions,
      width: 110,
      sortable: false,
      align: "right",
      headerAlign: "right",
      renderCell: ({ row }) => (
        <StudentRowActions row={row} labels={labels} onViewProfile={onViewProfile} onViewHistory={onViewHistory} />
      ),
    },
  ];
}
