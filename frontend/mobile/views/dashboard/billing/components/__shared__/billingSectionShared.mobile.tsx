"use client";

import { AddCardOutlined } from "@mui/icons-material";
import { Typography } from "@mui/material";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type {
  MarkPaidInvoiceTarget,
  PaymentDetailsTarget,
} from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";
import type {
  ParentBillingSummary,
  ParentInvoiceRow,
} from "@/frontend/common/views/dashboard/billing/types/parentBillingTypes";
import type { buildParentMetrics } from "@/frontend/common/views/dashboard/billing/utils/billingMetrics";
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
import type { BillingLabels } from "@/shared/locale";

export interface BillingSectionMobileProps {
  readonly labels: BillingLabels;
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly metrics: ReturnType<typeof buildParentMetrics>;
  readonly summary: ParentBillingSummary;
  readonly summaryLoading?: boolean;
  readonly invoices: readonly ParentInvoiceRow[];
  readonly searchQuery: string;
  readonly loading?: boolean;
  readonly isSearchPending?: boolean;
  readonly canView: boolean;
  readonly canSubmitProof: boolean;
  readonly canManage: boolean;
  readonly billingActionsDisabled?: boolean;
  readonly onSearchChange: (value: string) => void;
  readonly onPayNow: (invoice: MarkPaidInvoiceTarget) => void;
  readonly onMarkAsPaid?: (invoice: MarkPaidInvoiceTarget) => void;
  readonly onViewPaymentDetails?: (target: PaymentDetailsTarget) => void;
  readonly onDownloadPdf: (id: string) => void;
  readonly onQuickPay: () => void;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
}

/**
 * Shared mobile billing section: page header + metrics row + search bar +
 * invoice history title + parent invoices card list + QuickPay FAB.
 * Consumed by both `ParentBillingMobileView` and `UserBillingProfileMobileView`.
 */
export function BillingSectionMobile({
  labels,
  pageTitle,
  pageSubtitle,
  metrics,
  summaryLoading = false,
  invoices,
  searchQuery,
  loading,
  isSearchPending = false,
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
}: Readonly<BillingSectionMobileProps>) {
  const showQuickPayFab = canSubmitProof && !billingActionsDisabled;
  const listLoading = isSearchPending || (loading && invoices.length === 0);

  return (
    <>
      <MobilePageContainer>
        <MobilePageHeader title={pageTitle} subtitle={pageSubtitle} edgeToEdge={false} />

        <MobileContentStack gap={3} paddingBottom={4}>
          <BillingMetricsRowMobile metrics={metrics} compact loading={summaryLoading} />
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
