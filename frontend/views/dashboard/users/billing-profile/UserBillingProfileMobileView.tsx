"use client";

import { AddCardOutlined } from "@mui/icons-material";
import { Box, Fab, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { PageContainer, PageHeader, SectionPanel } from "@/frontend/components/ui";
import { BillingMetricsRow } from "@/frontend/views/dashboard/billing/components/BillingMetricsRow";
import { BillingMobileSearchBar } from "@/frontend/views/dashboard/billing/components/BillingMobileSearchBar";
import { ParentInvoicesCardList } from "@/frontend/views/dashboard/billing/components/ParentInvoicesCardList";
import type { UserBillingProfileMobileViewProps } from "@/frontend/views/dashboard/users/billing-profile/types/userBillingProfile.types";

const StyledEmptySubtitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

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

export function UserBillingProfileMobileView({
  labels,
  metrics,
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
}: Readonly<UserBillingProfileMobileViewProps>) {
  const showQuickPayFab = canView && !canManage;

  return (
    <>
      <PageContainer>
        <PageHeader title={labels.billingProfileTitle} subtitle={labels.profileForUser} titleVariant="headlineMd" />
        <BillingMetricsRow metrics={metrics} compact />
        <BillingMobileSearchBar
          value={searchQuery}
          placeholder={labels.search.parentPlaceholder}
          filterLabel={labels.search.filter}
          onChange={onSearchChange}
        />
        <SectionPanel title={labels.sections.invoiceHistory}>
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
        </SectionPanel>
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
