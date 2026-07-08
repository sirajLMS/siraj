"use client";

import { Avatar, Stack, Typography } from "@mui/material";
import type { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import { useTranslations } from "next-intl";
import { AppDataGrid, GridPagination, StatusBadge } from "@/frontend/components/ui";

export type AssignedStudentsRow = {
  readonly id: string;
  readonly studentName: string;
  readonly studentAvatarUrl: string | null;
  readonly parentName: string;
  readonly parentAvatarUrl: string | null;
  readonly className: string;
  readonly status: string;
  readonly hoursPerWeek: number;
  readonly classesRemaining: number;
  readonly classesTotal: number;
};

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
}: AssignedStudentsDataGridProps) {
  const t = useTranslations("profile.students");

  const columns: GridColDef<AssignedStudentsRow>[] = [
    {
      field: "studentName",
      headerName: t("columns.studentName"),
      flex: 1.5,
      minWidth: 260,
      renderCell: params => (
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", height: "100%" }}>
          <Avatar src={params.row.studentAvatarUrl ?? undefined} sx={{ width: 28, height: 28 }}>
            {(params.row.studentName[0] ?? "S").toUpperCase()}
          </Avatar>
          <Typography sx={{ typography: "bodyMd" }}>{params.row.studentName}</Typography>
        </Stack>
      ),
    },
    {
      field: "parentName",
      headerName: t("columns.parent"),
      flex: 1.5,
      minWidth: 260,
      renderCell: params => (
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", height: "100%" }}>
          <Avatar src={params.row.parentAvatarUrl ?? undefined} sx={{ width: 28, height: 28 }}>
            {(params.row.parentName[0] ?? "P").toUpperCase()}
          </Avatar>
          <Typography sx={{ typography: "bodyMd" }}>{params.row.parentName}</Typography>
        </Stack>
      ),
    },
    {
      field: "className",
      headerName: t("columns.class"),
      flex: 1,
      minWidth: 160,
    },
    {
      field: "status",
      headerName: t("columns.status"),
      flex: 1,
      minWidth: 130,
      renderCell: params => (
        <StatusBadge
          category="studentAccount"
          status={params.row.status.toLowerCase()}
          label={formatStatusLabel(params.row.status)}
        />
      ),
    },
    {
      field: "hoursPerWeek",
      headerName: t("columns.hoursPerWeek"),
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
      headerName: t("columns.classes"),
      flex: 1,
      minWidth: 140,
      renderCell: params => (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", height: "100%" }}>
          <Typography sx={{ typography: "labelSm", color: theme => theme.palette.text.secondary }}>
            {params.row.classesRemaining} / {params.row.classesTotal}
          </Typography>
        </Stack>
      ),
    },
  ];

  return (
    <AppDataGrid
      rows={rows}
      columns={columns}
      loading={loading}
      emptyMessage={t("noRows")}
      paginationModel={{ page, pageSize }}
      onPaginationModelChange={onPaginationModelChange}
      pageSizeOptions={[5, 10, 25]}
      slots={{ pagination: GridPagination }}
      sx={{ border: "none" }}
    />
  );
}
