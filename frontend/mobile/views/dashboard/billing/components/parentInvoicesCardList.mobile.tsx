"use client";

import { Box, Typography } from "@mui/material";
import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { InvoiceStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type {
  BaseParentInvoicesListProps,
  ParentInvoicesCardListMobileLabels,
} from "@/frontend/common/views/dashboard/billing/types/parentInvoiceList.types";
import { MobileCardListItem, MobileStatusBadge } from "@/frontend/mobile/components/ui";
import { MobileCardList } from "@/frontend/mobile/components/ui/container/MobileCardList";
import { ParentInvoiceRowActionsMobile } from "@/frontend/mobile/views/dashboard/billing/components/parentInvoiceRowActions.mobile";

// VARIANT JUSTIFICATION: extra field labels — card list tier carries card-shaped labels (withPaymentproofHint + statusLabels); desktop data-grid uses a different labels shape
interface ParentInvoicesCardListMobileProps extends Omit<
  BaseParentInvoicesListProps,
  "page" | "pageSize" | "totalCount" | "onPageChange"
> {
  readonly labels: ParentInvoicesCardListMobileLabels;
  readonly paginationOptions: ListPaginationOptions;
}

export function ParentInvoicesCardListMobile({
  rows,
  labels,
  canView,
  canSubmitProof,
  canManage = false,
  billingActionsDisabled = false,
  loading = false,
  onPayNow,
  onMarkAsPaid,
  onViewPaymentDetails,
  onDownloadPdf,
  paginationOptions,
}: Readonly<ParentInvoicesCardListMobileProps>) {
  return (
    <MobileCardList
      rows={rows}
      loading={loading}
      getKey={row => row.id}
      paginationOptions={paginationOptions}
      layout="edge-to-edge"
      renderItem={row => (
        <MobileCardListItem variant="edge-to-edge">
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
            <Box>
              <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
                {row.invoiceNumber}
              </Typography>
              <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
                {row.month}
              </Typography>
            </Box>
            <MobileStatusBadge
              category="invoice"
              status={row.status}
              label={labels.statusLabels[row.status] ?? row.status}
            />
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, mb: 1.5 }}>
            <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              {row.issueDate}
            </Typography>
            <Typography variant="labelMd" sx={{ textAlign: "end", fontWeight: 700 }}>
              {row.fee}
            </Typography>
          </Box>
          {row.status === InvoiceStatus.Paid && row.hasPaymentProof ? (
            <Typography variant="labelMd" sx={{ color: "text.secondary", mb: 1 }}>
              {labels.hasPaymentProofHint}
            </Typography>
          ) : null}
          <ParentInvoiceRowActionsMobile
            row={row}
            labels={{
              payNow: labels.payNow,
              viewSubmission: labels.viewSubmission,
              viewFeedback: labels.viewFeedback,
              viewDetails: labels.viewDetails,
              downloadPdf: labels.downloadPdf,
              markAsPaid: labels.markAsPaid,
            }}
            canView={canView}
            canSubmitProof={canSubmitProof}
            canManage={canManage}
            billingActionsDisabled={billingActionsDisabled}
            onPayNow={onPayNow}
            onMarkAsPaid={onMarkAsPaid}
            onViewPaymentDetails={onViewPaymentDetails}
            onDownloadPdf={onDownloadPdf}
          />
        </MobileCardListItem>
      )}
    />
  );
}
