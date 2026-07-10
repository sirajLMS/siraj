"use client";

import { DownloadOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Box, Button, IconButton, Tooltip } from "@mui/material";
import { PrimaryPageAction } from "@/frontend/components/ui";
import { InvoiceStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import type {
  MarkPaidInvoiceTarget,
  PaymentDetailsTarget,
} from "@/frontend/views/dashboard/billing/types/billingViewTypes";
import type { ParentInvoiceRow } from "@/frontend/views/dashboard/billing/types/parentBillingTypes";

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
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
        <Tooltip title={labels.viewDetails}>
          <IconButton size="small" aria-label={labels.viewDetails} onClick={openDetails}>
            <VisibilityOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={labels.downloadPdf}>
          <IconButton size="small" aria-label={labels.downloadPdf} onClick={() => onDownloadPdf(row.id)}>
            <DownloadOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  if (row.status === InvoiceStatus.PaymentPending) {
    const button = (
      <PrimaryPageAction
        size={layout === "stacked" ? "medium" : "small"}
        fullWidth={layout === "stacked"}
        onClick={openDetails}
      >
        {labels.viewSubmission}
      </PrimaryPageAction>
    );
    return layout === "stacked" ? button : <Box sx={{ display: "flex", justifyContent: "flex-end" }}>{button}</Box>;
  }

  const showPayNow = row.status === InvoiceStatus.Unpaid && canSubmitProof && !billingActionsDisabled;
  const showMarkAsPaid = row.status === InvoiceStatus.Unpaid && canManage && !billingActionsDisabled;
  const showViewFeedback = row.status === InvoiceStatus.Unpaid && row.hasRejectedSubmission;

  if (!showPayNow && !showMarkAsPaid && !showViewFeedback) {
    return null;
  }

  if (layout === "stacked") {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {showViewFeedback ? (
          <Button variant="outlined" fullWidth onClick={openDetails}>
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
        <Button size="small" variant="outlined" onClick={openDetails}>
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
