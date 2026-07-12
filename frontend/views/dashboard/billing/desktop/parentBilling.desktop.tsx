"use client";

import { AddCardOutlined } from "@mui/icons-material";
import { Box, Button, TextField } from "@mui/material";
import { PageContainer, PageHeader, SectionPanel } from "@/frontend/components/ui";
import { BillingMetricsRow } from "@/frontend/views/dashboard/billing/components/BillingMetricsRow";
import { ParentInvoicesDataGrid } from "@/frontend/views/dashboard/billing/components/ParentInvoicesDataGrid";
import type { ParentBillingViewModel } from "@/frontend/views/dashboard/billing/useParentBillingViewModel";
import { buildParentMetrics } from "@/frontend/views/dashboard/billing/utils/billingMetrics";
import { getParentInvoiceGridLabels } from "@/frontend/views/dashboard/billing/utils/label-mappers";

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
    <PageContainer>
      <PageHeader title={labels.parentPageTitle} subtitle={labels.parentPageSubtitle} />
      <BillingMetricsRow metrics={parentMetrics} loading={summaryLoading} />
      <SectionPanel
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
        <ParentInvoicesDataGrid
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
      </SectionPanel>
    </PageContainer>
  );
}
