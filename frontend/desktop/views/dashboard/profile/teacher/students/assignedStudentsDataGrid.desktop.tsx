"use client";

import { Typography } from "@mui/material";
import type { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import { profileHrefForParent, studentHref } from "@/frontend/common/utils/profileHref";
import type { AssignedStudentsRow } from "@/frontend/common/views/dashboard/profile/teacher/students/assignedStudentsRowTypes";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import { DesktopAppDataGrid } from "@/frontend/desktop/components/ui/dataGrid";
import { DesktopPersonProfileLinkCell } from "@/frontend/desktop/components/ui/display";
import { DesktopGridPagination } from "@/frontend/desktop/components/ui/filter";
import { useAppTranslation } from "@/shared/locale";

type AssignedStudentsDataGridProps = {
  readonly rows: readonly AssignedStudentsRow[];
  readonly loading: boolean;
  readonly page: number;
  readonly pageSize: number;
  readonly onPaginationModelChange: (model: GridPaginationModel) => void;
};

function formatStatusLabel(status: string): string {
  const normalized = status.replaceAll("_", " ").toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function AssignedStudentsDataGrid({
  rows,
  loading,
  page,
  pageSize,
  onPaginationModelChange,
}: Readonly<AssignedStudentsDataGridProps>) {
  const t = useAppTranslation().profileTranslations.base.students;

  const columns: GridColDef<AssignedStudentsRow>[] = [
    {
      field: "studentName",
      headerName: t.columns.studentName,
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
      headerName: t.columns.parent,
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
      headerName: t.columns.class,
      flex: 1,
      minWidth: 160,
    },
    {
      field: "status",
      headerName: t.columns.status,
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
      headerName: t.columns.hoursPerWeek,
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
      headerName: t.columns.classes,
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
      columns={columns}
      loading={loading}
      emptyMessage={t.noRows}
      paginationModel={{ page, pageSize }}
      onPaginationModelChange={onPaginationModelChange}
      pageSizeOptions={[5, 10, 25]}
      slots={{ pagination: DesktopGridPagination }}
      sx={{ border: "none" }}
    />
  );
}
