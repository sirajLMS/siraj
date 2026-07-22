"use client";

import { CheckCircleOutlined, DeleteOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Box, Button, IconButton, Tooltip, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { type ReactNode, useMemo } from "react";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { InvoiceStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { studentHref } from "@/frontend/common/utils/profileHref";
import type {
  AdminInvoiceRow,
  MarkPaidInvoiceTarget,
  PaymentDetailsTarget,
} from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";
import {
  isDeletableInvoiceStatus,
  isPayableUnpaidStatus,
  shouldShowViewRejection,
} from "@/frontend/common/views/dashboard/billing/utils/invoiceDisplayStatus";
import { DesktopAppDataGrid, DesktopPersonProfileLinkCell, DesktopStatusBadge } from "@/frontend/desktop/components/ui";
import type { AdminInvoiceStatus } from "@/shared/types";

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
  readonly deleteInvoice: string;
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
  readonly onDeleteInvoice?: (invoiceId: string) => void;
  readonly canDelete?: boolean;
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

function RenderDeleteInvoiceButton(
  row: AdminInvoiceRow,
  labels: AdminInvoicesDataGridLabels,
  canDelete: boolean,
  billingActionsDisabled: boolean,
  onDeleteInvoice?: (invoiceId: string) => void
) {
  if (!canDelete || billingActionsDisabled || !onDeleteInvoice || !isDeletableInvoiceStatus(row.status)) {
    return null;
  }

  return (
    <Tooltip title={labels.deleteInvoice}>
      <IconButton size="small" aria-label={labels.deleteInvoice} onClick={() => onDeleteInvoice(row.id)}>
        <DeleteOutlined fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}

function WrapInvoiceActions(primary: ReactNode, deleteButton: ReactNode) {
  if (!primary && !deleteButton) {
    return null;
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5, alignItems: "center" }}>
      {primary}
      {deleteButton}
    </Box>
  );
}

function RenderInvoiceAction(
  row: AdminInvoiceRow,
  labels: AdminInvoicesDataGridLabels,
  canManage: boolean,
  canDelete: boolean,
  billingActionsDisabled: boolean,
  onMarkAsPaid: (invoice: MarkPaidInvoiceTarget) => void,
  onViewPaymentDetails?: (target: PaymentDetailsTarget) => void,
  onDeleteInvoice?: (invoiceId: string) => void
) {
  const deleteButton = RenderDeleteInvoiceButton(row, labels, canDelete, billingActionsDisabled, onDeleteInvoice);

  if (row.status === InvoiceStatus.Paid) {
    const primary = onViewPaymentDetails ? (
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
    );

    return WrapInvoiceActions(primary, deleteButton);
  }

  if (row.status === InvoiceStatus.PaymentPending && canManage && !billingActionsDisabled) {
    return WrapInvoiceActions(
      <Button
        variant="text"
        onClick={() => {
          onViewPaymentDetails?.({ invoiceId: row.id, parentUserId: row.parentUserId });
        }}
        sx={{ fontWeight: 700, textTransform: "uppercase" }}
      >
        {labels.reviewSubmission}
      </Button>,
      deleteButton
    );
  }

  if (!canManage || billingActionsDisabled) {
    return WrapInvoiceActions(null, deleteButton);
  }

  const showViewRejection = shouldShowViewRejection(row.status, row.hasRejectedSubmission) && onViewPaymentDetails;

  if (showViewRejection) {
    return WrapInvoiceActions(
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, flexWrap: "wrap" }}>
        <Button
          variant="text"
          onClick={() => {
            onViewPaymentDetails({ invoiceId: row.id, parentUserId: row.parentUserId });
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
          {row.status === "OVERDUE" ? labels.markAsPaid : labels.quickPay}
        </Button>
      </Box>,
      deleteButton
    );
  }

  if (isPayableUnpaidStatus(row.status)) {
    return WrapInvoiceActions(
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
      </Button>,
      deleteButton
    );
  }

  return WrapInvoiceActions(null, deleteButton);
}

export function AdminInvoicesDataGridDesktop({
  rows,
  labels,
  canManage,
  canDelete = false,
  billingActionsDisabled = false,
  onMarkAsPaid,
  onViewPaymentDetails,
  onDeleteInvoice,
  page = 0,
  pageSize = 10,
  totalCount,
  onPageChange,
  loading = false,
}: Readonly<AdminInvoicesDataGridProps>) {
  // RENDER OPT JUSTIFICATION: DesktopAppDataGrid
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
          <DesktopPersonProfileLinkCell
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
          <DesktopStatusBadge category="invoice" status={row.status} label={labels.statusLabels[row.status]} />
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
          RenderInvoiceAction(
            row,
            labels,
            canManage,
            canDelete,
            billingActionsDisabled,
            onMarkAsPaid,
            onViewPaymentDetails,
            onDeleteInvoice
          ),
      },
    ],
    [billingActionsDisabled, canDelete, canManage, labels, onDeleteInvoice, onMarkAsPaid, onViewPaymentDetails]
  );

  const isServerPagination = totalCount !== undefined && onPageChange !== undefined;

  return (
    <DesktopAppDataGrid
      rows={rows}
      columns={columns}
      getRowId={row => row.id}
      loading={loading}
      emptyMessage={labels.noEntries}
      paginationOptions={
        isServerPagination
          ? buildServerPaginationOptions({
              page,
              pageSize,
              totalCount,
              onPageChange,
              pageSizeOptions: [pageSize],
            })
          : { mode: "client" }
      }
    />
  );
}
