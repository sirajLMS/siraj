import { CalendarMonthOutlined, SettingsOutlined } from "@mui/icons-material";
import { Box, IconButton, Typography } from "@mui/material";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { ViewAsUserButton } from "@/frontend/common/components/auth/ViewAsUserButton";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type { TeacherDirectoryRow } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { profileHrefForTeacher } from "@/frontend/common/utils/profileHref";
import { DesktopAppDataGrid, DesktopPersonProfileLinkCell } from "@/frontend/desktop/components/ui";
import type { TeachersDirectoryLabels } from "@/shared/locale/types/dashboard/teachers/directory";

interface TeacherDataGridProps {
  readonly rows: readonly TeacherDirectoryRow[];
  readonly labels: TeachersDirectoryLabels;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
  readonly onNavigateToSchedule: (teacherId: string) => void;
  readonly onNavigateToProfile: (teacher: TeacherDirectoryRow) => void;
}

interface TeacherActionButtonProps {
  readonly icon: React.ReactNode;
  readonly variant: "primary" | "error";
  readonly onClick: () => void;
}

function isStringValue(value: unknown): value is string {
  return typeof value === "string";
}

function TeacherActionButton({ icon, variant, onClick }: TeacherActionButtonProps) {
  return (
    <IconButton
      onClick={onClick}
      sx={theme => ({
        backgroundColor: variant === "primary" ? theme.palette.primaryContainer : theme.palette.errorContainer,
        color: variant === "primary" ? theme.palette.onPrimaryContainer : theme.palette.onErrorContainer,
        "&:hover": {
          backgroundColor: variant === "primary" ? theme.palette.primaryContainer : theme.palette.errorContainer,
          opacity: 0.8,
        },
      })}
    >
      {icon}
    </IconButton>
  );
}

export function TeacherDataGrid({
  rows,
  labels,
  page = 0,
  pageSize = 10,
  totalCount,
  onPageChange,
  onNavigateToSchedule,
  onNavigateToProfile,
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
      renderCell: (params: GridRenderCellParams<TeacherDirectoryRow>) => (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
          <TeacherActionButton
            icon={<CalendarMonthOutlined />}
            variant="error"
            onClick={() => {
              if (params.row.id) {
                onNavigateToSchedule(params.row.id);
              }
            }}
          />
        </Box>
      ),
    },
    {
      field: "options",
      headerName: t.table.options,
      width: 180,
      align: "center",
      headerAlign: "center",
      sortable: false,
      renderCell: (params: GridRenderCellParams<TeacherDirectoryRow>) => (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, width: "100%" }}>
          {params.row.userId ? (
            <ViewAsUserButton
              variant="link"
              targetUserId={params.row.userId}
              targetUserName={params.row.name ?? params.row.email ?? ""}
            />
          ) : null}
          <TeacherActionButton
            icon={<SettingsOutlined />}
            variant="primary"
            onClick={() => onNavigateToProfile(params.row)}
          />
        </Box>
      ),
    },
  ];

  const isServerPagination = totalCount !== undefined && onPageChange !== undefined;

  return (
    <DesktopAppDataGrid<TeacherDirectoryRow>
      rows={rows}
      columns={columns}
      rowHeight={72}
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

export default TeacherDataGrid;
