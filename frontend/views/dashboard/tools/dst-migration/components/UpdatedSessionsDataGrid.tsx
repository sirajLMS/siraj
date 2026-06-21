"use client";

import { ArrowForwardOutlined } from "@mui/icons-material";
import { Box, Button, Chip, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { AppDataGrid } from "@/frontend/components/ui";
import type { UpdatedSession } from "@/frontend/views/dashboard/tools/dst-migration/types";

interface Props {
  readonly sessions: readonly UpdatedSession[];
}

function TimeChip({ value, highlighted }: Readonly<{ value: string; highlighted?: boolean }>) {
  return (
    <Chip
      label={value}
      size="small"
      sx={theme => ({
        fontWeight: highlighted ? 700 : 500,
        bgcolor: highlighted ? theme.palette.successContainer : theme.palette.surfaceContainerHigh,
        color: highlighted ? theme.palette.onSuccessContainer : theme.palette.onSurface,
      })}
    />
  );
}

export function UpdatedSessionsDataGrid({ sessions }: Readonly<Props>) {
  const t = useTranslations("dashboard.dstMigration");

  const columns = useMemo<GridColDef<UpdatedSession>[]>(
    () => [
      {
        field: "className",
        headerName: t("table.className"),
        flex: 1.5,
        minWidth: 220,
        renderCell: params => (
          <Box sx={{ py: 1 }}>
            <Typography variant="bodyMd" sx={theme => ({ fontWeight: 700, color: theme.palette.primary.main })}>
              {params.row.className}
            </Typography>
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              {params.row.section} • {params.row.teacher}
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
        renderCell: params => <TimeChip value={params.row.fromTime} />,
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
        renderCell: params => <TimeChip value={params.row.toTime} highlighted />,
      },
    ],
    [t]
  );

  return (
    <Box>
      <AppDataGrid
        rows={sessions}
        columns={columns}
        getRowId={row => row.id}
        hideFooter
        ariaLabel="dst-updated-sessions-table"
        emptyMessage={t("sections.updated")}
        sx={{ border: "none" }}
      />
      <Box
        sx={theme => ({
          px: 3,
          py: 2,
          display: "flex",
          justifyContent: "center",
          bgcolor: theme.palette.surfaceContainerLow,
          borderTop: `1px solid ${theme.palette.outlineVariant}`,
        })}
      >
        <Button variant="text" sx={theme => ({ fontWeight: 700, color: theme.palette.primary.main })}>
          {t("actions.viewAllSuccessful")}
        </Button>
      </Box>
    </Box>
  );
}
