"use client";

import { useQuery } from "@apollo/client/react";
import { Alert, Box, CircularProgress, Snackbar, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission, CurrencyCode, InvoiceStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  parentBillingSummaryQueryDocument,
  parentInvoiceHistoryQueryDocument,
} from "@/frontend/graphql/sharedDocuments/parents/parent-billing-history.documents";
import { formatBillingCurrencyTotals, mapBillingCurrencyBuckets } from "@/frontend/lib/formatBillingCurrencyTotals";
import { formatCurrencyForDisplay } from "@/frontend/lib/fx-render";
import { useParentBillingStore } from "@/frontend/stores/parentBillingStore";
import { useUserStore } from "@/frontend/stores/userStore";
import { InvoicePaymentDetailsDialog } from "@/frontend/views/dashboard/billing/components/InvoicePaymentDetailsDialog";
import { SubmitPaymentProofDialog } from "@/frontend/views/dashboard/billing/components/SubmitPaymentProofDialog";
import { ParentBillingView } from "@/frontend/views/dashboard/billing/ParentBillingView";
import type {
  MarkPaidInvoiceTarget,
  ParentBillingViewProps,
  PaymentDetailsTarget,
} from "@/frontend/views/dashboard/billing/types/billingViewTypes";
import { filterParentInvoices } from "@/frontend/views/dashboard/billing/utils/billingFilters";
import { buildBillingLabels } from "@/frontend/views/dashboard/billing/utils/buildBillingLabels";
import { DisplayCurrencyHint } from "@/frontend/views/dashboard/components/DisplayCurrencyHint";

const StyledErrorTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.error.main,
}));

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function mapParentInvoiceStatus(status: string | null | undefined): InvoiceStatus {
  if (status === InvoiceStatus.Paid) return InvoiceStatus.Paid;
  if (status === InvoiceStatus.PaymentPending) return InvoiceStatus.PaymentPending;
  if (status === InvoiceStatus.Cancelled) return InvoiceStatus.Cancelled;
  return InvoiceStatus.Unpaid;
}

