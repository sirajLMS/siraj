"use client";

import { DownloadOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { AppDataGrid, GridPagination, PrimaryPageAction, StatusBadge } from "@/frontend/components/ui";
import { InvoiceStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import type {
  MarkPaidInvoiceTarget,
  PaymentDetailsTarget,
} from "@/frontend/views/dashboard/billing/types/billingViewTypes";
import type { ParentInvoiceRow } from "@/frontend/views/dashboard/billing/types/parentBillingTypes";

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
  readonly viewSubmission: string;
  readonly downloadPdf: string;
  readonly payNow: string;
  readonly hasPaymentProofHint: string;
  readonly noEntries: string;
  readonly statusLabels: Record<string, string>;
}

interface ParentInvoicesDataGridProps {
  readonly rows: readonly ParentInvoiceRow[];
  readonly labels: ParentInvoicesDataGridLabels;
  readonly canView: boolean;
  readonly canSubmitProof: boolean;
  readonly onPayNow: (invoice: MarkPaidInvoiceTarget) => void;
  readonly onViewPaymentDetails?: (target: PaymentDetailsTarget) => void;
  readonly onDownloadPdf: (id: string) => void;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
  readonly loading?: boolean;
}

const StyledFeeTypography = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.primary.main,
}));

export function ParentInvoicesDataGrid({
  rows,
  labels,
  canView,
  canSubmitProof,
  onPayNow,
  onViewPaymentDetails,
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
        renderCell: ({ row }) => (
          <Box>
            <Typography variant="bodyMd">{row.paidDate}</Typography>
            {row.status === InvoiceStatus.Paid && row.hasPaymentProof ? (
              <Typography variant="labelMd" sx={{ color: "text.secondary" }}>
                {labels.hasPaymentProofHint}
              </Typography>
            ) : null}
          </Box>
        ),
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
          <StatusBadge category="invoice" status={row.status} label={labels.statusLabels[row.status] ?? row.status} />
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

          if (row.status === InvoiceStatus.Unpaid && canSubmitProof) {
            return (
              <PrimaryPageAction
                size="small"
                onClick={() => {
                  onPayNow({
                    id: row.id,
                    amount: row.fee,
                    dueDate: row.dueDate,
                    invoiceNumber: row.invoiceNumber,
                  });
                }}
              >
                {labels.payNow}
              </PrimaryPageAction>
            );
          }

          if (row.status === InvoiceStatus.PaymentPending) {
            return (
              <PrimaryPageAction
                size="small"
                onClick={() => {
                  onViewPaymentDetails?.({ invoiceId: row.id });
                }}
              >
                {labels.viewSubmission}
              </PrimaryPageAction>
            );
          }

          if (row.status === InvoiceStatus.Paid) {
            return (
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                <Tooltip title={labels.viewDetails}>
                  <IconButton
                    size="small"
                    aria-label={labels.viewDetails}
                    onClick={() => {
                      onViewPaymentDetails?.({ invoiceId: row.id });
                    }}
                  >
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
          }

          return null;
        },
      },
    ],
    [canSubmitProof, canView, labels, onDownloadPdf, onPayNow, onViewPaymentDetails]
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
