"use client";

import { AddCardOutlined } from "@mui/icons-material";
import { Box, Fab, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { PageContainer, PageHeader } from "@/frontend/components/ui";
import { BillingMetricsRow } from "./components/BillingMetricsRow";
import { BillingMobileSearchBar } from "./components/BillingMobileSearchBar";
import { ParentInvoicesCardList } from "./components/ParentInvoicesCardList";
import type { ParentBillingViewProps } from "./types/billingViewTypes";
import { buildParentMetrics } from "./utils/billingMetrics";

// Subtitle text for the empty state, styled with secondary text color
const StyledEmptySubtitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

// Floating action button for quick pay, fixed at bottom-right with uppercase text
const StyledQuickPayFab = styled(Fab)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.onPrimary,
  position: "fixed",
  bottom: theme.spacing(3),
  right: theme.spacing(3),
  zIndex: theme.zIndex.speedDial,
  textTransform: "uppercase",
  fontWeight: 700,
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
  },
}));

export function ParentBillingMobileView({
  labels,
  summary,
  invoices,
  searchQuery,
  canView,
  canManage,
  onSearchChange,
  onPayNow,
  onDownloadPdf,
  onQuickPay,
  page,
  pageSize,
  totalCount,
  onPageChange,
}: Readonly<ParentBillingViewProps>) {
  const showQuickPayFab = canView && !canManage;

  return (
    <>
      <PageContainer>
        <PageHeader title={labels.parentPageTitle} subtitle={labels.parentPageSubtitle} titleVariant="headlineMd" />
        <BillingMetricsRow metrics={buildParentMetrics(summary, labels)} compact />
        <BillingMobileSearchBar
          value={searchQuery}
          placeholder={labels.search.parentPlaceholder}
          filterLabel={labels.search.filter}
          onChange={onSearchChange}
        />
        <Typography variant="titleLg">{labels.sections.invoiceHistory}</Typography>
        {invoices.length === 0 ? (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <Typography variant="headlineMd" sx={{ mb: 1 }}>
              {labels.parentTable.emptyTitle}
            </Typography>
            <StyledEmptySubtitle variant="bodyMd">{labels.parentTable.emptySubtitle}</StyledEmptySubtitle>
          </Box>
        ) : (
          <ParentInvoicesCardList
            rows={invoices}
            canView={canView}
            onPayNow={onPayNow}
            onDownloadPdf={onDownloadPdf}
            labels={{
              viewDetails: labels.parentTable.viewDetails,
              downloadPdf: labels.parentTable.downloadPdf,
              payNow: labels.parentTable.payNow,
              statusLabels: labels.invoiceStatus,
            }}
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={onPageChange}
          />
        )}
      </PageContainer>
      {showQuickPayFab && (
        <StyledQuickPayFab variant="extended" aria-label={labels.quickPay} onClick={onQuickPay}>
          <AddCardOutlined sx={{ mr: 1 }} />
          {labels.quickPay}
        </StyledQuickPayFab>
      )}
    </>
  );
}
