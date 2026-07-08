"use client";

import { Box, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { AppDataGrid } from "@/frontend/components/ui/dataGrid/AppDataGrid";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/stores/userStore";
import type { ReportLedgerRow } from "@/frontend/views/dashboard/reports/types/reportsTypes";

export interface ReportsDataGridLabels {
  readonly name: string;
  readonly taken: string;
  readonly absent: string;
  readonly leave: string;
  readonly pending: string;
  readonly hours: string;
  readonly paidEgp: string;
  readonly paidUsd: string;
  readonly noEntries: string;
}

interface ReportsDataGridProps {
  readonly rows: readonly ReportLedgerRow[];
  readonly labels: ReportsDataGridLabels;
  readonly onRowClick?: (row: ReportLedgerRow) => void;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function renderCountCell(value: number, tone: "default" | "error" | "primary" = "default") {
  return (
    <Typography
      variant="bodyMd"
      sx={theme => {
        if (tone === "error") {
          return { color: theme.palette.error.main, fontWeight: 600, textAlign: "center", width: "100%" };
        }
        if (tone === "primary") {
          return { color: theme.palette.primary.main, fontWeight: 600, textAlign: "center", width: "100%" };
        }
        return { color: theme.palette.text.secondary, textAlign: "center", width: "100%" };
      }}
    >
      {value}
    </Typography>
  );
}

export function ReportsDataGrid({ rows, labels, onRowClick }: Readonly<ReportsDataGridProps>) {
  const { hasPermission } = useUserStore();
  const showFinancials = hasPermission(AppPermission.ReportViewFinancials);

  const columns = useMemo<GridColDef<ReportLedgerRow>[]>(() => {
    const cols: GridColDef<ReportLedgerRow>[] = [
      {
        field: "name",
        headerName: labels.name,
        flex: 1.4,
        minWidth: 200,
        renderCell: ({ row }) => (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 600 })}>
            {row.name}
          </Typography>
        ),
      },
      {
        field: "taken",
        headerName: labels.taken,
        width: 90,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => renderCountCell(row.taken, "primary"),
      },
      {
        field: "absent",
        headerName: labels.absent,
        width: 90,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => renderCountCell(row.absent, "error"),
      },
      {
        field: "leave",
        headerName: labels.leave,
        width: 90,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => renderCountCell(row.leave),
      },
      {
        field: "pending",
        headerName: labels.pending,
        width: 100,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => renderCountCell(row.pending),
      },
    ];

    if (showFinancials) {
      cols.push(
        {
          field: "hours",
          headerName: labels.hours,
          width: 100,
          align: "center",
          headerAlign: "center",
          renderCell: ({ row }) => (
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
              {row.hours}
            </Typography>
          ),
        },
        {
          field: "paidEgp",
          headerName: labels.paidEgp,
          width: 130,
          align: "right",
          headerAlign: "right",
          renderCell: ({ row }) => (
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 600 })}>
              {formatCurrency(row.paidEgp)}
            </Typography>
          ),
        },
        {
          field: "paidUsd",
          headerName: labels.paidUsd,
          width: 130,
          align: "right",
          headerAlign: "right",
          renderCell: ({ row }) => (
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 600 })}>
              {formatCurrency(row.paidUsd)}
            </Typography>
          ),
        }
      );
    }

    return cols;
  }, [labels, showFinancials]);

  return (
    <Box sx={{ px: { xs: 0, md: 1 }, pb: 1 }}>
      <AppDataGrid
        rows={rows}
        columns={columns}
        emptyMessage={labels.noEntries}
        autoHeight
        disableColumnMenu
        onRowClick={
          onRowClick
            ? params => {
                onRowClick(params.row);
              }
            : undefined
        }
        sx={{ "& .MuiDataGrid-row": onRowClick ? { cursor: "pointer" } : {} }}
      />
    </Box>
  );
}
