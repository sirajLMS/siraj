"use client";

import { CheckCircleOutlined, DeleteOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Box, Button, IconButton, Tooltip } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";
import type {
  AdminInvoiceRow,
  MarkPaidInvoiceTarget,
  PaymentDetailsTarget,
} from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";
import { formatInvoiceDisplayId } from "@/frontend/common/views/dashboard/billing/utils/formatInvoiceDisplayId";
import {
  isDeletableInvoiceStatus,
  isPayableUnpaidStatus,
  shouldShowViewRejection,
} from "@/frontend/common/views/dashboard/billing/utils/invoiceDisplayStatus";
import type {
  AdminInvoicesDataGridLabels,
  RenderInvoiceActionConfig,
} from "@/frontend/desktop/views/dashboard/admin/billing/components/adminInvoicesDataGrid.desktop.types";

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

/** Renders the action cell for one admin invoice row (view / review / pay / delete). */
export function RenderInvoiceAction(
  config: RenderInvoiceActionConfig,
  onMarkAsPaid: (invoice: MarkPaidInvoiceTarget) => void,
  onViewPaymentDetails?: (target: PaymentDetailsTarget) => void,
  onDeleteInvoice?: (invoiceId: string) => void
) {
  const { row, labels, canManage, canDelete, billingActionsDisabled } = config;
  const deleteButton = RenderDeleteInvoiceButton(row, labels, canDelete, billingActionsDisabled, onDeleteInvoice);

  if (row.status === "PAID") {
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

  if (row.status === "PAYMENT_PENDING" && canManage && !billingActionsDisabled) {
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

  const markAsPaidButton = (
    <Button
      variant="text"
      onClick={() => {
        onMarkAsPaid({
          id: row.id,
          parentUserId: row.parentUserId,
          amount: row.amount,
          studentName: row.studentName,
          dueDate: row.dueDate,
          invoiceNumber: formatInvoiceDisplayId(row.id),
        });
      }}
      sx={{ fontWeight: 700, textTransform: "uppercase" }}
    >
      {row.status === "OVERDUE" ? labels.markAsPaid : labels.quickPay}
    </Button>
  );

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
        {markAsPaidButton}
      </Box>,
      deleteButton
    );
  }

  if (isPayableUnpaidStatus(row.status)) {
    return WrapInvoiceActions(markAsPaidButton, deleteButton);
  }

  return WrapInvoiceActions(null, deleteButton);
}
