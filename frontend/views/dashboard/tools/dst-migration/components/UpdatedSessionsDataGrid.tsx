"use client";

import { ArrowForwardOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { AppDataGrid, StatusBadge } from "@/frontend/components/ui";
import type { UpdatedSession } from "@/frontend/views/dashboard/tools/dst-migration/dst-migration.types";

interface Props {
  readonly sessions: readonly UpdatedSession[];
}

export function UpdatedSessionsDataGrid({ sessions }: Readonly<Props>) {
  const t = useTranslations("dashboard.dstMigration");

  const columns = useMemo<GridColDef<UpdatedSession>[]>(
    () => [
      {
        field: "studentName",
        headerName: t("table.studentName"),
        flex: 1.5,
        minWidth: 220,
        renderCell: params => (
          <Box sx={{ py: 1 }}>
            <Typography variant="bodyMd" sx={theme => ({ fontWeight: 700, color: theme.palette.primary.main })}>
              {params.row.studentName}
            </Typography>
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              {params.row.teacherName}
            </Typography>
          </Box>
        ),
      },
      {
        field: "fromTime",
        headerName: t("table.from"),
        width: 130,
        align: "center",
        headerAlign: "center",
        renderCell: params => <StatusBadge category="session" status="pending" label={params.row.fromTime} />,
      },
      {
        field: "arrow",
        headerName: "",
        width: 60,
        sortable: false,
        filterable: false,
        align: "center",
        headerAlign: "center",
        renderCell: () => (
          <ArrowForwardOutlined sx={theme => ({ fontSize: 16, color: theme.palette.text.secondary })} />
        ),
      },
      {
        field: "toTime",
        headerName: t("table.to"),
        width: 130,
        align: "center",
        headerAlign: "center",
        renderCell: params => <StatusBadge category="session" status="completed" label={params.row.toTime} />,
      },
    ],
    [t]
  );

  return (
    <AppDataGrid
      rows={sessions}
      columns={columns}
      getRowId={row => row.id}
      hideFooter
      ariaLabel="dst-updated-sessions-table"
      emptyMessage={t("sections.updated")}
      sx={{ border: "none" }}
    />
  );
}
