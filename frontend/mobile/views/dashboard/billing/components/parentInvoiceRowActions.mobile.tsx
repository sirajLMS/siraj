"use client";

import { DownloadOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Box, Button, IconButton, Tooltip } from "@mui/material";
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
import { MobilePrimaryPageAction } from "@/frontend/mobile/components/ui/button";

export type ParentInvoiceRowActionLabels = {
  readonly payNow: string;
  readonly viewSubmission: string;
  readonly viewFeedback: string;
  readonly viewDetails: string;
  readonly downloadPdf: string;
  readonly markAsPaid: string;
};

type ParentInvoiceRowActionsMobileProps = {
  readonly row: ParentInvoiceRow;
  readonly labels: ParentInvoiceRowActionLabels;
  readonly canView: boolean;
  readonly canSubmitProof: boolean;
  readonly canManage?: boolean;
  readonly billingActionsDisabled?: boolean;
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

function PaidRowActionsMobile({
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

function PaymentPendingRowActionsMobile({
  labels,
  onOpenDetails,
}: {
  readonly labels: ParentInvoiceRowActionLabels;
  readonly onOpenDetails: () => void;
}): React.ReactNode {
  return (
    <MobilePrimaryPageAction size="medium" fullWidth onClick={onOpenDetails}>
      {labels.viewSubmission}
    </MobilePrimaryPageAction>
  );
}

function UnpaidRowActionsMobile({
  labels,
  target,
  showPayNow,
  showMarkAsPaid,
  showViewFeedback,
  onOpenDetails,
  onPayNow,
  onMarkAsPaid,
}: {
  readonly labels: ParentInvoiceRowActionLabels;
  readonly target: MarkPaidInvoiceTarget;
  readonly showPayNow: boolean;
  readonly showMarkAsPaid: boolean;
  readonly showViewFeedback: boolean;
  readonly onOpenDetails: () => void;
  readonly onPayNow: (invoice: MarkPaidInvoiceTarget) => void;
  readonly onMarkAsPaid?: (invoice: MarkPaidInvoiceTarget) => void;
}): React.ReactNode {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {showViewFeedback ? (
        <Button variant="outlined" fullWidth onClick={onOpenDetails}>
          {labels.viewFeedback}
        </Button>
      ) : null}
      {showPayNow ? (
        <MobilePrimaryPageAction fullWidth onClick={() => onPayNow(target)}>
          {labels.payNow}
        </MobilePrimaryPageAction>
      ) : null}
      {showMarkAsPaid ? (
        <MobilePrimaryPageAction fullWidth onClick={() => onMarkAsPaid?.(target)}>
          {labels.markAsPaid}
        </MobilePrimaryPageAction>
      ) : null}
    </Box>
  );
}

export function ParentInvoiceRowActionsMobile({
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
}: Readonly<ParentInvoiceRowActionsMobileProps>): React.ReactNode {
  if (!canView) {
    return null;
  }

  const target = buildInvoiceTarget(row);
  const openDetails = () => {
    onViewPaymentDetails?.({ invoiceId: row.id });
  };

  if (row.status === InvoiceStatus.Paid) {
    return (
      <PaidRowActionsMobile
        labels={labels}
        invoiceId={row.id}
        onOpenDetails={openDetails}
        onDownloadPdf={onDownloadPdf}
      />
    );
  }

  if (row.status === InvoiceStatus.PaymentPending) {
    return <PaymentPendingRowActionsMobile labels={labels} onOpenDetails={openDetails} />;
  }

  const showPayNow = isPayableUnpaidStatus(row.status) && canSubmitProof && !billingActionsDisabled;
  const showMarkAsPaid = isPayableUnpaidStatus(row.status) && canManage && !billingActionsDisabled;
  const showViewFeedback = shouldShowViewRejection(row.status, row.hasRejectedSubmission);

  if (!showPayNow && !showMarkAsPaid && !showViewFeedback) {
    return null;
  }

  return (
    <UnpaidRowActionsMobile
      labels={labels}
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
