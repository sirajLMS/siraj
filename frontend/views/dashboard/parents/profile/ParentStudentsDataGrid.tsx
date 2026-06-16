import { PersonOutlined, SettingsOutlined } from "@mui/icons-material";
import { Avatar, Box, LinearProgress, Stack, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { useTranslations } from "next-intl";
import type React from "react";
import { AppDataGrid, StatusBadge } from "@/frontend/components/ui";
import type { ParentStudent } from "../types/profile";

interface ParentStudentsDataGridProps {
  readonly rows: readonly ParentStudent[];
  readonly loading?: boolean;
}

const ParentStudentsDataGrid: React.FC<ParentStudentsDataGridProps> = ({ rows, loading }) => {
  const t = useTranslations("dashboard.parentProfile.table");
  const theme = useTheme();

  const columns: GridColDef<ParentStudent>[] = [
    {
      field: "name",
      headerName: t("studentName"),
      flex: 1.5,
      minWidth: 200,
      renderCell: params => (
        <Stack direction="row" spacing={2} sx={{ alignItems: "center", height: "100%" }}>
          <Avatar
            src={params.row.avatarUrl}
            sx={{
              width: 32,
              height: 32,
              fontSize: 12,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              fontWeight: 700,
            }}
          >
            {params.row.name
              .split(" ")
              .map(n => n[0])
              .join("")
              .toUpperCase()}
          </Avatar>
          <Typography variant="bodyMd" sx={{ fontWeight: 700 }}>
            {params.row.name}
          </Typography>
        </Stack>
      ),
    },
    {
      field: "teacher",
      headerName: t("teacher"),
      flex: 1.2,
      minWidth: 150,
    },
    {
      field: "hoursPerWeek",
      headerName: t("hoursPerWeek"),
      flex: 1,
      minWidth: 120,
      renderCell: params => <Typography variant="bodyMd">{params.value} Hours</Typography>,
    },
    {
      field: "classesLeft",
      headerName: t("classesLeft"),
      flex: 1.2,
      minWidth: 150,
      renderCell: params => {
        const percentage = (params.row.classesLeft / params.row.totalClasses) * 100;
        return (
          <Stack spacing={0.5} sx={{ width: "100%", justifyContent: "center", height: "100%" }}>
            <Typography variant="labelSm">
              {params.row.classesLeft} / {params.row.totalClasses}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={percentage}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: theme.palette.grey[100],
                "& .MuiLinearProgress-bar": {
                  backgroundColor: theme.palette.primary.main,
                },
              }}
            />
          </Stack>
        );
      },
    },
    {
      field: "language",
      headerName: t("language"),
      flex: 1,
      minWidth: 100,
    },
    {
      field: "gender",
      headerName: t("gender"),
      flex: 0.8,
      minWidth: 80,
    },
    {
      field: "info",
      headerName: t("info"),
      width: 70,
      sortable: false,
      renderCell: () => (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
          <PersonOutlined
            sx={{
              color: theme.palette.text.secondary,
              cursor: "pointer",
              "&:hover": { color: theme.palette.primary.main },
            }}
          />
        </Box>
      ),
    },
    {
      field: "options",
      headerName: t("options"),
      width: 80,
      sortable: false,
      renderCell: () => (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
          <SettingsOutlined
            sx={{
              color: theme.palette.text.secondary,
              cursor: "pointer",
              "&:hover": { color: theme.palette.primary.main },
            }}
          />
        </Box>
      ),
    },
    {
      field: "status",
      headerName: t("status"),
      width: 120,
      renderCell: params => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <StatusBadge category="studentAccount" status={params.row.status} label={params.row.status} />
        </Box>
      ),
    },
  ];

  return (
    <AppDataGrid
      rows={rows}
      columns={columns}
      loading={loading}
      disableRowSelectionOnClick
      hideFooter
      sx={{ border: "none" }}
    />
  );
};

export default ParentStudentsDataGrid;
