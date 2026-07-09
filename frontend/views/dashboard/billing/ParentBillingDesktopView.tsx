"use client";

import { FilterListOutlined } from "@mui/icons-material";
import { Box, TextField } from "@mui/material";
import { FilterButton, PageContainer, PageHeader, SectionPanel } from "@/frontend/components/ui";
import { BillingMetricsRow } from "@/frontend/views/dashboard/billing/components/BillingMetricsRow";
import { ParentInvoicesDataGrid } from "@/frontend/views/dashboard/billing/components/ParentInvoicesDataGrid";
import type { ParentBillingViewProps } from "@/frontend/views/dashboard/billing/types/billingViewTypes";
import { buildParentMetrics } from "@/frontend/views/dashboard/billing/utils/billingMetrics";
import { getParentInvoiceGridLabels } from "@/frontend/views/dashboard/billing/utils/label-mappers";

export function ParentBillingDesktopView({
  labels,
  summary,
  invoices,
  searchQuery,
  loading,
  canView,
  onSearchChange,
  onPayNow,
  onDownloadPdf,
  page,
  pageSize,
  totalCount,
  onPageChange,
}: Readonly<ParentBillingViewProps>) {
  return (
    <PageContainer>
      <PageHeader title={labels.parentPageTitle} subtitle={labels.parentPageSubtitle} />
      <BillingMetricsRow metrics={buildParentMetrics(summary, labels)} />
      <SectionPanel
        title={labels.sections.invoiceHistory}
        subTitle={labels.sections.invoiceHistorySubtitle}
        actions={
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
            <TextField
              size="small"
              value={searchQuery}
              onChange={event => {
                onSearchChange(event.target.value);
              }}
              placeholder={labels.search.parentPlaceholder}
              slotProps={{ htmlInput: { autoComplete: "off" } }}
            />
            <FilterButton startIcon={<FilterListOutlined />}>{labels.search.filter}</FilterButton>
          </Box>
        }
      >
        <ParentInvoicesDataGrid
          rows={invoices}
          canView={canView}
          onPayNow={onPayNow}
          onDownloadPdf={onDownloadPdf}
          labels={getParentInvoiceGridLabels(labels)}
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={onPageChange}
          loading={loading}
        />
      </SectionPanel>
    </PageContainer>
  );
}
