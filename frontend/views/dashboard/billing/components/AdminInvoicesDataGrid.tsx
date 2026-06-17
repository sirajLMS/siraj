"use client";

import { CheckCircleOutlined } from "@mui/icons-material";
import { Avatar, Box, Button, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { AppDataGrid, StatusBadge } from "@/frontend/components/ui";
import type { AdminInvoiceRow, AdminInvoiceStatus } from "@/frontend/stores/mockAdminBillingStore";

export interface AdminInvoicesDataGridLabels {
  readonly invoiceId: string;
  readonly studentName: string;
  readonly dateIssued: string;
  readonly amount: string;
  readonly status: string;
  readonly actions: string;
  readonly markAsPaid: string;
  readonly quickPay: string;
  readonly noEntries: string;
  readonly statusLabels: Record<AdminInvoiceStatus, string>;
}

interface AdminInvoicesDataGridProps {
  readonly rows: readonly AdminInvoiceRow[];
  readonly labels: AdminInvoicesDataGridLabels;
  readonly canManage: boolean;
  readonly onMarkAsPaid: (id: string) => void;
}

function renderInvoiceAction(
  row: AdminInvoiceRow,
  labels: AdminInvoicesDataGridLabels,
  canManage: boolean,
  onMarkAsPaid: (id: string) => void
) {
  if (!canManage || row.status === "paid") {
    if (row.status === "paid") {
      return <CheckCircleOutlined sx={theme => ({ color: theme.palette.outlineVariant })} />;
    }
    return null;
  }

  if (row.status === "overdue") {
    return (
      <Button
        variant="text"
        onClick={() => {
          onMarkAsPaid(row.id);
        }}
        sx={{ fontWeight: 700, textTransform: "uppercase" }}
      >
        {labels.markAsPaid}
      </Button>
    );
  }

  return (
    <Button
      variant="text"
      onClick={() => {
        onMarkAsPaid(row.id);
      }}
      sx={{ fontWeight: 700, textTransform: "uppercase" }}
    >
      {labels.quickPay}
    </Button>
  );
}

export function AdminInvoicesDataGrid({ rows, labels, canManage, onMarkAsPaid }: Readonly<AdminInvoicesDataGridProps>) {
  const columns = useMemo<GridColDef<AdminInvoiceRow>[]>(
    () => [
      {
        field: "id",
        headerName: labels.invoiceId,
        flex: 0.8,
        minWidth: 120,
        renderCell: ({ row }) => (
          <Typography variant="bodyMd" sx={theme => ({ fontWeight: 700, color: theme.palette.primary.main })}>
            {row.id.replace("inv-", "INV-").toUpperCase()}
          </Typography>
        ),
      },
      {
        field: "studentName",
        headerName: labels.studentName,
        flex: 1.2,
        minWidth: 200,
        renderCell: ({ row }) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, height: "100%" }}>
            <Avatar sx={theme => ({ width: 32, height: 32, bgcolor: theme.palette.secondaryContainer, fontSize: 12 })}>
              {row.studentInitials}
            </Avatar>
            <Typography variant="bodyMd">{row.studentName}</Typography>
          </Box>
        ),
      },
      {
        field: "dateIssued",
        headerName: labels.dateIssued,
        flex: 0.9,
        minWidth: 130,
        renderCell: ({ row }) => (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {row.dateIssued}
          </Typography>
        ),
      },
      {
        field: "amount",
        headerName: labels.amount,
        flex: 0.7,
        minWidth: 100,
        renderCell: ({ row }) => (
          <Typography variant="bodyMd" sx={{ fontWeight: 600 }}>
            {row.amount}
          </Typography>
        ),
      },
      {
        field: "status",
        headerName: labels.status,
        flex: 0.8,
        minWidth: 120,
        renderCell: ({ row }) => (
          <StatusBadge category="invoice" status={row.status} label={labels.statusLabels[row.status]} />
        ),
      },
      {
        field: "actions",
        headerName: labels.actions,
        flex: 0.9,
        minWidth: 140,
        sortable: false,
        align: "right",
        headerAlign: "right",
        renderCell: ({ row }) => renderInvoiceAction(row, labels, canManage, onMarkAsPaid),
      },
    ],
    [canManage, labels, onMarkAsPaid]
  );

  return <AppDataGrid rows={rows} columns={columns} getRowId={row => row.id} emptyMessage={labels.noEntries} />;
}
