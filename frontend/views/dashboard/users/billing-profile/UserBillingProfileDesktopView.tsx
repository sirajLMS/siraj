"use client";

import { FilterListOutlined } from "@mui/icons-material";
import { Box, CircularProgress, TextField } from "@mui/material";
import { useRef } from "react";
import { FilterButton, PageContainer, PageHeader, SectionPanel } from "@/frontend/components/ui";
import { BillingMetricsRow } from "@/frontend/views/dashboard/billing/components/BillingMetricsRow";
import { ParentInvoicesDataGrid } from "@/frontend/views/dashboard/billing/components/ParentInvoicesDataGrid";
import { getParentInvoiceGridLabels } from "@/frontend/views/dashboard/billing/utils/label-mappers";
import type { UserBillingProfileDesktopViewProps } from "@/frontend/views/dashboard/users/billing-profile/types/userBillingProfile.types";

export function UserBillingProfileDesktopView({
  labels,
  metrics,
  invoices,
  searchQuery,
  canView,
  onSearchChange,
  onPayNow,
  onDownloadPdf,
  page,
  pageSize,
  totalCount,
  onPageChange,
  loading,
}: Readonly<UserBillingProfileDesktopViewProps>) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  return (
    <PageContainer>
      <PageHeader title={labels.billingProfileTitle} subtitle={labels.profileForUser} />
      <BillingMetricsRow metrics={metrics} />
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
              inputRef={searchInputRef}
            />
            <FilterButton startIcon={<FilterListOutlined />} onClick={() => searchInputRef.current?.focus()}>
              {labels.search.filter}
            </FilterButton>
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
        />
      </SectionPanel>
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
    </PageContainer>
  );
}
