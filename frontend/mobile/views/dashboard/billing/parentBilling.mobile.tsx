"use client";

import { AddCardOutlined } from "@mui/icons-material";
import { Typography } from "@mui/material";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type { ParentBillingViewModel } from "@/frontend/common/views/dashboard/billing/useParentBillingViewModel";
import { buildParentMetrics } from "@/frontend/common/views/dashboard/billing/utils/billingMetrics";
import { getParentInvoiceGridLabels } from "@/frontend/common/views/dashboard/billing/utils/label-mappers";
import {
  MobileContentStack,
  MobileEmptyState,
  MobileFab,
  MobilePageContainer,
  MobilePageHeader,
} from "@/frontend/mobile/components/ui";
import { BillingMetricsRowMobile } from "@/frontend/mobile/views/dashboard/billing/components/billingMetricsRow.mobile";
import { BillingMobileSearchBarMobile } from "@/frontend/mobile/views/dashboard/billing/components/billingMobileSearchBar.mobile";
import { ParentInvoicesCardListMobile } from "@/frontend/mobile/views/dashboard/billing/components/parentInvoicesCardList.mobile";

export function ParentBillingMobileView({
  labels,
  summary,
  summaryLoading = false,
  invoices,
  searchQuery,
  loading,
  canView,
  canSubmitProof,
  canManage,
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
}: Readonly<ParentBillingViewModel>) {
  const showQuickPayFab = canSubmitProof && !billingActionsDisabled;
  const parentMetrics = buildParentMetrics(summary, labels);
  const listLoading = isSearchPending || (loading && invoices.length === 0);

  return (
    <>
      <MobilePageContainer>
        <MobilePageHeader title={labels.parentPageTitle} subtitle={labels.parentPageSubtitle} edgeToEdge={false} />

        <MobileContentStack gap={3} paddingBottom={4}>
          <BillingMetricsRowMobile metrics={parentMetrics} compact loading={summaryLoading} />
          <BillingMobileSearchBarMobile
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
            <ParentInvoicesCardListMobile
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
              paginationOptions={
                totalCount !== undefined && onPageChange !== undefined
                  ? buildServerPaginationOptions({
                      page: page ?? 0,
                      pageSize: pageSize ?? 10,
                      totalCount,
                      onPageChange,
                    })
                  : false
              }
            />
          )}
        </MobileContentStack>
      </MobilePageContainer>
      {showQuickPayFab ? <MobileFab icon={<AddCardOutlined />} label={labels.quickPay} onClick={onQuickPay} /> : null}
    </>
  );
}
