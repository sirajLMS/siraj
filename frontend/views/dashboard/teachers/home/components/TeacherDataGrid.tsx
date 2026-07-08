import { CalendarMonthOutlined, SettingsOutlined } from "@mui/icons-material";
import { Box, IconButton, Link, Typography } from "@mui/material";
import type { GridColDef, GridPaginationModel, GridRenderCellParams } from "@mui/x-data-grid";
import { useTranslations } from "next-intl";
import { ViewAsUserButton } from "@/frontend/components/auth/ViewAsUserButton";
import { AppDataGrid, GridPagination, PersonProfileLinkCell } from "@/frontend/components/ui";
import type { TeacherDirectoryRow } from "@/frontend/graphql/generated/gql/graphql-types";
import { isSafeUrl } from "@/frontend/lib/safeRedirect";
import { profileHrefForTeacher } from "@/frontend/utils/profileHref";
import { useRouter } from "@/shared/i18n/routing";

interface TeacherDataGridProps {
  readonly rows: readonly TeacherDirectoryRow[];
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
}

interface TeacherActionButtonProps {
  readonly icon: React.ReactNode;
  readonly variant: "primary" | "error";
  readonly onClick: () => void;
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

function getActionCellRenderer(
  icon: React.ReactNode,
  variant: "primary" | "error",
  router: ReturnType<typeof useRouter>,
  getPath: (id: string) => string
) {
  return function ActionCell({ row }: GridRenderCellParams<TeacherDirectoryRow>) {
    return (
      <TeacherActionButton
        icon={icon}
        variant={variant}
        onClick={() => {
          if (row.id) {
            router.push(getPath(row.id));
          }
        }}
      />
    );
  };
}

export function TeacherDataGrid({
  rows,
  page = 0,
  pageSize = 10,
  totalCount,
  onPageChange,
}: Readonly<TeacherDataGridProps>) {
  const t = useTranslations("dashboard.teachersDirectory");
  const router = useRouter();

  const columns: GridColDef<TeacherDirectoryRow>[] = [
    {
      field: "index",
      headerName: t("table.hash"),
      width: 80,
      renderCell: (params: GridRenderCellParams<TeacherDirectoryRow>) => (
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: "name",
      headerName: t("table.name"),
      flex: 1.5,
      renderCell: (params: GridRenderCellParams<TeacherDirectoryRow>) => (
        <PersonProfileLinkCell
          href={profileHrefForTeacher({ userId: params.row.userId, teacherId: params.row.id })}
          name={(params.value as string) ?? ""}
          avatarUrl={params.row.avatarUrl}
          avatarSize={40}
          typographyVariant="bodyLg"
          fontWeight={700}
        />
      ),
    },
    {
      field: "email",
      headerName: t("table.email"),
      flex: 1.5,
      renderCell: (params: GridRenderCellParams<TeacherDirectoryRow>) => (
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
          {params.value as string}
        </Typography>
      ),
    },
    {
      field: "zoomLink",
      headerName: t("table.zoom"),
      flex: 1,
      align: "center",
      headerAlign: "center",
      renderCell: (params: GridRenderCellParams<TeacherDirectoryRow>) => {
        if (!params.value) {
          return (
            <Typography variant="labelMd" sx={theme => ({ fontStyle: "italic", color: theme.palette.text.disabled })}>
              {t("table.linkPending")}
            </Typography>
          );
        }
        return (
          <Link
            href={isSafeUrl(params.value as string)}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            variant="labelMd"
            sx={theme => ({
              fontWeight: 600,
              py: 0.5,
              px: 1,
              backgroundColor: theme.palette.infoContainer,
              color: theme.palette.onInfoContainer,
            })}
          >
            {t("actions.joinRoom")}
          </Link>
        );
      },
    },
    {
      field: "schedule",
      headerName: t("table.schedule"),
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: getActionCellRenderer(
        <CalendarMonthOutlined />,
        "error",
        router,
        id => `/teachers/${id}/schedule/weekly`
      ),
    },
    {
      field: "options",
      headerName: t("table.options"),
      width: 180,
      align: "center",
      headerAlign: "center",
      sortable: false,
      renderCell: (params: GridRenderCellParams<TeacherDirectoryRow>) => (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, height: "100%" }}>
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
            onClick={() => {
              const href = profileHrefForTeacher({ userId: params.row.userId, teacherId: params.row.id });
              if (href) {
                router.push(href);
              }
            }}
          />
        </Box>
      ),
    },
  ];

  const isServerPagination = totalCount !== undefined && onPageChange !== undefined;

  const paginationModel: GridPaginationModel = {
    page,
    pageSize,
  };

  return (
    <AppDataGrid<TeacherDirectoryRow>
      rows={rows}
      columns={columns}
      rowHeight={72}
      disableRowSelectionOnClick
      getRowId={row => row.id ?? ""}
      {...(isServerPagination
        ? {
            paginationMode: "server" as const,
            rowCount: totalCount,
            paginationModel,
            onPaginationModelChange: model => {
              onPageChange(model.page);
            },
            pageSizeOptions: [pageSize],
            slots: { pagination: GridPagination },
          }
        : {})}
    />
  );
}
