import { CalendarMonthOutlined, SettingsOutlined } from "@mui/icons-material";
import { Avatar, Box, IconButton, Link, Typography } from "@mui/material";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AppDataGrid } from "@/frontend/components/ui/AppDataGrid";
import type { TeacherDirectoryRow } from "@/frontend/graphql/generated/gql/graphql-types";

interface TeacherDataGridProps {
  readonly rows: readonly TeacherDirectoryRow[];
}

export function TeacherDataGrid({ rows }: Readonly<TeacherDataGridProps>) {
  const t = useTranslations("dashboard.teachersDirectory");
  const router = useRouter();
  const locale = useLocale();

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
      field: "image",
      headerName: t("table.image"),
      width: 100,
      sortable: false,
      renderCell: (params: GridRenderCellParams<TeacherDirectoryRow>) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Avatar
            src={params.row.avatarUrl || undefined}
            alt={params.row.name || ""}
            sx={theme => ({
              width: 40,
              height: 40,
              border: `1px solid ${theme.palette.border.light}`,
            })}
          />
        </Box>
      ),
    },
    {
      field: "name",
      headerName: t("table.name"),
      flex: 1.5,
      renderCell: (params: GridRenderCellParams<TeacherDirectoryRow>) => (
        <Typography variant="bodyLg" sx={theme => ({ fontWeight: 700, color: theme.palette.primary.main })}>
          {params.value as string}
        </Typography>
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
            href={params.value as string}
            target="_blank"
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
      renderCell: (params: GridRenderCellParams<TeacherDirectoryRow>) => (
        <TeacherActionButton
          icon={<CalendarMonthOutlined />}
          variant="error"
          onClick={() => {
            if (params.row.id) {
              router.push(`/${locale}/teachers/${params.row.id}/schedule/weekly`);
            }
          }}
        />
      ),
    },
    {
      field: "options",
      headerName: t("table.options"),
      width: 100,
      align: "center",
      headerAlign: "center",
      renderCell: (params: GridRenderCellParams<TeacherDirectoryRow>) => (
        <TeacherActionButton
          icon={<SettingsOutlined />}
          variant="primary"
          onClick={() => {
            if (params.row.id) {
              router.push(`/${locale}/teachers/${params.row.id}/profile`);
            }
          }}
        />
      ),
    },
  ];

  return <AppDataGrid rows={rows} columns={columns} rowHeight={72} disableRowSelectionOnClick />;
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
        bgcolor: variant === "primary" ? theme.palette.primaryContainer : theme.palette.errorContainer,
        color: variant === "primary" ? theme.palette.onPrimaryContainer : theme.palette.onErrorContainer,
        "&:hover": {
          bgcolor: variant === "primary" ? theme.palette.primaryContainer : theme.palette.errorContainer,
          opacity: 0.8,
        },
      })}
    >
      {icon}
    </IconButton>
  );
}
