"use client";

import { AddCardOutlined } from "@mui/icons-material";
import { Box, Fab, Typography } from "@mui/material";
import { PageContainer, PageHeader } from "@/frontend/components/ui";
import { BillingMetricsRow } from "./components/BillingMetricsRow";
import { BillingMobileSearchBar } from "./components/BillingMobileSearchBar";
import { ParentInvoicesCardList } from "./components/ParentInvoicesCardList";
import type { ParentBillingViewProps } from "./types/billingViewTypes";
import { buildParentMetrics } from "./utils/billingMetrics";

export function ParentBillingMobileView({
  labels,
  summary,
  invoices,
  searchQuery,
  canView,
  canManage,
  onSearchChange,
  onPayNow,
  onDownloadPdf,
  onQuickPay,
}: Readonly<ParentBillingViewProps>) {
  const showQuickPayFab = canView && !canManage;

  return (
    <>
      <PageContainer>
        <PageHeader title={labels.parentPageTitle} subtitle={labels.parentPageSubtitle} titleVariant="headlineMd" />
        <BillingMetricsRow metrics={buildParentMetrics(summary, labels)} compact />
        <BillingMobileSearchBar
          value={searchQuery}
          placeholder={labels.search.parentPlaceholder}
          filterLabel={labels.search.filter}
          onChange={onSearchChange}
        />
        <Typography variant="titleLg">{labels.sections.invoiceHistory}</Typography>
        {invoices.length === 0 ? (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <Typography variant="headlineMd" sx={{ mb: 1 }}>
              {labels.parentTable.emptyTitle}
            </Typography>
            <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
              {labels.parentTable.emptySubtitle}
            </Typography>
          </Box>
        ) : (
          <ParentInvoicesCardList
            rows={invoices}
            canView={canView}
            onPayNow={onPayNow}
            onDownloadPdf={onDownloadPdf}
            labels={{
              viewDetails: labels.parentTable.viewDetails,
              downloadPdf: labels.parentTable.downloadPdf,
              payNow: labels.parentTable.payNow,
              statusLabels: labels.invoiceStatus,
            }}
          />
        )}
      </PageContainer>
      {showQuickPayFab && (
        <Fab
          variant="extended"
          aria-label={labels.quickPay}
          onClick={onQuickPay}
          sx={theme => ({
            bgcolor: theme.palette.primary.main,
            color: theme.palette.onPrimary,
            position: "fixed",
            bottom: theme.spacing(3),
            right: theme.spacing(3),
            zIndex: theme.zIndex.speedDial,
            textTransform: "uppercase",
            fontWeight: 700,
            "&:hover": {
              bgcolor: theme.palette.primary.dark,
            },
          })}
        >
          <AddCardOutlined sx={{ mr: 1 }} />
          {labels.quickPay}
        </Fab>
      )}
    </>
  );
}
