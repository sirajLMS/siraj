"use client";

import { AddCardOutlined } from "@mui/icons-material";
import { Typography } from "@mui/material";
import { PageContainer } from "@/frontend/common/components/ui";
import { BillingMetricsRow } from "@/frontend/common/views/dashboard/billing/components/BillingMetricsRow";
import { BillingMobileSearchBar } from "@/frontend/common/views/dashboard/billing/components/BillingMobileSearchBar";
import { ParentInvoicesCardList } from "@/frontend/common/views/dashboard/billing/components/ParentInvoicesCardList";
import { getParentInvoiceGridLabels } from "@/frontend/common/views/dashboard/billing/utils/label-mappers";
import type { UserBillingProfileViewModel } from "@/frontend/common/views/dashboard/users/billing-profile/useUserBillingProfileViewModel";
import { MobileContentStack, MobileEmptyState, MobileFab, MobilePageHeader } from "@/frontend/mobile/components/ui";

export function UserBillingProfileMobileView({
  labels,
  metrics,
  summaryLoading = false,
  invoices,
  searchQuery,
  loading,
  canView,
  canSubmitProof,
  canManage = false,
  billingActionsDisabled = false,
  onSearchChange,
  onPayNow,
  onMarkAsPaid,
  onViewPaymentDetails,
  onDownloadPdf,
  onQuickPay,
  page,
  pageSize,
  totalCount,
  onPageChange,
  isSearchPending = false,
  userId,
}: Readonly<UserBillingProfileViewModel>) {
  const showQuickPayFab = canSubmitProof && !billingActionsDisabled;
  const listLoading = isSearchPending || (loading && invoices.length === 0);

  return (
    <>
      <PageContainer>
        <MobilePageHeader
          title={labels.billingProfileTitle}
          subtitle={labels.profileForUser(userId)}
          edgeToEdge={false}
        />

        <MobileContentStack gap={3} paddingBottom={4}>
          <BillingMetricsRow metrics={metrics} compact loading={summaryLoading} />
          <BillingMobileSearchBar
            value={searchQuery}
            placeholder={labels.search.parentPlaceholder}
            searchingLabel={labels.search.searching}
            isSearching={isSearchPending}
            onChange={onSearchChange}
          />
          <Typography variant="titleLg">{labels.sections.invoiceHistory}</Typography>
          {invoices.length === 0 && !listLoading ? (
            <MobileEmptyState title={labels.parentTable.emptyTitle} subtitle={labels.parentTable.emptySubtitle} />
          ) : (
            <ParentInvoicesCardList
              rows={invoices}
              canView={canView}
              canSubmitProof={canSubmitProof}
              canManage={canManage}
              billingActionsDisabled={billingActionsDisabled}
              loading={listLoading}
              onPayNow={onPayNow}
              onMarkAsPaid={onMarkAsPaid}
              onViewPaymentDetails={onViewPaymentDetails}
              onDownloadPdf={onDownloadPdf}
              labels={{
                ...getParentInvoiceGridLabels(labels),
                hasPaymentProofHint: labels.hasPaymentProofHint,
              }}
              page={page}
              pageSize={pageSize}
              totalCount={totalCount}
              onPageChange={onPageChange}
            />
          )}
        </MobileContentStack>
      </PageContainer>
      {showQuickPayFab ? <MobileFab icon={<AddCardOutlined />} label={labels.quickPay} onClick={onQuickPay} /> : null}
    </>
  );
}
