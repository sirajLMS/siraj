"use client";

import { AddCardOutlined } from "@mui/icons-material";
import { Box, Button, TextField } from "@mui/material";
import type { ParentBillingViewModel } from "@/frontend/common/views/dashboard/billing/useParentBillingViewModel";
import { buildParentMetrics } from "@/frontend/common/views/dashboard/billing/utils/billingMetrics";
import { getParentInvoiceGridLabels } from "@/frontend/common/views/dashboard/billing/utils/label-mappers";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui";
import { BillingMetricsRowDesktop } from "@/frontend/desktop/views/dashboard/billing/components/billingMetricsRow.desktop";
import { ParentInvoicesDataGridDesktop } from "@/frontend/desktop/views/dashboard/billing/components/parentInvoicesDataGrid.desktop";

export function ParentBillingDesktopView({
  labels,
  summary,
  summaryLoading = false,
  invoices,
  searchQuery,
  loading,
  isSearchPending = false,
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
}: Readonly<ParentBillingViewModel>) {
  const parentMetrics = buildParentMetrics(summary, labels);
  const listLoading = isSearchPending || (loading && invoices.length === 0);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <BillingMetricsRowDesktop metrics={parentMetrics} loading={summaryLoading} />
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
    </Box>
  );
}
