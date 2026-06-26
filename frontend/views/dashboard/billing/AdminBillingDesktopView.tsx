"use client";

import { AddOutlined } from "@mui/icons-material";
import { Box, Button, Chip } from "@mui/material";
import { styled } from "@mui/material/styles";
import { PageContainer, PageHeader, PrimaryPageAction, SectionPanel } from "@/frontend/components/ui";
import { AdminInvoicesDataGrid } from "./components/AdminInvoicesDataGrid";
import { BillingMetricsRow } from "./components/BillingMetricsRow";
import { BillingSearchBar } from "./components/BillingSearchBar";
import { StudentCreditDataGrid } from "./components/StudentCreditDataGrid";
import type { AdminBillingViewProps } from "./types/billingViewTypes";
import { buildAdminMetrics } from "./utils/billingMetrics";
import { getAdminInvoiceGridLabels, getStudentCreditGridLabels } from "./utils/label-mappers";

// Chip indicating items requiring attention, styled with error colors
const StyledAttentionChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.error.main,
  color: theme.palette.onError,
}));

// Footer box for the student credit section with a top border separator
const StyledCreditFooterBox = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  borderTop: `1px solid ${theme.palette.outlineVariant}`,
}));

export function AdminBillingDesktopView({
  labels,
  summary,
  invoices,
  creditRows,
  searchQuery,
  canManage,
  canCreate,
  onSearchChange,
  onMarkAsPaid,
  onSendReminder,
  onManualInvoice,
  page,
  pageSize,
  totalCount,
  onPageChange,
}: Readonly<AdminBillingViewProps>) {
  return (
    <PageContainer>
      <PageHeader
        title={labels.adminPageTitle}
        subtitle={labels.adminPageSubtitle}
        actions={
          canCreate ? (
            <PrimaryPageAction startIcon={<AddOutlined />} onClick={onManualInvoice}>
              {labels.manualInvoice}
            </PrimaryPageAction>
          ) : undefined
        }
      />

      <BillingMetricsRow metrics={buildAdminMetrics(summary, labels)} />

      <SectionPanel
        title={labels.sections.recentInvoices}
        actions={
          <BillingSearchBar
            value={searchQuery}
            placeholder={labels.search.invoicesPlaceholder}
            filterLabel={labels.search.filter}
            onChange={onSearchChange}
          />
        }
      >
        <AdminInvoicesDataGrid
          rows={invoices}
          canManage={canManage}
          onMarkAsPaid={onMarkAsPaid}
          labels={getAdminInvoiceGridLabels(labels)}
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={onPageChange}
        />
      </SectionPanel>

      {canManage && (
        <SectionPanel
          title={labels.sections.studentCreditStatus}
          actions={<StyledAttentionChip label={labels.requiresAttention} size="small" />}
        >
          <StudentCreditDataGrid
            rows={creditRows}
            canManage={canManage}
            onSendReminder={onSendReminder}
            labels={getStudentCreditGridLabels(labels)}
          />
          <StyledCreditFooterBox sx={{ py: 2 }}>
            <Button variant="text" sx={{ fontWeight: 700 }}>
              {labels.viewAllNegativeBalance}
            </Button>
          </StyledCreditFooterBox>
        </SectionPanel>
      )}
    </PageContainer>
  );
}
