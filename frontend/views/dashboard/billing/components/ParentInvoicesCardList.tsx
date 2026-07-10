"use client";

import { Box, CircularProgress, Paper, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { PaginationControls, StatusBadge } from "@/frontend/components/ui";
import { InvoiceStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import { ParentInvoiceRowActions } from "@/frontend/views/dashboard/billing/components/ParentInvoiceRowActions";
import type {
  MarkPaidInvoiceTarget,
  PaymentDetailsTarget,
} from "@/frontend/views/dashboard/billing/types/billingViewTypes";
import type { ParentInvoiceRow } from "@/frontend/views/dashboard/billing/types/parentBillingTypes";

interface ParentInvoicesCardListLabels {
  readonly viewDetails: string;
  readonly viewSubmission: string;
  readonly viewFeedback: string;
  readonly downloadPdf: string;
  readonly payNow: string;
  readonly markAsPaid: string;
  readonly hasPaymentProofHint: string;
  readonly statusLabels: Record<string, string>;
}

interface ParentInvoicesCardListProps {
  readonly rows: readonly ParentInvoiceRow[];
  readonly labels: ParentInvoicesCardListLabels;
  readonly canView: boolean;
  readonly canSubmitProof: boolean;
  readonly canManage?: boolean;
  readonly billingActionsDisabled?: boolean;
  readonly loading?: boolean;
  readonly onPayNow: (invoice: MarkPaidInvoiceTarget) => void;
  readonly onMarkAsPaid?: (invoice: MarkPaidInvoiceTarget) => void;
  readonly onViewPaymentDetails?: (target: PaymentDetailsTarget) => void;
  readonly onDownloadPdf: (id: string) => void;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
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

export function ParentInvoicesCardList({
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
}: Readonly<ParentInvoicesCardListProps>) {
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
              <StatusBadge
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
            <ParentInvoiceRowActions
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
              layout="stacked"
              onPayNow={onPayNow}
              onMarkAsPaid={onMarkAsPaid}
              onViewPaymentDetails={onViewPaymentDetails}
              onDownloadPdf={onDownloadPdf}
            />
          </StyledInvoiceCard>
        ))}
        {showPagination ? (
          <PaginationControls
            page={page}
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
