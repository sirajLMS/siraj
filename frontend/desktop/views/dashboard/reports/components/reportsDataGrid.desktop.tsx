"use client";

import { Box, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import type { ReportsDataGridLabels } from "@/frontend/common/views/dashboard/reports/types/reportsLabelTypes";
import type { ReportLedgerRow } from "@/frontend/common/views/dashboard/reports/types/reportsTypes";
import type { ReportsDataGridProps } from "@/frontend/common/views/dashboard/reports/types/reportsViewProps";
import { reportNameHrefForRow } from "@/frontend/common/views/dashboard/reports/utils/reportNameHrefForRow.utils";
import { DesktopAppDataGrid, DesktopPersonProfileLinkCell } from "@/frontend/desktop/components/ui";

export type ReportsDataGridDesktopLabels = ReportsDataGridLabels;

function CountCell({ value, tone = "default" }: Readonly<{ value: number; tone?: "default" | "error" | "primary" }>) {
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

export function ReportsDataGridDesktop({
  rows,
  labels,
  reportType,
  loading = false,
  onRowClick,
  showFinancials,
  formatPaidAmounts,
}: Readonly<ReportsDataGridProps>) {
  // RENDER OPT JUSTIFICATION: DesktopAppDataGrid — the columns array contains
  // renderCell closures that capture labels/locale/handlers; without memo
  // every render produces a new column-array identity and forces the data
  // grid to re-mount its virtualized row slices. Memoizing preserves JSX
  // identity ONLY; no data derivation happens here.
  const columns = useMemo<GridColDef<ReportLedgerRow>[]>(() => {
    const cols: GridColDef<ReportLedgerRow>[] = [
      {
        field: "name",
        headerName: labels.name,
        flex: 1.4,
        minWidth: 200,
        renderCell: ({ row }) => (
          <DesktopPersonProfileLinkCell
            name={row.name}
            href={reportNameHrefForRow(row, reportType)}
            fallbackInitial={row.avatarInitials}
            avatarSize={32}
            fontWeight={600}
          />
        ),
      },
      {
        field: "taken",
        headerName: labels.taken,
        width: 90,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => <CountCell value={row.taken} tone="primary" />,
      },
      {
        field: "absent",
        headerName: labels.absent,
        width: 90,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => <CountCell value={row.absent} tone="error" />,
      },
      {
        field: "leave",
        headerName: labels.leave,
        width: 90,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => <CountCell value={row.leave} />,
      },
      {
        field: "pending",
        headerName: labels.pending,
        width: 100,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => <CountCell value={row.pending} />,
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
          field: "paidAmounts",
          headerName: labels.paid,
          flex: 1,
          minWidth: 180,
          align: "right",
          headerAlign: "right",
          sortable: false,
          renderCell: ({ row }) => (
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 600 })}>
              {formatPaidAmounts(row.paidAmounts)}
            </Typography>
          ),
        }
      );
    }

    return cols;
  }, [labels, reportType, showFinancials, formatPaidAmounts]);

  return (
    <Box sx={{ px: { xs: 0, md: 1 }, pb: 1 }}>
      <DesktopAppDataGrid
        rows={rows}
        columns={columns}
        loading={loading}
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
