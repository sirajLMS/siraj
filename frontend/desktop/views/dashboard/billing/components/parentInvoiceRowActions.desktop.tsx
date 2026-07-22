"use client";

import { DownloadOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Box, Button, IconButton, Tooltip } from "@mui/material";
import { InvoiceStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { MarkPaidInvoiceTarget } from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";
import type {
  ParentInvoiceRowActionLabels,
  ParentInvoiceRowActionsProps,
} from "@/frontend/common/views/dashboard/billing/types/parentInvoiceList.types";
import {
  isPayableUnpaidStatus,
  shouldShowViewRejection,
} from "@/frontend/common/views/dashboard/billing/utils/invoiceDisplayStatus";
import { buildInvoiceTarget } from "@/frontend/common/views/dashboard/billing/utils/parentInvoiceFormatters";
import { DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui";

function PaidRowActionsDesktop({
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

function PaymentPendingRowActionsDesktop({
  labels,
  onOpenDetails,
}: {
  readonly labels: ParentInvoiceRowActionLabels;
  readonly onOpenDetails: () => void;
}): React.ReactNode {
  return (
    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
      <DesktopPrimaryPageAction size="small" onClick={onOpenDetails}>
        {labels.viewSubmission}
      </DesktopPrimaryPageAction>
    </Box>
  );
}

function UnpaidRowActionsDesktop({
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
    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, flexWrap: "wrap" }}>
      {showViewFeedback ? (
        <Button size="small" variant="outlined" onClick={onOpenDetails}>
          {labels.viewFeedback}
        </Button>
      ) : null}
      {showPayNow ? (
        <DesktopPrimaryPageAction size="small" onClick={() => onPayNow(target)}>
          {labels.payNow}
        </DesktopPrimaryPageAction>
      ) : null}
      {showMarkAsPaid ? (
        <DesktopPrimaryPageAction size="small" onClick={() => onMarkAsPaid?.(target)}>
          {labels.markAsPaid}
        </DesktopPrimaryPageAction>
      ) : null}
    </Box>
  );
}

export function ParentInvoiceRowActionsDesktop({
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
}: Readonly<ParentInvoiceRowActionsProps>): React.ReactNode {
  if (!canView) {
    return null;
  }

  const target = buildInvoiceTarget(row);
  const openDetails = () => {
    onViewPaymentDetails?.({ invoiceId: row.id });
  };

  if (row.status === InvoiceStatus.Paid) {
    return (
      <PaidRowActionsDesktop
        labels={labels}
        invoiceId={row.id}
        onOpenDetails={openDetails}
        onDownloadPdf={onDownloadPdf}
      />
    );
  }

  if (row.status === InvoiceStatus.PaymentPending) {
    return <PaymentPendingRowActionsDesktop labels={labels} onOpenDetails={openDetails} />;
  }

  const showPayNow = isPayableUnpaidStatus(row.status) && canSubmitProof && !billingActionsDisabled;
  const showMarkAsPaid = isPayableUnpaidStatus(row.status) && canManage && !billingActionsDisabled;
  const showViewFeedback = shouldShowViewRejection(row.status, row.hasRejectedSubmission);

  if (!showPayNow && !showMarkAsPaid && !showViewFeedback) {
    return null;
  }

  return (
    <UnpaidRowActionsDesktop
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
