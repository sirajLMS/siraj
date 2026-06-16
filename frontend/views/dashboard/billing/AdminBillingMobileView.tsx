"use client";

import { AddOutlined } from "@mui/icons-material";
import { Fab, Typography } from "@mui/material";
import { PageContainer, PageHeader } from "@/frontend/components/ui";
import { AdminInvoicesCardList } from "./components/AdminInvoicesCardList";
import { BillingMetricsRow } from "./components/BillingMetricsRow";
import { BillingMobileSearchBar } from "./components/BillingMobileSearchBar";
import { StudentCreditCardList } from "./components/StudentCreditCardList";
import type { AdminBillingViewProps } from "./types/billingViewTypes";
import { buildAdminMetrics } from "./utils/billingMetrics";

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
        <Typography variant="titleLg">{labels.sections.recentInvoices}</Typography>
        <AdminInvoicesCardList
          rows={invoices}
          canManage={canManage}
          onMarkAsPaid={onMarkAsPaid}
          labels={{
            markAsPaid: labels.adminTable.markAsPaid,
            quickPay: labels.adminTable.quickPay,
            statusLabels: labels.invoiceStatus,
          }}
        />
        {canManage && (
          <>
            <Typography variant="titleLg">{labels.sections.studentCreditStatus}</Typography>
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
          </>
        )}
      </PageContainer>
      {canCreate && (
        <Fab
          aria-label={labels.manualInvoice}
          onClick={onManualInvoice}
          sx={theme => ({
            bgcolor: theme.palette.primary.main,
            color: theme.palette.onPrimary,
            position: "fixed",
            bottom: theme.spacing(3),
            right: theme.spacing(3),
            zIndex: theme.zIndex.speedDial,
            "&:hover": {
              bgcolor: theme.palette.primary.dark,
            },
          })}
        >
          <AddOutlined />
        </Fab>
      )}
    </>
  );
}
