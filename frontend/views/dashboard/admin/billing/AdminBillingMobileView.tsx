"use client";

import { AddOutlined } from "@mui/icons-material";
import { Fab } from "@mui/material";
import { styled } from "@mui/material/styles";
import { PageContainer, PageHeader, SectionPanel } from "@/frontend/components/ui";
import { BillingMetricsRow } from "../../billing/components/BillingMetricsRow";
import { BillingMobileSearchBar } from "../../billing/components/BillingMobileSearchBar";
import { StudentCreditCardList } from "../../billing/components/StudentCreditCardList";
import type { AdminBillingViewProps } from "../../billing/types/billingViewTypes";
import { buildAdminMetrics } from "../../billing/utils/billingMetrics";
import { AdminInvoicesCardList } from "./components/AdminInvoicesCardList";

// Floating action button for creating a manual invoice, fixed at bottom-right with primary colors
const StyledManualInvoiceFab = styled(Fab)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.onPrimary,
  position: "fixed",
  bottom: theme.spacing(3),
  right: theme.spacing(3),
  zIndex: theme.zIndex.speedDial,
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
  },
}));

export function AdminBillingMobileView({
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
    <>
      <PageContainer>
        <PageHeader title={labels.adminPageTitle} subtitle={labels.adminPageSubtitle} titleVariant="headlineMd" />
        <BillingMetricsRow metrics={buildAdminMetrics(summary, labels)} compact />
        <BillingMobileSearchBar
          value={searchQuery}
          placeholder={labels.search.invoicesPlaceholder}
          filterLabel={labels.search.filter}
          onChange={onSearchChange}
        />
        <SectionPanel title={labels.sections.recentInvoices}>
          <AdminInvoicesCardList
            rows={invoices}
            canManage={canManage}
            onMarkAsPaid={onMarkAsPaid}
            labels={{
              markAsPaid: labels.adminTable.markAsPaid,
              quickPay: labels.adminTable.quickPay,
              statusLabels: labels.invoiceStatus,
            }}
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={onPageChange}
          />
        </SectionPanel>
        {canManage && (
          <SectionPanel title={labels.sections.studentCreditStatus}>
            <StudentCreditCardList
              rows={creditRows}
              canManage={canManage}
              onSendReminder={onSendReminder}
              labels={{
                classesLeft: labels.creditTable.classesLeft,
                sendReminder: labels.creditTable.sendReminder,
                creditStatusLabels: labels.creditStatus,
              }}
            />
          </SectionPanel>
        )}
      </PageContainer>
      {canCreate && (
        <StyledManualInvoiceFab aria-label={labels.manualInvoice} onClick={onManualInvoice}>
          <AddOutlined />
        </StyledManualInvoiceFab>
      )}
    </>
  );
}