export function ParentBillingContainer() {
  const t = useTranslations("dashboard.billing");
  const tProfile = useTranslations("profile.teacher");
  const tErrors = useTranslations("errors");
  const locale = useLocale();
  const tc = useTranslations("common");
  const labels = buildBillingLabels(t);

  const [searchQuery, setSearchQuery] = useState("");
  const [proofTarget, setProofTarget] = useState<MarkPaidInvoiceTarget | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<PaymentDetailsTarget | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  const showFeedback = (message: string, severity: "success" | "error") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const page = useParentBillingStore(state => state.page);
  const pageSize = useParentBillingStore(state => state.pageSize);
  const setPage = useParentBillingStore(state => state.setPage);

  const parentUserId = useUserStore(state => state.user?.id ?? null);
  const hasPermission = useUserStore(state => state.hasPermission);
  const canSubmitProof = hasPermission(AppPermission.BillingSubmitPaymentProof);

  const { data, loading, error, refetch } = useQuery(parentInvoiceHistoryQueryDocument, {
    variables: {
      parentId: null,
      userId: null,
      paginationArgs: {
        first: pageSize,
        page: page + 1,
        skip: null,
        after: null,
        before: null,
        last: null,
        maxCount: null,
      },
    },
    fetchPolicy: "cache-and-network",
  });

  const { data: summaryData, refetch: refetchSummary } = useQuery(parentBillingSummaryQueryDocument, {
    variables: { parentId: null, userId: null },
    fetchPolicy: "cache-and-network",
  });

  const handlePayNow = (invoice: MarkPaidInvoiceTarget) => {
    setProofTarget({
      ...invoice,
      parentUserId: parentUserId ?? invoice.parentUserId,
      dueDate: invoice.dueDate ? formatDate(invoice.dueDate) : invoice.dueDate,
    });
  };

  const handleProofSuccess = () => {
    showFeedback(labels.submitProofSuccess, "success");
    void refetch();
    void refetchSummary();
  };

  const handleProofError = (message: string) => {
    showFeedback(message, "error");
  };

  const handleDownloadPdf = (invoiceId: string) => {
    const popup = window.open(`/api/invoices/${invoiceId}/download`, "_blank", "noopener,noreferrer");
    if (!popup) {
      showFeedback(labels.notifications.popupBlocked, "error");
    }
  };

  const handleDetailsSuccess = () => {
    void refetch();
    void refetchSummary();
  };

  const totalCount = data ? (data.parentInvoiceHistory?.totalCount ?? 0) : undefined;

  const invoices = useMemo(() => data?.parentInvoiceHistory?.rows ?? [], [data?.parentInvoiceHistory]);

  const mappedInvoices = useMemo(
    () =>
      invoices.map(inv => ({
        id: inv.id ?? "",
        invoiceNumber: (inv.id ?? "").slice(0, 8).toUpperCase(),
        month: inv.issueDate ? new Date(inv.issueDate).toLocaleString("en", { month: "long" }) : "",
        issueDate: formatDate(inv.issueDate),
        dueDate: formatDate(inv.dueDate),
        paidDate: inv.paidDate ? formatDate(inv.paidDate) : t("parentTable.paidDate"),
        hasPaymentProof: inv.hasPaymentProof ?? false,
        fee: formatCurrencyForDisplay(
          inv.amount ?? "0",
          inv.currency ?? CurrencyCode.Usd,
          inv.displayAmount
            ? {
                amount: inv.displayAmount.amount,
                currency: inv.displayAmount.currency ?? CurrencyCode.Usd,
                stale: inv.displayAmount.stale ?? true,
              }
            : null,
          locale,
          {
            convertedAmount: values => tProfile("convertedAmount", values),
            displayCurrencyFallback: values => tErrors("displayCurrencyFallback", values),
          }
        ),
        status: mapParentInvoiceStatus(inv.status),
      })),
    [invoices, tProfile, tErrors, locale, t]
  );

  const handleQuickPay = () => {
    const firstUnpaid = mappedInvoices.find(inv => inv.status === InvoiceStatus.Unpaid);
    if (firstUnpaid) {
      handlePayNow({
        id: firstUnpaid.id,
        amount: firstUnpaid.fee,
        dueDate: firstUnpaid.dueDate,
        invoiceNumber: firstUnpaid.invoiceNumber,
      });
    } else {
      showFeedback(labels.noUnpaidInvoices, "success");
    }
  };

  const filteredInvoices = useMemo(
    () => filterParentInvoices(mappedInvoices, searchQuery),
    [mappedInvoices, searchQuery]
  );

  const summary = useMemo(() => {
    const fxMessages = {
      convertedAmount: (values: {
        lockedAmount: string;
        lockedCurrency: string;
        convertedApprox: string;
        displayCurrency: string;
      }) => tProfile("convertedAmount", values),
      convertedTotalApprox: (values: { convertedApprox: string; displayCurrency: string }) =>
        tProfile("convertedTotalApprox", values),
      displayCurrencyFallback: (values: { lockedAmount: string; lockedCurrency: string }) =>
        tErrors("displayCurrencyFallback", values),
    };

    const outstandingTotals = formatBillingCurrencyTotals(
      mapBillingCurrencyBuckets(summaryData?.parentBillingSummary?.outstandingByCurrency),
      locale,
      fxMessages
    );
    const paidThisTermTotals = formatBillingCurrencyTotals(
      mapBillingCurrencyBuckets(summaryData?.parentBillingSummary?.paidThisTermByCurrency),
      locale,
      fxMessages
    );

    return {
      outstandingBalance: outstandingTotals.primary,
      outstandingBalanceSubLabel: outstandingTotals.breakdown,
      paidThisTerm: paidThisTermTotals.primary,
      paidThisTermSubLabel: paidThisTermTotals.breakdown,
      nextDueDate: formatDate(summaryData?.parentBillingSummary?.nextDueDate ?? null),
      activeStudents: String(summaryData?.parentBillingSummary?.activeStudents ?? 0),
    };
  }, [summaryData?.parentBillingSummary, locale, tProfile, tErrors]);

  if (loading && !data) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <StyledErrorTypography>{tc("loadFailed")}</StyledErrorTypography>;
  }

  const viewProps: ParentBillingViewProps = {
    labels,
    summary,
    invoices: filteredInvoices,
    searchQuery,
    canManage: false,
    canSubmitProof,
    canView: true,
    canCreate: false,
    onSearchChange: setSearchQuery,
    onPayNow: handlePayNow,
    onViewPaymentDetails: setDetailsTarget,
    onDownloadPdf: handleDownloadPdf,
    onQuickPay: handleQuickPay,
    page,
    pageSize,
    totalCount,
    loading,
    onPageChange: setPage,
  };

  return (
    <RequirePermission permissions={[AppPermission.BillingViewHistory]}>
      <DisplayCurrencyHint />
      <ParentBillingView {...viewProps} />
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbarSeverity} onClose={() => setSnackbarOpen(false)}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
      <SubmitPaymentProofDialog
        open={proofTarget !== null}
        onClose={() => setProofTarget(null)}
        invoice={proofTarget}
        mode="submit"
        onSuccess={handleProofSuccess}
        onError={handleProofError}
      />
      <InvoicePaymentDetailsDialog
        open={detailsTarget !== null}
        onClose={() => setDetailsTarget(null)}
        invoiceId={detailsTarget?.invoiceId ?? null}
        onSuccess={handleDetailsSuccess}
      />
    </RequirePermission>
  );
}
