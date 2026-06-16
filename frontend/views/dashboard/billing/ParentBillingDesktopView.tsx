"use client";

import { FilterListOutlined } from "@mui/icons-material";
import { Box, TextField } from "@mui/material";
import { FilterButton, PageContainer, PageHeader, SectionPanel } from "@/frontend/components/ui";
import { BillingMetricsRow } from "./components/BillingMetricsRow";
import { getParentInvoiceGridLabels } from "./components/BillingSearchBar";
import { ParentInvoicesDataGrid } from "./components/ParentInvoicesDataGrid";
import type { ParentBillingViewProps } from "./types/billingViewTypes";
import { buildParentMetrics } from "./utils/billingMetrics";

export function ParentBillingDesktopView({
  labels,
  summary,
  invoices,
  searchQuery,
  canView,
  onSearchChange,
  onPayNow,
  onDownloadPdf,
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
        />
      </SectionPanel>
    </PageContainer>
  );
}
