"use client";

import { CheckCircleOutlined } from "@mui/icons-material";
import { Avatar, Box, Button, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { AppDataGrid, GridPagination, StatusBadge } from "@/frontend/components/ui";
import { InvoiceStatus } from "@/shared/lib/enum";
import type { AdminInvoiceRow, AdminInvoiceStatus } from "../types/billingViewTypes";

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
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
}

// Invoice ID text styled with primary color and bold weight for emphasis
const StyledInvoiceIdTypography = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.primary.main,
}));

// Small avatar for student initials in the data grid rows
const StyledStudentAvatarSmall = styled(Avatar)(({ theme }) => ({
  width: 32,
  height: 32,
  backgroundColor: theme.palette.secondaryContainer,
  fontSize: 12,
}));

// Date text styled with secondary color for subdued appearance in grid cells
const StyledDateTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

// Check icon displayed when an invoice is already paid, using outline variant color
const StyledPaidCheckIcon = styled(CheckCircleOutlined)(({ theme }) => ({
  color: theme.palette.outlineVariant,
}));

function renderInvoiceAction(
  row: AdminInvoiceRow,
  labels: AdminInvoicesDataGridLabels,
  canManage: boolean,
  onMarkAsPaid: (id: string) => void
) {
  if (!canManage || row.status === InvoiceStatus.PAID) {
    if (row.status === InvoiceStatus.PAID) {
      return <StyledPaidCheckIcon />;
    }
    return null;
  }

  if (row.status === "OVERDUE") {
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

export function AdminInvoicesDataGrid({
  rows,
  labels,
  canManage,
  onMarkAsPaid,
  page = 0,
  pageSize = 10,
  totalCount,
  onPageChange,
}: Readonly<AdminInvoicesDataGridProps>) {
  const columns = useMemo<GridColDef<AdminInvoiceRow>[]>(
    () => [
      {
        field: "id",
        headerName: labels.invoiceId,
        flex: 0.8,
        minWidth: 120,
        renderCell: ({ row }) => (
          <StyledInvoiceIdTypography variant="bodyMd">
            {row.id.replace("inv-", "INV-").toUpperCase()}
          </StyledInvoiceIdTypography>
        ),
      },
      {
        field: "studentName",
        headerName: labels.studentName,
        flex: 1.2,
        minWidth: 200,
        renderCell: ({ row }) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, height: "100%" }}>
            <StyledStudentAvatarSmall>{row.studentInitials}</StyledStudentAvatarSmall>
            <Typography variant="bodyMd">{row.studentName}</Typography>
          </Box>
        ),
      },
      {
        field: "dateIssued",
        headerName: labels.dateIssued,
        flex: 0.9,
        minWidth: 130,
        renderCell: ({ row }) => <StyledDateTypography variant="bodyMd">{row.dateIssued}</StyledDateTypography>,
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

  const isServerPagination = totalCount !== undefined && onPageChange !== undefined;

  return (
    <AppDataGrid
      rows={rows}
      columns={columns}
      getRowId={row => row.id}
      emptyMessage={labels.noEntries}
      {...(isServerPagination
        ? {
            paginationMode: "server" as const,
            rowCount: totalCount,
            paginationModel: { page, pageSize },
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
