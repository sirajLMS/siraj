"use client";

import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { AppDataGrid, GridPagination, StatusBadge } from "@/frontend/common/components/ui";
import { InvoiceStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ParentInvoiceRowActions } from "@/frontend/views/dashboard/billing/components/ParentInvoiceRowActions";
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
  readonly viewFeedback: string;
  readonly downloadPdf: string;
  readonly payNow: string;
  readonly markAsPaid: string;
  readonly hasPaymentProofHint: string;
  readonly noEntries: string;
  readonly emptyTitle?: string;
  readonly emptySubtitle?: string;
  readonly statusLabels: Record<string, string>;
}

interface ParentInvoicesDataGridProps {
  readonly rows: readonly ParentInvoiceRow[];
  readonly labels: ParentInvoicesDataGridLabels;
  readonly canView: boolean;
  readonly canSubmitProof: boolean;
  readonly canManage?: boolean;
  readonly billingActionsDisabled?: boolean;
  readonly onPayNow: (invoice: MarkPaidInvoiceTarget) => void;
  readonly onMarkAsPaid?: (invoice: MarkPaidInvoiceTarget) => void;
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
  canManage = false,
  billingActionsDisabled = false,
  onPayNow,
  onMarkAsPaid,
  onViewPaymentDetails,
  onDownloadPdf,
  page = 0,
  pageSize = 10,
  totalCount,
  onPageChange,
  loading = false,
}: Readonly<ParentInvoicesDataGridProps>) {
  const actionLabels = useMemo(
    () => ({
      payNow: labels.payNow,
      viewSubmission: labels.viewSubmission,
      viewFeedback: labels.viewFeedback,
      viewDetails: labels.viewDetails,
      downloadPdf: labels.downloadPdf,
      markAsPaid: labels.markAsPaid,
    }),
    [labels]
  );

  const emptyMessage =
    labels.emptyTitle && labels.emptySubtitle ? `${labels.emptyTitle} ${labels.emptySubtitle}` : labels.noEntries;

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
        flex: 1.2,
        minWidth: 180,
        sortable: false,
        align: "right",
        headerAlign: "right",
        renderCell: ({ row }) => (
          <ParentInvoiceRowActions
            row={row}
            labels={actionLabels}
            canView={canView}
            canSubmitProof={canSubmitProof}
            canManage={canManage}
            billingActionsDisabled={billingActionsDisabled}
            layout="inline"
            onPayNow={onPayNow}
            onMarkAsPaid={onMarkAsPaid}
            onViewPaymentDetails={onViewPaymentDetails}
            onDownloadPdf={onDownloadPdf}
          />
        ),
      },
    ],
    [
      actionLabels,
      billingActionsDisabled,
      canManage,
      canSubmitProof,
      canView,
      labels,
      onDownloadPdf,
      onMarkAsPaid,
      onPayNow,
      onViewPaymentDetails,
    ]
  );

  const isServerPagination = totalCount !== undefined && onPageChange !== undefined;

  return (
    <AppDataGrid
      rows={rows}
      columns={columns}
      loading={loading}
      getRowId={row => row.id}
      emptyMessage={emptyMessage}
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
