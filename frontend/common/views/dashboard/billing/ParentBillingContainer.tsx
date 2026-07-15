"use client";

import { useQuery } from "@apollo/client/react";
import { Alert, Box, Button, CircularProgress, Snackbar, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useCallback, useMemo, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission, CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  parentBillingSummaryQueryDocument,
  parentInvoiceHistoryQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/parents/parent-billing-history.documents";
import { useImpersonation } from "@/frontend/common/hooks/useImpersonation";
import { buildFxDisplayMessages } from "@/frontend/common/lib/buildFxDisplayMessages";
import {
  formatBillingCurrencyTotals,
  mapBillingCurrencyBuckets,
} from "@/frontend/common/lib/formatBillingCurrencyTotals";
import { formatCurrencyForDisplay } from "@/frontend/common/lib/fx-render";
import { useAppLocale } from "@/frontend/common/providers/LocaleProvider";
import { useParentBillingStore } from "@/frontend/common/stores/parentBillingStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { BillingImpersonationNotice } from "@/frontend/common/views/dashboard/billing/components/BillingImpersonationNotice";
import { InvoicePaymentDetailsDialog } from "@/frontend/common/views/dashboard/billing/components/InvoicePaymentDetailsDialog";
import {
  SubmitPaymentProofDialog,
  type SubmitPaymentProofDialogMode,
} from "@/frontend/common/views/dashboard/billing/components/SubmitPaymentProofDialog";
import { useBillingPollInterval } from "@/frontend/common/views/dashboard/billing/hooks/useBillingPollInterval";
import { useRefetchOnWindowFocus } from "@/frontend/common/views/dashboard/billing/hooks/useRefetchOnWindowFocus";
import { ParentBillingView } from "@/frontend/common/views/dashboard/billing/parentBillingView";
import type {
  MarkPaidInvoiceTarget,
  ParentBillingViewProps,
  PaymentDetailsTarget,
} from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";
import { buildBillingLabels } from "@/frontend/common/views/dashboard/billing/utils/buildBillingLabels";
import {
  formatBillingDate,
  formatBillingMonth,
} from "@/frontend/common/views/dashboard/billing/utils/formatBillingDate";
import { deriveParentInvoiceDisplayStatus } from "@/frontend/common/views/dashboard/billing/utils/invoiceDisplayStatus";
import { DisplayCurrencyHint } from "@/frontend/common/views/dashboard/components/DisplayCurrencyHint";
import { FxConversionNote } from "@/frontend/common/views/dashboard/components/FxConversionNote";
import { useAppTranslation } from "@/shared/locale/client";

const StyledErrorTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.error.main,
}));

