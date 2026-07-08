"use client";

import { DownloadOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Box, IconButton, Paper, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { PaginationControls, PrimaryPageAction, StatusBadge } from "@/frontend/components/ui";
import { InvoiceStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import type { ParentInvoiceRow } from "../types/parentBillingTypes";

interface ParentInvoicesCardListLabels {
  readonly viewDetails: string;
  readonly downloadPdf: string;
  readonly payNow: string;
  readonly statusLabels: Record<InvoiceStatus, string>;
}

interface ParentInvoicesCardListProps {
  readonly rows: readonly ParentInvoiceRow[];
  readonly labels: ParentInvoicesCardListLabels;
  readonly canView: boolean;
  readonly onPayNow: (id: string) => void;
  readonly onDownloadPdf: (id: string) => void;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
}

// Invoice card with outline border and surface background for mobile card list
const StyledInvoiceCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.layout.radius.card,
  border: `1px solid ${theme.palette.outlineVariant}`,
  backgroundColor: theme.palette.surfaceContainerLowest,
}));

// Month label styled with secondary text color for subdued appearance
const StyledMonthTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

// Fee label styled with secondary text color for subdued appearance
const StyledFeeLabelTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

// Container for action icon buttons aligned at the end of a row
const StyledActionsContainer = styled(Box)({
  display: "flex",
  justifyContent: "flex-end",
});

export function ParentInvoicesCardList({
  rows,
  labels,
  canView,
  onPayNow,
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
            <StatusBadge category="invoice" status={row.status} label={labels.statusLabels[row.status]} />
          </Box>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, mb: 1.5 }}>
            <StyledFeeLabelTypography variant="labelMd">{row.issueDate}</StyledFeeLabelTypography>
            <Typography variant="labelMd" sx={{ textAlign: "end", fontWeight: 700 }}>
              {row.fee}
            </Typography>
          </Box>
          {canView && row.status === InvoiceStatus.Unpaid && (
            <PrimaryPageAction
              fullWidth
              onClick={() => {
                onPayNow(row.id);
              }}
            >
              {labels.payNow}
            </PrimaryPageAction>
          )}
          {canView && row.status === InvoiceStatus.Paid && (
            <StyledActionsContainer sx={{ gap: 0.5 }}>
              <IconButton size="small" aria-label={labels.viewDetails}>
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
          )}
        </StyledInvoiceCard>
      ))}
      {showPagination && (
        <PaginationControls
          page={page}
          pageCount={pageCount}
          rowCount={totalCount}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      )}
    </Box>
  );
}
