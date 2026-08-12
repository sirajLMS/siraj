"use client";

import { DownloadOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Box, Button, IconButton, Tooltip } from "@mui/material";
import type { ComponentType } from "react";
import { InvoiceStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type {
  ParentInvoiceRowActionLabels,
  ParentInvoiceRowActionsProps,
} from "@/frontend/common/views/dashboard/billing/types/parentInvoiceList.types";
import {
  isPayableUnpaidStatus,
  shouldShowViewRejection,
} from "@/frontend/common/views/dashboard/billing/utils/invoiceDisplayStatus";
import { buildInvoiceTarget } from "@/frontend/common/views/dashboard/billing/utils/parentInvoiceFormatters";

export interface ParentInvoiceRowActionsConfig {
  readonly PrimaryAction: ComponentType<{
    readonly size?: "small" | "medium" | "large";
    readonly fullWidth?: boolean;
    readonly disabled?: boolean;
    readonly onClick?: () => void;
    readonly children?: React.ReactNode;
  }>;
  readonly paymentPendingSize: "small" | "medium" | "large";
  readonly paymentPendingFullWidth: boolean;
  readonly paymentPendingWrapInBox: boolean;
  readonly unpaidLayout: "row" | "column";
  readonly unpaidViewFeedbackSize: "small" | "medium" | "large" | undefined;
  readonly unpaidViewFeedbackFullWidth: boolean;
  readonly unpaidPrimarySize: "small" | "medium" | "large" | undefined;
  readonly unpaidPrimaryFullWidth: boolean;
}

function PaidRowActionsShared({
  labels,
  onOpenDetails,
  onDownloadPdf,
  invoiceId,
}: {
  readonly labels: ParentInvoiceRowActionLabels;
  readonly onOpenDetails: () => void;
  readonly onDownloadPdf: (id: string) => void;
  readonly invoiceId: string;
}): React.ReactNode {
  return (
    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
      <Tooltip title={labels.viewDetails}>
        <IconButton size="small" aria-label={labels.viewDetails} onClick={onOpenDetails}>
          <VisibilityOutlined fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={labels.downloadPdf}>
        <IconButton size="small" aria-label={labels.downloadPdf} onClick={() => onDownloadPdf(invoiceId)}>
          <DownloadOutlined fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

export function ParentInvoiceRowActionsShared(
  props: Readonly<ParentInvoiceRowActionsProps>,
  config: Readonly<ParentInvoiceRowActionsConfig>
): React.ReactNode {
  const {
    row,
    labels,
    canView,
    canSubmitProof,
    canManage = false,
    billingActionsDisabled = false,
    onPayNow,
    onMarkAsPaid,
    onViewPaymentDetails,
    onDownloadPdf,
  } = props;

  if (!canView) {
    return null;
  }

  const target = buildInvoiceTarget(row);
  const openDetails = () => {
    onViewPaymentDetails?.({ invoiceId: row.id });
  };

  if (row.status === InvoiceStatus.Paid) {
    return (
      <PaidRowActionsShared
        labels={labels}
        invoiceId={row.id}
        onOpenDetails={openDetails}
        onDownloadPdf={onDownloadPdf}
      />
    );
  }

  if (row.status === InvoiceStatus.PaymentPending) {
    const { PrimaryAction, paymentPendingSize, paymentPendingFullWidth, paymentPendingWrapInBox } = config;
    const button = (
      <PrimaryAction size={paymentPendingSize} fullWidth={paymentPendingFullWidth} onClick={openDetails}>
        {labels.viewSubmission}
      </PrimaryAction>
    );
    return paymentPendingWrapInBox ? <Box sx={{ display: "flex", justifyContent: "flex-end" }}>{button}</Box> : button;
  }

  const showPayNow = isPayableUnpaidStatus(row.status) && canSubmitProof && !billingActionsDisabled;
  const showMarkAsPaid = isPayableUnpaidStatus(row.status) && canManage && !billingActionsDisabled;
  const showViewFeedback = shouldShowViewRejection(row.status, row.hasRejectedSubmission);

  if (!showPayNow && !showMarkAsPaid && !showViewFeedback) {
    return null;
  }

  const {
    PrimaryAction,
    unpaidLayout,
    unpaidViewFeedbackSize,
    unpaidViewFeedbackFullWidth,
    unpaidPrimarySize,
    unpaidPrimaryFullWidth,
  } = config;
  const isColumn = unpaidLayout === "column";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isColumn ? "column" : "row",
        justifyContent: isColumn ? undefined : "flex-end",
        gap: 1,
        flexWrap: isColumn ? undefined : "wrap",
      }}
    >
      {showViewFeedback ? (
        <Button
          size={unpaidViewFeedbackSize}
          variant="outlined"
          fullWidth={unpaidViewFeedbackFullWidth}
          onClick={openDetails}
        >
          {labels.viewFeedback}
        </Button>
      ) : null}
      {showPayNow ? (
        <PrimaryAction size={unpaidPrimarySize} fullWidth={unpaidPrimaryFullWidth} onClick={() => onPayNow(target)}>
          {labels.payNow}
        </PrimaryAction>
      ) : null}
      {showMarkAsPaid ? (
        <PrimaryAction
          size={unpaidPrimarySize}
          fullWidth={unpaidPrimaryFullWidth}
          onClick={() => onMarkAsPaid?.(target)}
        >
          {labels.markAsPaid}
        </PrimaryAction>
      ) : null}
    </Box>
  );
}
