"use client";

import { AddCardOutlined } from "@mui/icons-material";
import { Box, Button, TextField } from "@mui/material";
import type { BillingSectionSharedProps } from "@/frontend/common/views/dashboard/billing/types/billingSection.types";
import { buildParentMetrics } from "@/frontend/common/views/dashboard/billing/utils/billingMetrics";
import { getParentInvoiceGridLabels } from "@/frontend/common/views/dashboard/billing/utils/label-mappers";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui";
import { BillingMetricsRowDesktop } from "@/frontend/desktop/views/dashboard/billing/components/billingMetricsRow.desktop";
import { ParentInvoicesDataGridDesktop } from "@/frontend/desktop/views/dashboard/billing/components/parentInvoicesDataGrid.desktop";

export type BillingSectionDesktopProps = BillingSectionSharedProps;

/**
 * Shared desktop billing section: metrics row + section panel with
 * QuickPay button + search field + parent invoices data grid.
 * Consumed by both `ParentBillingDesktopView` and `UserBillingProfileDesktopView`.
 */
export function BillingSectionDesktop({
  labels,
  summary,
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
}: Readonly<BillingSectionDesktopProps>) {
  const metrics = buildParentMetrics(summary, labels);
  const listLoading = isSearchPending || (loading && invoices.length === 0);

  return (
    <>
      <BillingMetricsRowDesktop metrics={metrics} loading={summaryLoading} />
      <DesktopSectionPanel
        contentPadding={false}
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
    </>
  );
}
