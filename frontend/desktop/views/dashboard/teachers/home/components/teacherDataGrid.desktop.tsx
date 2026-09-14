"use client";

import { CalendarMonthOutlined, SettingsOutlined } from "@mui/icons-material";
import { Box, Tooltip, Typography } from "@mui/material";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import type { ReactNode } from "react";
import { ViewAsUserButton } from "@/frontend/common/components/auth/ViewAsUserButton";
import { ActionIconLink } from "@/frontend/common/components/ui";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type { TeacherDirectoryQuery_teacherDirectory_rows as TeacherDirectoryRow } from "@/frontend/common/graphql/generated/gql/graphql";
import { profileHrefForTeacher } from "@/frontend/common/utils/profileHref";
import { DesktopAppDataGrid, DesktopPersonProfileLinkCell } from "@/frontend/desktop/components/ui";
import type { TeachersDirectoryLabels } from "@/shared/locale/types/dashboard/teachers/directory";

interface TeacherDataGridProps {
  readonly rows: readonly TeacherDirectoryRow[];
  readonly labels: TeachersDirectoryLabels;
  readonly loading?: boolean;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
}

function isStringValue(value: unknown): value is string {
  return typeof value === "string";
}

function renderScheduleCell(params: GridRenderCellParams<TeacherDirectoryRow>, viewScheduleLabel: string): ReactNode {
  if (!params.row.id) {
    return null;
  }
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
      <Tooltip title={viewScheduleLabel}>
        <ActionIconLink href={`/teachers/${params.row.id}/schedule/weekly`} aria-label={viewScheduleLabel}>
          <CalendarMonthOutlined fontSize="small" />
        </ActionIconLink>
      </Tooltip>
    </Box>
  );
}

function renderOptionsCell(params: GridRenderCellParams<TeacherDirectoryRow>, optionsLabel: string): ReactNode {
  const profileHref = profileHrefForTeacher({ userId: params.row.userId, teacherId: params.row.id });
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, width: "100%" }}>
      {params.row.userId ? (
        <ViewAsUserButton
          variant="link"
          targetUserId={params.row.userId}
          targetUserName={params.row.name ?? params.row.email ?? ""}
        />
      ) : null}
      {profileHref ? (
        <Tooltip title={optionsLabel}>
          <ActionIconLink href={profileHref} aria-label={optionsLabel}>
            <SettingsOutlined fontSize="small" />
          </ActionIconLink>
        </Tooltip>
      ) : null}
    </Box>
  );
}

export function TeacherDataGrid({
  rows,
  labels,
  loading,
  page = 0,
  pageSize = 10,
  totalCount,
  onPageChange,
}: Readonly<TeacherDataGridProps>) {
  const t = labels;

  const columns: GridColDef<TeacherDirectoryRow>[] = [
    {
      field: "index",
      headerName: t.table.hash,
      width: 72,
      sortable: false,
      renderCell: (params: GridRenderCellParams<TeacherDirectoryRow>) => {
        const relativeIndex = params.api.getRowIndexRelativeToVisibleRows(params.id);
        const displayIndex = relativeIndex >= 0 ? page * pageSize + relativeIndex + 1 : "—";
        return (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {displayIndex}
          </Typography>
        );
      },
    },
    {
      field: "name",
      headerName: t.table.name,
      flex: 1.5,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams<TeacherDirectoryRow>) => (
        <DesktopPersonProfileLinkCell
          href={profileHrefForTeacher({ userId: params.row.userId, teacherId: params.row.id })}
          name={isStringValue(params.value) ? params.value : ""}
          avatarUrl={params.row.avatarUrl}
          avatarSize={40}
          typographyVariant="bodyLg"
          fontWeight={700}
        />
      ),
    },
    {
      field: "email",
      headerName: t.table.email,
      flex: 1.5,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams<TeacherDirectoryRow>) => (
        <Typography
          variant="bodyMd"
          sx={theme => ({
            color: theme.palette.text.secondary,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          })}
        >
          {isStringValue(params.value) ? params.value : ""}
        </Typography>
      ),
    },
    {
      field: "schedule",
      headerName: t.table.schedule,
      width: 120,
      align: "center",
      headerAlign: "center",
      sortable: false,
      renderCell: (params: GridRenderCellParams<TeacherDirectoryRow>) =>
        renderScheduleCell(params, t.actions.viewSchedule),
    },
    {
      field: "options",
      headerName: t.table.options,
      width: 180,
      align: "center",
      headerAlign: "center",
      sortable: false,
      renderCell: (params: GridRenderCellParams<TeacherDirectoryRow>) => renderOptionsCell(params, t.actions.options),
    },
  ];

  const isServerPagination = totalCount !== undefined && onPageChange !== undefined;

  return (
    <DesktopAppDataGrid<TeacherDirectoryRow>
      rows={rows}
      columns={columns}
      rowHeight={72}
      loading={loading}
      emptyMessage={t.emptyMessage}
      disableRowSelectionOnClick
      getRowId={row => row.id ?? ""}
      paginationOptions={
        isServerPagination
          ? buildServerPaginationOptions({
              page,
              pageSize,
              totalCount,
              onPageChange,
              pageSizeOptions: [pageSize],
            })
          : { mode: "client" }
      }
    />
  );
}
