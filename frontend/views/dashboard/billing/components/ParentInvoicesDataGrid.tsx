"use client";

import { DownloadOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { AppDataGrid, GridPagination, PrimaryPageAction, StatusBadge } from "@/frontend/components/ui";
import { InvoiceStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import type { ParentInvoiceRow } from "../types/parentBillingTypes";

export interface ParentInvoicesDataGridLabels {
  readonly invoiceNumber: string;
  readonly month: string;
  readonly issueDate: string;
  readonly dueDate: string;
  readonly paidDate: string;
  readonly fee: string;
  readonly status: string;
  readonly options: string;
  readonly viewDetails: string;
  readonly downloadPdf: string;
  readonly payNow: string;
  readonly noEntries: string;
  readonly statusLabels: Record<InvoiceStatus, string>;
}

interface ParentInvoicesDataGridProps {
  readonly rows: readonly ParentInvoiceRow[];
  readonly labels: ParentInvoicesDataGridLabels;
  readonly canView: boolean;
  readonly onPayNow: (id: string) => void;
  readonly onDownloadPdf: (id: string) => void;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
  readonly loading?: boolean;
}

// Fee amount text styled with primary color and bold weight for emphasis
const StyledFeeTypography = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.primary.main,
}));

export function ParentInvoicesDataGrid({
  rows,
  labels,
  canView,
  onPayNow,
  onDownloadPdf,
  page = 0,
  pageSize = 10,
  totalCount,
  onPageChange,
  loading = false,
}: Readonly<ParentInvoicesDataGridProps>) {
  const columns = useMemo<GridColDef<ParentInvoiceRow>[]>(
    () => [
      {
        field: "invoiceNumber",
        headerName: labels.invoiceNumber,
        flex: 1,
        minWidth: 140,
        renderCell: ({ row }) => (
          <Typography variant="labelMd" sx={{ fontWeight: 700 }}>
            {row.invoiceNumber}
          </Typography>
        ),
      },
      {
        field: "month",
        headerName: labels.month,
        flex: 0.8,
        minWidth: 110,
        renderCell: ({ row }) => <Typography variant="bodyMd">{row.month}</Typography>,
      },
      {
        field: "issueDate",
        headerName: labels.issueDate,
        flex: 0.9,
        minWidth: 120,
        renderCell: ({ row }) => <Typography variant="bodyMd">{row.issueDate}</Typography>,
      },
      {
        field: "dueDate",
        headerName: labels.dueDate,
        flex: 0.9,
        minWidth: 120,
        renderCell: ({ row }) => <Typography variant="bodyMd">{row.dueDate}</Typography>,
      },
      {
        field: "paidDate",
        headerName: labels.paidDate,
        flex: 0.9,
        minWidth: 120,
        renderCell: ({ row }) => <Typography variant="bodyMd">{row.paidDate}</Typography>,
      },
      {
        field: "fee",
        headerName: labels.fee,
        flex: 0.7,
        minWidth: 100,
        renderCell: ({ row }) => <StyledFeeTypography variant="bodyMd">{row.fee}</StyledFeeTypography>,
      },
      {
        field: "status",
        headerName: labels.status,
        flex: 0.8,
        minWidth: 120,
        align: "center",
        headerAlign: "center",
        renderCell: ({ row }) => (
          <StatusBadge category="invoice" status={row.status} label={labels.statusLabels[row.status]} />
        ),
      },
      {
        field: "options",
        headerName: labels.options,
        flex: 1,
        minWidth: 160,
        sortable: false,
        align: "right",
        headerAlign: "right",
        renderCell: ({ row }) => {
          if (!canView) {
            return null;
          }

          if (row.status === InvoiceStatus.Unpaid) {
            return (
              <PrimaryPageAction
                size="small"
                onClick={() => {
                  onPayNow(row.id);
                }}
              >
                {labels.payNow}
              </PrimaryPageAction>
            );
          }

          return (
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
              <Tooltip title={labels.viewDetails}>
                <IconButton size="small" aria-label={labels.viewDetails}>
                  <VisibilityOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={labels.downloadPdf}>
                <IconButton
                  size="small"
                  aria-label={labels.downloadPdf}
                  onClick={() => {
                    onDownloadPdf(row.id);
                  }}
                >
                  <DownloadOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          );
        },
      },
    ],
    [canView, labels, onDownloadPdf, onPayNow]
  );

  const isServerPagination = totalCount !== undefined && onPageChange !== undefined;

  return (
    <AppDataGrid
      rows={rows}
      columns={columns}
      loading={loading}
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
