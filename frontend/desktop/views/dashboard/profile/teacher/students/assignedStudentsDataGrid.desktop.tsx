"use client";

import { Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { profileHrefForParent, studentHref } from "@/frontend/common/utils/profileHref";
import type { AssignedStudentsRow } from "@/frontend/common/views/dashboard/profile/teacher/students/assignedStudentsRowTypes";
import { formatStatusLabel } from "@/frontend/common/views/dashboard/profile/teacher/students/assignedStudentsStatusFormatters";
import type { AssignedStudentsListLabels } from "@/frontend/common/views/dashboard/profile/teacher/students/types/assignedStudentsList.types";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui/dataGrid/DesktopAppDataGrid";
import { DesktopPersonProfileLinkCell } from "@/frontend/desktop/components/ui/display";

type AssignedStudentsDataGridProps = {
  readonly rows: readonly AssignedStudentsRow[];
  readonly labels: AssignedStudentsListLabels;
  readonly loading: boolean;
  readonly paginationOptions: ListPaginationOptions;
};

export function AssignedStudentsDataGrid({
  rows,
  labels,
  loading,
  paginationOptions,
}: Readonly<AssignedStudentsDataGridProps>) {
  const { columns } = labels;

  const gridColumns: GridColDef<AssignedStudentsRow>[] = [
    {
      field: "studentName",
      headerName: columns.studentName,
      flex: 1.5,
      minWidth: 260,
      renderCell: params => (
        <DesktopPersonProfileLinkCell
          href={params.row.id ? studentHref(params.row.id) : undefined}
          avatarUrl={params.row.studentAvatarUrl}
          name={params.row.studentName}
          fallbackInitial="S"
        />
      ),
    },
    {
      field: "parentName",
      headerName: columns.parent,
      flex: 1.5,
      minWidth: 260,
      renderCell: params => (
        <DesktopPersonProfileLinkCell
          href={profileHrefForParent({
            userId: params.row.parentUserId,
            parentId: params.row.parentId,
          })}
          avatarUrl={params.row.parentAvatarUrl}
          name={params.row.parentName}
          fallbackInitial="P"
        />
      ),
    },
    {
      field: "className",
      headerName: columns.class,
      flex: 1,
      minWidth: 160,
    },
    {
      field: "status",
      headerName: columns.status,
      flex: 1,
      minWidth: 130,
      renderCell: params => (
        <DesktopStatusBadge
          category="studentAccount"
          status={params.row.status.toLowerCase()}
          label={formatStatusLabel(params.row.status)}
        />
      ),
    },
    {
      field: "hoursPerWeek",
      headerName: columns.hoursPerWeek,
      flex: 1,
      minWidth: 160,
      renderCell: params => (
        <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
          {params.row.hoursPerWeek}
        </Typography>
      ),
    },
    {
      field: "classesRemaining",
      headerName: columns.classes,
      flex: 1,
      minWidth: 140,
      renderCell: params => (
        <Typography sx={{ typography: "labelSm", color: theme => theme.palette.text.secondary }}>
          {params.row.classesRemaining} / {params.row.classesTotal}
        </Typography>
      ),
    },
  ];

  return (
    <DesktopAppDataGrid
      rows={rows}
      columns={gridColumns}
      loading={loading}
      emptyMessage={labels.emptyMessage}
      paginationOptions={paginationOptions}
      sx={{ border: "none" }}
    />
  );
}
