"use client";

import { useQuery } from "@apollo/client/react";
import { Alert, Box, Button, CircularProgress, Snackbar, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useCallback, useMemo, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission, CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  userBillingProfileInvoiceHistoryQueryDocument,
  userBillingProfileSummaryQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useDocumentTitle } from "@/frontend/common/hooks/useDocumentTitle";
import { useImpersonation } from "@/frontend/common/hooks/useImpersonation";
import { buildFxDisplayMessages } from "@/frontend/common/lib/buildFxDisplayMessages";
import {
  formatBillingCurrencyTotals,
  mapBillingCurrencyBuckets,
} from "@/frontend/common/lib/formatBillingCurrencyTotals";
import { formatCurrencyForDisplay } from "@/frontend/common/lib/fx-render";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { useUserBillingProfileStore } from "@/frontend/common/stores/userBillingProfileStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { BillingImpersonationNotice } from "@/frontend/common/views/dashboard/billing/components/BillingImpersonationNotice";
import { InvoicePaymentDetailsDialog } from "@/frontend/common/views/dashboard/billing/components/InvoicePaymentDetailsDialog";
import {
  SubmitPaymentProofDialog,
  type SubmitPaymentProofDialogMode,
} from "@/frontend/common/views/dashboard/billing/components/SubmitPaymentProofDialog";
import { useBillingPollInterval } from "@/frontend/common/views/dashboard/billing/hooks/useBillingPollInterval";
import { useRefetchOnWindowFocus } from "@/frontend/common/views/dashboard/billing/hooks/useRefetchOnWindowFocus";
import type {
  MarkPaidInvoiceTarget,
  PaymentDetailsTarget,
} from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";
import { buildParentMetrics } from "@/frontend/common/views/dashboard/billing/utils/billingMetrics";
import { buildBillingLabels } from "@/frontend/common/views/dashboard/billing/utils/buildBillingLabels";
import {
  formatBillingDate,
  formatBillingMonth,
} from "@/frontend/common/views/dashboard/billing/utils/formatBillingDate";
import { deriveParentInvoiceDisplayStatus } from "@/frontend/common/views/dashboard/billing/utils/invoiceDisplayStatus";
import { DisplayCurrencyHint } from "@/frontend/common/views/dashboard/components/DisplayCurrencyHint";
import { FxConversionNote } from "@/frontend/common/views/dashboard/components/FxConversionNote";
import type { UserBillingProfileContainerProps } from "@/frontend/common/views/dashboard/users/billing-profile/types/userBillingProfile.types";
import { UserBillingProfileView } from "@/frontend/common/views/dashboard/users/billing-profile/userBillingProfileView";
import { useAppTranslation } from "@/shared/locale/client";

const StyledErrorTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.error.main,
}));

export function UserBillingProfileContainer({ userId }: Readonly<UserBillingProfileContainerProps>) {
  const t = useAppTranslation("dashboard.billing");
  const tProfile = useAppTranslation("profile.teacher");
  const tProfileRoot = useAppTranslation("profile");
  const tErrors = useAppTranslation("errors");
  const tc = useAppTranslation("common");
  const locale = useAppLocale();
  const labels = buildBillingLabels(t);
  const { isImpersonating } = useImpersonation();
  const billingActionsDisabled = isImpersonating;
  useDocumentTitle(null, "dashboard.billing", "billingProfileTitle");

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

  const page = useUserBillingProfileStore(state => state.page);
  const pageSize = useUserBillingProfileStore(state => state.pageSize);
  const setPage = useUserBillingProfileStore(state => state.setPage);

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

  const {
    data: summaryData,
    loading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery(userBillingProfileSummaryQueryDocument, {
    variables: { userId, parentId: null },
    fetchPolicy: "cache-and-network",
    pollInterval,
  });

  const { data, loading, error, refetch } = useQuery(userBillingProfileInvoiceHistoryQueryDocument, {
    variables: {
      userId,
      parentId: null,
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
    skip: summaryLoading,
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

  const totalCount = data?.parentInvoiceHistory?.totalCount ?? 0;

  const invoices = useMemo(
    () =>
      (data?.parentInvoiceHistory?.rows ?? []).map(inv => ({
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
    [data?.parentInvoiceHistory, fxMessages, locale]
  );

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

  const isLoading = summaryLoading || loading || isSearchPending;

  const metrics = useMemo(() => buildParentMetrics(summary, labels), [summary, labels]);

  const hasPermission = useUserStore(state => state.hasPermission);
  const canManage = hasPermission(AppPermission.BillingUpdateStatusPaid);
  const canSubmitProof = hasPermission(AppPermission.BillingSubmitPaymentProof);
  const canCreate = hasPermission(AppPermission.BillingCreateInvoice);

  const openProofDialog = (invoice: MarkPaidInvoiceTarget, mode: SubmitPaymentProofDialogMode) => {
    if (billingActionsDisabled) {
      showFeedback(tErrors.auth.impersonationNotAllowedDuringSession, "error");
      return;
    }
    setProofMode(mode);
    setProofTarget({
      ...invoice,
      parentUserId: userId,
    });
  };

  const handlePayNow = (invoice: MarkPaidInvoiceTarget) => {
    openProofDialog(invoice, "submit");
  };

  const handleMarkAsPaid = (invoice: MarkPaidInvoiceTarget) => {
    openProofDialog(invoice, "markPaid");
  };

  const handleProofSuccess = () => {
    refreshBillingData();
    showFeedback(proofMode === "markPaid" ? labels.markAsPaidSuccess : labels.submitProofSuccess, "success");
  };

  const handleProofError = (message: string) => {
    showFeedback(message, "error");
  };

  const handleDetailsSuccess = (action: "approve" | "reject") => {
    refreshBillingData();
    showFeedback(action === "approve" ? labels.approveProofSuccess : labels.rejectProofSuccess, "success");
  };

  const handleDownloadPdf = (invoiceId: string) => {
    const popup = window.open(`/api/invoices/${invoiceId}/download`, "_blank", "noopener,noreferrer");
    if (!popup) {
      showFeedback(labels.notifications.popupBlocked, "error");
    }
  };

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

  if (isLoading && !data && !summaryData) {
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

  const viewProps = {
    labels,
    summary,
    summaryLoading,
    metrics,
    invoices,
    searchQuery,
    canManage,
    canSubmitProof,
    canView: hasPermission(AppPermission.BillingViewHistory),
    canCreate,
    billingActionsDisabled,
    isSearchPending,
    onSearchChange: handleSearchChange,
    onPayNow: handlePayNow,
    onMarkAsPaid: canManage ? handleMarkAsPaid : undefined,
    onViewPaymentDetails: setDetailsTarget,
    onDownloadPdf: handleDownloadPdf,
    onQuickPay: handleQuickPay,
    page,
    pageSize,
    totalCount,
    onPageChange: setPage,
    loading: loading || isSearchPending,
    userId,
  };

  return (
    <RequirePermission permissions={[AppPermission.BillingViewHistory]}>
      <DisplayCurrencyHint mode="subject" subjectUserId={userId} />
      <FxConversionNote mode="subject" subjectUserId={userId} />
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
      <UserBillingProfileView {...viewProps} />
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
        subjectUserId={userId}
        canManage={canManage}
        billingActionsDisabled={billingActionsDisabled}
        onSuccess={handleDetailsSuccess}
      />
    </RequirePermission>
  );
}
