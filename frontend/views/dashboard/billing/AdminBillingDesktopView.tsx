"use client";

import { AddOutlined } from "@mui/icons-material";
import { Box, Button, Chip } from "@mui/material";
import { PageContainer, PageHeader, PrimaryPageAction, SectionPanel } from "@/frontend/components/ui";
import { AdminInvoicesDataGrid } from "./components/AdminInvoicesDataGrid";
import { BillingMetricsRow } from "./components/BillingMetricsRow";
import { BillingSearchBar } from "./components/BillingSearchBar";
import { StudentCreditDataGrid } from "./components/StudentCreditDataGrid";
import type { AdminBillingViewProps } from "./types/billingViewTypes";
import { buildAdminMetrics } from "./utils/billingMetrics";
import { getAdminInvoiceGridLabels, getStudentCreditGridLabels } from "./utils/label-mappers";

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
        />
      </SectionPanel>

      {canManage && (
        <SectionPanel
          title={labels.sections.studentCreditStatus}
          actions={
            <Chip
              label={labels.requiresAttention}
              size="small"
              sx={theme => ({
                bgcolor: theme.palette.error.main,
                color: theme.palette.onError,
              })}
            />
          }
        >
          <StudentCreditDataGrid
            rows={creditRows}
            canManage={canManage}
            onSendReminder={onSendReminder}
            labels={getStudentCreditGridLabels(labels)}
          />
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              py: 2,
              borderTop: theme => `1px solid ${theme.palette.outlineVariant}`,
            }}
          >
            <Button variant="text" sx={{ fontWeight: 700 }}>
              {labels.viewAllNegativeBalance}
            </Button>
          </Box>
        </SectionPanel>
      )}
    </PageContainer>
  );
}