export function ParentBillingContainer() {
  const t = useAppTranslation("dashboard.billing");
  const tProfile = useAppTranslation("profile").teacher;
  const tProfileRoot = useAppTranslation("profile");
  const tErrors = useAppTranslation("errors");
  const locale = useAppLocale();
  const tc = useAppTranslation("common");
  const labels = buildBillingLabels(t);
  const { isImpersonating } = useImpersonation();
  const billingActionsDisabled = isImpersonating;

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [proofTarget, setProofTarget] = useState<MarkPaidInvoiceTarget | null>(null);
  const [proofMode, setProofMode] = useState<SubmitPaymentProofDialogMode>("submit");
  const [detailsTarget, setDetailsTarget] = useState<PaymentDetailsTarget | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info">("success");

  const showFeedback = (message: string, severity: "success" | "error" | "info") => {
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

  const debouncedApplySearch = useDebouncedCallback((value: string) => {
    setDebouncedSearch(value.trim());
    setPage(0);
  }, 300);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    debouncedApplySearch(value);
  };

  const isSearchPending = searchQuery.trim() !== debouncedSearch.trim();
  const billingDialogsOpen = proofTarget !== null || detailsTarget !== null;
  const pollInterval = useBillingPollInterval(billingDialogsOpen);

  const { data, loading, error, refetch } = useQuery(parentInvoiceHistoryQueryDocument, {
    variables: {
      parentId: null,
      userId: null,
      search: debouncedSearch || null,
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
    pollInterval,
  });

  const {
    data: summaryData,
    loading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery(parentBillingSummaryQueryDocument, {
    variables: { parentId: null, userId: null },
    fetchPolicy: "cache-and-network",
    pollInterval,
  });

  const refreshBillingData = useCallback(() => {
    void refetch();
    void refetchSummary();
  }, [refetch, refetchSummary]);

  useRefetchOnWindowFocus(refreshBillingData);

  const refreshAfterDialogClose = useCallback(() => {
    void refetch();
    void refetchSummary();
  }, [refetch, refetchSummary]);

  const fxMessages = useMemo(
    () => buildFxDisplayMessages(tProfile, tErrors, tProfileRoot),
    [tProfile, tErrors, tProfileRoot]
  );

  const openProofDialog = (invoice: MarkPaidInvoiceTarget, mode: SubmitPaymentProofDialogMode) => {
    setProofMode(mode);
    setProofTarget({
      ...invoice,
      parentUserId: parentUserId ?? invoice.parentUserId,
    });
  };

  const handlePayNow = (invoice: MarkPaidInvoiceTarget) => {
    openProofDialog(invoice, "submit");
  };

  const handleProofSuccess = () => {
    showFeedback(proofMode === "markPaid" ? labels.markAsPaidSuccess : labels.submitProofSuccess, "success");
    refreshBillingData();
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
    refreshBillingData();
  };

  const totalCount = data ? (data.parentInvoiceHistory?.totalCount ?? 0) : undefined;

  const invoices = useMemo(() => data?.parentInvoiceHistory?.rows ?? [], [data?.parentInvoiceHistory]);

  const mappedInvoices = useMemo(
    () =>
      invoices.map(inv => ({
        id: inv.id ?? "",
        invoiceNumber: (inv.id ?? "").slice(0, 8).toUpperCase(),
        month: formatBillingMonth(inv.issueDate, locale),
        issueDate: formatBillingDate(inv.issueDate, locale),
        dueDate: formatBillingDate(inv.dueDate, locale),
        paidDate: inv.paidDate ? formatBillingDate(inv.paidDate, locale) : "—",
        hasPaymentProof: inv.hasPaymentProof ?? false,
        hasRejectedSubmission: inv.hasRejectedSubmission ?? false,
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
          fxMessages
        ),
        status: deriveParentInvoiceDisplayStatus(inv.status, inv.dueDate),
      })),
    [invoices, fxMessages, locale]
  );

  const handleQuickPay = () => {
    if (billingActionsDisabled) {
      showFeedback(tErrors.auth.impersonationNotAllowedDuringSession, "error");
      return;
    }

    if (summaryLoading) {
      showFeedback(tc.loading, "info");
      return;
    }

    const nextUnpaid = summaryData?.parentBillingSummary?.nextUnpaidInvoice;
    if (nextUnpaid?.id) {
      handlePayNow({
        id: nextUnpaid.id,
        amount: formatCurrencyForDisplay(
          nextUnpaid.amount ?? "0",
          nextUnpaid.currency ?? CurrencyCode.Usd,
          null,
          locale,
          fxMessages
        ),
        dueDate: formatBillingDate(nextUnpaid.dueDate, locale),
        invoiceNumber: nextUnpaid.id.slice(0, 8).toUpperCase(),
        studentName: nextUnpaid.studentName,
      });
      return;
    }

    const pendingCount = summaryData?.parentBillingSummary?.pendingPaymentCount ?? 0;
    if (pendingCount > 0) {
      showFeedback(labels.notifications.paymentPendingReview, "info");
      return;
    }

    showFeedback(labels.noUnpaidInvoices, "info");
  };

  const summary = useMemo(() => {
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
      nextDueDate: formatBillingDate(summaryData?.parentBillingSummary?.nextDueDate ?? null, locale),
      activeStudents: String(summaryData?.parentBillingSummary?.activeStudents ?? 0),
    };
  }, [summaryData?.parentBillingSummary, locale, fxMessages]);

  if (loading && !data) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, mt: 8 }}>
        <StyledErrorTypography>{tc.loadFailed}</StyledErrorTypography>
        <Button variant="outlined" onClick={refreshBillingData}>
          {labels.errors.retry}
        </Button>
      </Box>
    );
  }

  const viewProps: ParentBillingViewProps = {
    labels,
    summary,
    summaryLoading,
    invoices: mappedInvoices,
    searchQuery,
    canManage: false,
    canSubmitProof,
    canView: true,
    canCreate: false,
    billingActionsDisabled,
    isSearchPending,
    onSearchChange: handleSearchChange,
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
      <FxConversionNote />
      <BillingImpersonationNotice />
      {summaryError ? (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => void refetchSummary()}>
              {labels.errors.retry}
            </Button>
          }
        >
          {tc.loadFailed}
        </Alert>
      ) : null}
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
        onClose={() => {
          setProofTarget(null);
          refreshAfterDialogClose();
        }}
        invoice={proofTarget}
        mode={proofMode}
        billingActionsDisabled={billingActionsDisabled}
        onSuccess={handleProofSuccess}
        onError={handleProofError}
      />
      <InvoicePaymentDetailsDialog
        open={detailsTarget !== null}
        onClose={() => {
          setDetailsTarget(null);
          refreshAfterDialogClose();
        }}
        invoiceId={detailsTarget?.invoiceId ?? null}
        billingActionsDisabled={billingActionsDisabled}
        onSuccess={handleDetailsSuccess}
      />
    </RequirePermission>
  );
}
