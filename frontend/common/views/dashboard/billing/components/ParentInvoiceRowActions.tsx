"use client";

import { DownloadOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Box, Button, IconButton, Tooltip } from "@mui/material";
import { PrimaryPageAction } from "@/frontend/common/components/ui";
import { InvoiceStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type {
  MarkPaidInvoiceTarget,
  PaymentDetailsTarget,
} from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";
import type { ParentInvoiceRow } from "@/frontend/common/views/dashboard/billing/types/parentBillingTypes";
import {
  isPayableUnpaidStatus,
  shouldShowViewRejection,
} from "@/frontend/common/views/dashboard/billing/utils/invoiceDisplayStatus";

export type ParentInvoiceRowActionLabels = {
  readonly payNow: string;
  readonly viewSubmission: string;
  readonly viewFeedback: string;
  readonly viewDetails: string;
  readonly downloadPdf: string;
  readonly markAsPaid: string;
};

type ParentInvoiceRowActionsProps = {
  readonly row: ParentInvoiceRow;
  readonly labels: ParentInvoiceRowActionLabels;
  readonly canView: boolean;
  readonly canSubmitProof: boolean;
  readonly canManage?: boolean;
  readonly billingActionsDisabled?: boolean;
  readonly layout: "inline" | "stacked";
  readonly onPayNow: (invoice: MarkPaidInvoiceTarget) => void;
  readonly onMarkAsPaid?: (invoice: MarkPaidInvoiceTarget) => void;
  readonly onViewPaymentDetails?: (target: PaymentDetailsTarget) => void;
  readonly onDownloadPdf: (id: string) => void;
};

function buildInvoiceTarget(row: ParentInvoiceRow): MarkPaidInvoiceTarget {
  return {
    id: row.id,
    amount: row.fee,
    dueDate: row.dueDate,
    invoiceNumber: row.invoiceNumber,
  };
}

function PaidRowActions({
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

function PaymentPendingRowActions({
  labels,
  layout,
  onOpenDetails,
}: {
  readonly labels: ParentInvoiceRowActionLabels;
  readonly layout: "inline" | "stacked";
  readonly onOpenDetails: () => void;
}): React.ReactNode {
  const button = (
    <PrimaryPageAction
      size={layout === "stacked" ? "medium" : "small"}
      fullWidth={layout === "stacked"}
      onClick={onOpenDetails}
    >
      {labels.viewSubmission}
    </PrimaryPageAction>
  );
  return layout === "stacked" ? button : <Box sx={{ display: "flex", justifyContent: "flex-end" }}>{button}</Box>;
}

function UnpaidRowActions({
  labels,
  layout,
  target,
  showPayNow,
  showMarkAsPaid,
  showViewFeedback,
  onOpenDetails,
  onPayNow,
  onMarkAsPaid,
}: {
  readonly labels: ParentInvoiceRowActionLabels;
  readonly layout: "inline" | "stacked";
  readonly target: MarkPaidInvoiceTarget;
  readonly showPayNow: boolean;
  readonly showMarkAsPaid: boolean;
  readonly showViewFeedback: boolean;
  readonly onOpenDetails: () => void;
  readonly onPayNow: (invoice: MarkPaidInvoiceTarget) => void;
  readonly onMarkAsPaid?: (invoice: MarkPaidInvoiceTarget) => void;
}): React.ReactNode {
  if (layout === "stacked") {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {showViewFeedback ? (
          <Button variant="outlined" fullWidth onClick={onOpenDetails}>
            {labels.viewFeedback}
          </Button>
        ) : null}
        {showPayNow ? (
          <PrimaryPageAction fullWidth onClick={() => onPayNow(target)}>
            {labels.payNow}
          </PrimaryPageAction>
        ) : null}
        {showMarkAsPaid ? (
          <PrimaryPageAction fullWidth onClick={() => onMarkAsPaid?.(target)}>
            {labels.markAsPaid}
          </PrimaryPageAction>
        ) : null}
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, flexWrap: "wrap" }}>
      {showViewFeedback ? (
        <Button size="small" variant="outlined" onClick={onOpenDetails}>
          {labels.viewFeedback}
        </Button>
      ) : null}
      {showPayNow ? (
        <PrimaryPageAction size="small" onClick={() => onPayNow(target)}>
          {labels.payNow}
        </PrimaryPageAction>
      ) : null}
      {showMarkAsPaid ? (
        <PrimaryPageAction size="small" onClick={() => onMarkAsPaid?.(target)}>
          {labels.markAsPaid}
        </PrimaryPageAction>
      ) : null}
    </Box>
  );
}

export function ParentInvoiceRowActions({
  row,
  labels,
  canView,
  canSubmitProof,
  canManage = false,
  billingActionsDisabled = false,
  layout,
  onPayNow,
  onMarkAsPaid,
  onViewPaymentDetails,
  onDownloadPdf,
}: ParentInvoiceRowActionsProps): React.ReactNode {
  if (!canView) {
    return null;
  }

  const target = buildInvoiceTarget(row);
  const openDetails = () => {
    onViewPaymentDetails?.({ invoiceId: row.id });
  };

  if (row.status === InvoiceStatus.Paid) {
    return (
      <PaidRowActions labels={labels} invoiceId={row.id} onOpenDetails={openDetails} onDownloadPdf={onDownloadPdf} />
    );
  }

  if (row.status === InvoiceStatus.PaymentPending) {
    return <PaymentPendingRowActions labels={labels} layout={layout} onOpenDetails={openDetails} />;
  }

  const showPayNow = isPayableUnpaidStatus(row.status) && canSubmitProof && !billingActionsDisabled;
  const showMarkAsPaid = isPayableUnpaidStatus(row.status) && canManage && !billingActionsDisabled;
  const showViewFeedback = shouldShowViewRejection(row.status, row.hasRejectedSubmission);

  if (!showPayNow && !showMarkAsPaid && !showViewFeedback) {
    return null;
  }

  return (
    <UnpaidRowActions
      labels={labels}
      layout={layout}
      target={target}
      showPayNow={showPayNow}
      showMarkAsPaid={showMarkAsPaid}
      showViewFeedback={showViewFeedback}
      onOpenDetails={openDetails}
      onPayNow={onPayNow}
      onMarkAsPaid={onMarkAsPaid}
    />
  );
}
