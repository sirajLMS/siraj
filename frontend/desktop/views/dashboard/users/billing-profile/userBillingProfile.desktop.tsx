"use client";

import { AddCardOutlined } from "@mui/icons-material";
import { Box, Button, TextField } from "@mui/material";
import { getParentInvoiceGridLabels } from "@/frontend/common/views/dashboard/billing/utils/label-mappers";
import type { UserBillingProfileViewModel } from "@/frontend/common/views/dashboard/users/billing-profile/useUserBillingProfileViewModel";
import {
  DesktopPageContainer,
  DesktopPageHeader,
  DesktopSectionPanel,
} from "@/frontend/desktop/components/ui/container/page";
import { BillingMetricsRowDesktop } from "@/frontend/desktop/views/dashboard/billing/components/billingMetricsRow.desktop";
import { ParentInvoicesDataGridDesktop } from "@/frontend/desktop/views/dashboard/billing/components/parentInvoicesDataGrid.desktop";

export function UserBillingProfileDesktopView({
  labels,
  metrics,
  summaryLoading = false,
  invoices,
  searchQuery,
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
  loading,
  isSearchPending = false,
  userId,
}: Readonly<UserBillingProfileViewModel>) {
  const listLoading = isSearchPending || (loading && invoices.length === 0);

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={labels.billingProfileTitle} subtitle={labels.profileForUser(userId)} />
      <BillingMetricsRowDesktop metrics={metrics} loading={summaryLoading} />
      <DesktopSectionPanel
        title={labels.sections.invoiceHistory}
        subTitle={labels.sections.invoiceHistorySubtitle}
        actions={
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
            {canSubmitProof && !billingActionsDisabled ? (
              <Button
                variant="contained"
                startIcon={<AddCardOutlined />}
                onClick={onQuickPay}
                sx={{ textTransform: "uppercase", fontWeight: 700 }}
              >
                {labels.quickPay}
              </Button>
            ) : null}
            <TextField
              size="small"
              value={searchQuery}
              onChange={event => {
                onSearchChange(event.target.value);
              }}
              placeholder={labels.search.parentPlaceholder}
              helperText={isSearchPending ? labels.search.searching : undefined}
              slotProps={{ htmlInput: { autoComplete: "off" } }}
            />
          </Box>
        }
      >
        <ParentInvoicesDataGridDesktop
          rows={invoices}
          canView={canView}
          canSubmitProof={canSubmitProof}
          canManage={canManage}
          billingActionsDisabled={billingActionsDisabled}
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
          loading={listLoading}
        />
      </DesktopSectionPanel>
    </DesktopPageContainer>
  );
}
