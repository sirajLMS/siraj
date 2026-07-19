"use client";

import { Box, CircularProgress, Paper, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { InvoiceStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type {
  BaseParentInvoicesListProps,
  ParentInvoicesCardListMobileLabels,
} from "@/frontend/common/views/dashboard/billing/types/parentInvoiceList.types";
import { MobileListPagination, MobileStatusBadge } from "@/frontend/mobile/components/ui";
import { ParentInvoiceRowActionsMobile } from "@/frontend/mobile/views/dashboard/billing/components/parentInvoiceRowActions.mobile";

// VARIANT JUSTIFICATION: extra field labels — card list tier carries card-shaped labels (withPaymentproofHint + statusLabels); desktop data-grid uses a different labels shape
interface ParentInvoicesCardListMobileProps extends Omit<BaseParentInvoicesListProps, "page" | "pageSize" | "totalCount" | "onPageChange"> {
  readonly labels: ParentInvoicesCardListMobileLabels;
  readonly paginationOptions: ListPaginationOptions;
}

const StyledInvoiceCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: 0,
  border: `1px solid ${theme.palette.outlineVariant}`,
  backgroundColor: theme.palette.surfaceContainerLowest,
}));

const StyledMonthTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

const StyledFeeLabelTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

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
    <Box sx={{ position: "relative" }}>
      {loading ? (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "rgba(var(--mui-palette-background-defaultChannel) / 0.6)",
            zIndex: 1,
            borderRadius: 0,
          }}
        >
          <CircularProgress size={28} />
        </Box>
      ) : null}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, opacity: loading ? 0.5 : 1 }}>
        {rows.map(row => (
          <StyledInvoiceCard key={row.id} elevation={0}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
              <Box>
                <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
                  {row.invoiceNumber}
                </Typography>
                <StyledMonthTypography variant="bodyMd">{row.month}</StyledMonthTypography>
              </Box>
              <MobileStatusBadge
                category="invoice"
                status={row.status}
                label={labels.statusLabels[row.status] ?? row.status}
              />
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, mb: 1.5 }}>
              <StyledFeeLabelTypography variant="labelMd">{row.issueDate}</StyledFeeLabelTypography>
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
          </StyledInvoiceCard>
        ))}
        <MobileListPagination paginationOptions={paginationOptions} />
      </Box>
    </Box>
  );
}
