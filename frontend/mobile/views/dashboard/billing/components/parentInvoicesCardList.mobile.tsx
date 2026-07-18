"use client";

import { Box, CircularProgress, Paper, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { InvoiceStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type {
  BaseParentInvoicesListProps,
  ParentInvoicesCardListMobileLabels,
} from "@/frontend/common/views/dashboard/billing/types/parentInvoiceList.types";
import { MobilePaginationControls, MobileStatusBadge } from "@/frontend/mobile/components/ui";
import { ParentInvoiceRowActionsMobile } from "@/frontend/mobile/views/dashboard/billing/components/parentInvoiceRowActions.mobile";

// VARIANT JUSTIFICATION: extra field labels — card list tier carries card-shaped labels (withPaymentproofHint + statusLabels); desktop data-grid uses a different labels shape
interface ParentInvoicesCardListMobileProps extends BaseParentInvoicesListProps {
  readonly labels: ParentInvoicesCardListMobileLabels;
}

const StyledInvoiceCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.layout.radius.card,
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
  page = 0,
  pageSize = 10,
  totalCount,
  onPageChange,
}: Readonly<ParentInvoicesCardListMobileProps>) {
  const showPagination = totalCount !== undefined && onPageChange !== undefined && totalCount > 0;
  const pageCount = pageSize > 0 ? Math.ceil((totalCount ?? 0) / pageSize) : 0;

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
            borderRadius: 1,
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
        {showPagination ? (
          <MobilePaginationControls
            page={page + 1}
            pageCount={pageCount}
            rowCount={totalCount}
            pageSize={pageSize}
            onPageChange={onPageChange}
          />
        ) : null}
      </Box>
    </Box>
  );
}
