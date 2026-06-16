import { MailOutlined, SettingsOutlined } from "@mui/icons-material";
import { Avatar, Box, Chip, IconButton, Stack, Typography, useTheme } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { AppDataGrid, StatusBadge } from "@/frontend/components/ui";
import type { Manager } from "@/frontend/stores/managersStore";

interface ManagersDataGridProps {
  managers: Manager[];
  total: number;
}

export function ManagersDataGrid({ managers, total }: Readonly<ManagersDataGridProps>) {
  const t = useTranslations("dashboard.managersDirectory");
  const theme = useTheme();

  const columns = useMemo<GridColDef<Manager>[]>(
    () => [
      {
        field: "id",
        headerName: t("table.hash"),
        width: 80,
        valueGetter: (_, row) => row.id.replace("MGR-", ""),
      },
      {
        field: "manager",
        headerName: t("table.manager"),
        flex: 1.5,
        minWidth: 250,
        renderCell: params => (
          <Stack direction="row" spacing={2} sx={{ alignItems: "center", height: "100%" }}>
            <Avatar src={params.row.avatarUrl} alt={params.row.name} sx={{ width: 40, height: 40 }} />
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              <Typography variant="bodyMd" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                {params.row.name}
              </Typography>
              <StatusBadge
                category="session"
                status={params.row.status === "active" ? "active" : "blocked"}
                label={t(`status.${params.row.status}`)}
              />
            </Box>
          </Stack>
        ),
      },
      {
        field: "email",
        headerName: t("table.contactDetails"),
        flex: 1.5,
        minWidth: 200,
        renderCell: params => (
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "center", height: "100%", color: theme.palette.text.secondary }}
          >
            <MailOutlined fontSize="small" sx={{ color: theme.palette.primaryContainer }} />
            <Typography variant="bodyMd">{params.row.email}</Typography>
          </Stack>
        ),
      },
      {
        field: "skypeId",
        headerName: t("table.skypeId"),
        flex: 1,
        minWidth: 150,
      },
      {
        field: "phone",
        headerName: t("table.phone"),
        flex: 1,
        minWidth: 150,
      },
      {
        field: "role",
        headerName: t("table.roleType"),
        width: 120,
        renderCell: params => {
          const isStaff = params.row.role === "staff";
          return (
            <Chip
              label={t(`roles.${params.row.role}`)}
              size="small"
              sx={{
                fontWeight: 700,
                textTransform: "uppercase",
                bgcolor: isStaff ? theme.palette.secondaryContainer : theme.palette.primaryContainer,
                color: isStaff ? theme.palette.onSecondaryContainer : theme.palette.onPrimaryContainer,
              }}
            />
          );
        },
      },
      {
        field: "options",
        headerName: t("table.options"),
        width: 100,
        align: "center",
        headerAlign: "center",
        renderCell: () => (
          <IconButton size="small" aria-label={t("actions.options")}>
            <SettingsOutlined fontSize="small" />
          </IconButton>
        ),
      },
    ],
    [t, theme]
  );

  return (
    <Box sx={{ width: "100%" }}>
      <AppDataGrid rows={managers} columns={columns} emptyMessage={t("noEntries")} autoHeight rowHeight={80} />
      <Box
        sx={{ p: 2, borderTop: `1px solid ${theme.palette.border.light}`, bgcolor: theme.palette.background.default }}
      >
        <Typography variant="bodyMd" sx={{ color: theme.palette.text.secondary }}>
          {t("showingOf", { count: managers.length, total: total })}
        </Typography>
      </Box>
    </Box>
  );
}
