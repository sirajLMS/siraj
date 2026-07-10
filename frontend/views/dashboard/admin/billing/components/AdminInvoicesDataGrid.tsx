"use client";

import { CheckCircleOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Box, Button, IconButton, Tooltip, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { AppDataGrid, GridPagination, PersonProfileLinkCell, StatusBadge } from "@/frontend/components/ui";
import { InvoiceStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import { studentHref } from "@/frontend/utils/profileHref";
import type {
  AdminInvoiceRow,
  AdminInvoiceStatus,
  MarkPaidInvoiceTarget,
  PaymentDetailsTarget,
} from "@/frontend/views/dashboard/billing/types/billingViewTypes";

export interface AdminInvoicesDataGridLabels {
  readonly invoiceId: string;
  readonly studentName: string;
  readonly dateIssued: string;
  readonly amount: string;
  readonly status: string;
  readonly actions: string;
  readonly markAsPaid: string;
  readonly quickPay: string;
  readonly reviewSubmission: string;
  readonly viewRejection: string;
  readonly viewDetails: string;
  readonly noEntries: string;
  readonly statusLabels: Record<AdminInvoiceStatus, string>;
}

interface AdminInvoicesDataGridProps {
  readonly rows: readonly AdminInvoiceRow[];
  readonly labels: AdminInvoicesDataGridLabels;
  readonly canManage: boolean;
  readonly billingActionsDisabled?: boolean;
  readonly onMarkAsPaid: (invoice: MarkPaidInvoiceTarget) => void;
  readonly onViewPaymentDetails?: (target: PaymentDetailsTarget) => void;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
  readonly loading?: boolean;
}

const StyledInvoiceIdTypography = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.primary.main,
}));

const StyledDateTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

const StyledPaidCheckIcon = styled(CheckCircleOutlined)(({ theme }) => ({
  color: theme.palette.outlineVariant,
}));

function renderInvoiceAction(
  row: AdminInvoiceRow,
  labels: AdminInvoicesDataGridLabels,
  canManage: boolean,
  billingActionsDisabled: boolean,
  onMarkAsPaid: (invoice: MarkPaidInvoiceTarget) => void,
  onViewPaymentDetails?: (target: PaymentDetailsTarget) => void
) {
  if (row.status === InvoiceStatus.Paid) {
    return (
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
        {onViewPaymentDetails ? (
          <Tooltip title={labels.viewDetails}>
            <IconButton
              size="small"
              aria-label={labels.viewDetails}
              onClick={() => {
                onViewPaymentDetails({ invoiceId: row.id, parentUserId: row.parentUserId });
              }}
            >
              <VisibilityOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : (
          <StyledPaidCheckIcon />
        )}
      </Box>
    );
  }

  if (row.status === InvoiceStatus.PaymentPending && canManage && !billingActionsDisabled) {
    return (
      <Button
        variant="text"
        onClick={() => {
          onViewPaymentDetails?.({ invoiceId: row.id, parentUserId: row.parentUserId });
        }}
        sx={{ fontWeight: 700, textTransform: "uppercase" }}
      >
        {labels.reviewSubmission}
      </Button>
    );
  }

  if (!canManage || billingActionsDisabled) {
    return null;
  }

  const showViewRejection = row.status === InvoiceStatus.Unpaid && row.hasRejectedSubmission && onViewPaymentDetails;

  if (showViewRejection) {
    return (
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, flexWrap: "wrap" }}>
        <Button
          variant="text"
          onClick={() => {
            onViewPaymentDetails({ invoiceId: row.id });
          }}
          sx={{ fontWeight: 700, textTransform: "uppercase" }}
        >
          {labels.viewRejection}
        </Button>
        <Button
          variant="text"
          onClick={() => {
            onMarkAsPaid({
              id: row.id,
              parentUserId: row.parentUserId,
              amount: row.amount,
              studentName: row.studentName,
              dueDate: row.dueDate,
              invoiceNumber: row.id.replace("inv-", "INV-").toUpperCase(),
            });
          }}
          sx={{ fontWeight: 700, textTransform: "uppercase" }}
        >
          {labels.quickPay}
        </Button>
      </Box>
    );
  }

  if (row.status === "OVERDUE" || row.status === InvoiceStatus.Unpaid || row.status === "PENDING") {
    return (
      <Button
        variant="text"
        onClick={() => {
          onMarkAsPaid({
            id: row.id,
            parentUserId: row.parentUserId,
            amount: row.amount,
            studentName: row.studentName,
            dueDate: row.dueDate,
            invoiceNumber: row.id.replace("inv-", "INV-").toUpperCase(),
          });
        }}
        sx={{ fontWeight: 700, textTransform: "uppercase" }}
      >
        {row.status === "OVERDUE" ? labels.markAsPaid : labels.quickPay}
      </Button>
    );
  }

  return null;
}

export function AdminInvoicesDataGrid({
  rows,
  labels,
  canManage,
  billingActionsDisabled = false,
  onMarkAsPaid,
  onViewPaymentDetails,
  page = 0,
  pageSize = 10,
  totalCount,
  onPageChange,
  loading = false,
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
          <PersonProfileLinkCell
            name={row.studentName}
            href={row.studentId ? studentHref(row.studentId) : undefined}
            fallbackInitial={row.studentInitials}
            avatarSize={32}
          />
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
        renderCell: ({ row }) =>
          renderInvoiceAction(row, labels, canManage, billingActionsDisabled, onMarkAsPaid, onViewPaymentDetails),
      },
    ],
    [billingActionsDisabled, canManage, labels, onMarkAsPaid, onViewPaymentDetails]
  );

  const isServerPagination = totalCount !== undefined && onPageChange !== undefined;

  return (
    <AppDataGrid
      rows={rows}
      columns={columns}
      getRowId={row => row.id}
      loading={loading}
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
