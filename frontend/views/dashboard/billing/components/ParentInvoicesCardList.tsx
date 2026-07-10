"use client";

import { DownloadOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Box, IconButton, Paper, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { PaginationControls, PrimaryPageAction, StatusBadge } from "@/frontend/components/ui";
import { InvoiceStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import type {
  MarkPaidInvoiceTarget,
  PaymentDetailsTarget,
} from "@/frontend/views/dashboard/billing/types/billingViewTypes";
import type { ParentInvoiceRow } from "@/frontend/views/dashboard/billing/types/parentBillingTypes";

interface ParentInvoicesCardListLabels {
  readonly viewDetails: string;
  readonly viewSubmission: string;
  readonly downloadPdf: string;
  readonly payNow: string;
  readonly hasPaymentProofHint: string;
  readonly statusLabels: Record<string, string>;
}

interface ParentInvoicesCardListProps {
  readonly rows: readonly ParentInvoiceRow[];
  readonly labels: ParentInvoicesCardListLabels;
  readonly canView: boolean;
  readonly canSubmitProof: boolean;
  readonly onPayNow: (invoice: MarkPaidInvoiceTarget) => void;
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

const StyledActionsContainer = styled(Box)({
  display: "flex",
  justifyContent: "flex-end",
});

export function ParentInvoicesCardList({
  rows,
  labels,
  canView,
  canSubmitProof,
  onPayNow,
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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {rows.map(row => (
        <StyledInvoiceCard key={row.id} elevation={0}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
            <Box>
              <Typography variant="titleLg" sx={{ fontWeight: 700 }}>
                {row.invoiceNumber}
              </Typography>
              <StyledMonthTypography variant="bodyMd">{row.month}</StyledMonthTypography>
            </Box>
            <StatusBadge category="invoice" status={row.status} label={labels.statusLabels[row.status] ?? row.status} />
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
          {canView && row.status === InvoiceStatus.Unpaid && canSubmitProof ? (
            <PrimaryPageAction
              fullWidth
              onClick={() => {
                onPayNow({
                  id: row.id,
                  amount: row.fee,
                  dueDate: row.dueDate,
                  invoiceNumber: row.invoiceNumber,
                });
              }}
            >
              {labels.payNow}
            </PrimaryPageAction>
          ) : null}
          {canView && row.status === InvoiceStatus.PaymentPending ? (
            <PrimaryPageAction
              fullWidth
              onClick={() => {
                onViewPaymentDetails?.({ invoiceId: row.id });
              }}
            >
              {labels.viewSubmission}
            </PrimaryPageAction>
          ) : null}
          {canView && row.status === InvoiceStatus.Paid ? (
            <StyledActionsContainer sx={{ gap: 0.5 }}>
              <IconButton
                size="small"
                aria-label={labels.viewDetails}
                onClick={() => {
                  onViewPaymentDetails?.({ invoiceId: row.id });
                }}
              >
                <VisibilityOutlined fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                aria-label={labels.downloadPdf}
                onClick={() => {
                  onDownloadPdf(row.id);
                }}
              >
                <DownloadOutlined fontSize="small" />
              </IconButton>
            </StyledActionsContainer>
          ) : null}
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
  );
}
