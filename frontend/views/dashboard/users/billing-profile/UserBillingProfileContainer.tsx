"use client";

import { useQuery } from "@apollo/client/react";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission, CurrencyCode, InvoiceStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  userBillingProfileInvoiceHistoryQueryDocument,
  userBillingProfileSummaryQueryDocument,
} from "@/frontend/graphql/sharedDocuments";
import { useImpersonation } from "@/frontend/hooks/useImpersonation";
import { buildFxDisplayMessages } from "@/frontend/lib/buildFxDisplayMessages";
import { formatBillingCurrencyTotals, mapBillingCurrencyBuckets } from "@/frontend/lib/formatBillingCurrencyTotals";
import { formatCurrencyForDisplay } from "@/frontend/lib/fx-render";
import { useUserBillingProfileStore } from "@/frontend/stores/userBillingProfileStore";
import { useUserStore } from "@/frontend/stores/userStore";
import { BillingImpersonationNotice } from "@/frontend/views/dashboard/billing/components/BillingImpersonationNotice";
import { InvoicePaymentDetailsDialog } from "@/frontend/views/dashboard/billing/components/InvoicePaymentDetailsDialog";
import {
  SubmitPaymentProofDialog,
  type SubmitPaymentProofDialogMode,
} from "@/frontend/views/dashboard/billing/components/SubmitPaymentProofDialog";
import { useRefetchOnWindowFocus } from "@/frontend/views/dashboard/billing/hooks/useRefetchOnWindowFocus";
import type {
  MarkPaidInvoiceTarget,
  PaymentDetailsTarget,
} from "@/frontend/views/dashboard/billing/types/billingViewTypes";
import { buildParentMetrics } from "@/frontend/views/dashboard/billing/utils/billingMetrics";
import { buildBillingLabels } from "@/frontend/views/dashboard/billing/utils/buildBillingLabels";
import { formatBillingDate, formatBillingMonth } from "@/frontend/views/dashboard/billing/utils/formatBillingDate";
import { DisplayCurrencyHint } from "@/frontend/views/dashboard/components/DisplayCurrencyHint";
import { FxConversionNote } from "@/frontend/views/dashboard/components/FxConversionNote";
import type { UserBillingProfileContainerProps } from "@/frontend/views/dashboard/users/billing-profile/types/userBillingProfile.types";
import { UserBillingProfileView } from "@/frontend/views/dashboard/users/billing-profile/UserBillingProfileView";
import { BILLING_INVOICE_POLL_INTERVAL_MS } from "@/shared/constants/billing/polling";

const StyledErrorTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.error.main,
}));

function mapParentInvoiceStatus(status: string | null | undefined): InvoiceStatus {
  if (status === InvoiceStatus.Paid) return InvoiceStatus.Paid;
  if (status === InvoiceStatus.PaymentPending) return InvoiceStatus.PaymentPending;
  if (status === InvoiceStatus.Cancelled) return InvoiceStatus.Cancelled;
  return InvoiceStatus.Unpaid;
}

export function UserBillingProfileContainer({ userId }: Readonly<UserBillingProfileContainerProps>) {
  const t = useTranslations("dashboard.billing");
  const tProfile = useTranslations("profile.teacher");
  const tProfileRoot = useTranslations("profile");
  const tErrors = useTranslations("errors");
  const tc = useTranslations("common");
  const locale = useLocale();
  const labels = buildBillingLabels(t);
  const notifications = useNotifications();
  const { isImpersonating } = useImpersonation();
  const billingActionsDisabled = isImpersonating;

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [proofTarget, setProofTarget] = useState<MarkPaidInvoiceTarget | null>(null);
  const [proofMode, setProofMode] = useState<SubmitPaymentProofDialogMode>("submit");
  const [detailsTarget, setDetailsTarget] = useState<PaymentDetailsTarget | null>(null);

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

  const {
    data: summaryData,
    loading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery(userBillingProfileSummaryQueryDocument, {
    variables: { userId, parentId: null },
    fetchPolicy: "cache-and-network",
    pollInterval: BILLING_INVOICE_POLL_INTERVAL_MS,
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
    pollInterval: BILLING_INVOICE_POLL_INTERVAL_MS,
  });

  const refreshBillingData = useCallback(() => {
    void refetch();
    void refetchSummary();
  }, [refetch, refetchSummary]);

  useRefetchOnWindowFocus(refreshBillingData);

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
        status: mapParentInvoiceStatus(inv.status),
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

  const isLoading = summaryLoading || loading;

  const metrics = useMemo(() => buildParentMetrics(summary, labels), [summary, labels]);

  const hasPermission = useUserStore(state => state.hasPermission);
  const canManage = hasPermission(AppPermission.BillingUpdateStatusPaid);
  const canSubmitProof = hasPermission(AppPermission.BillingSubmitPaymentProof);
  const canCreate = hasPermission(AppPermission.BillingCreateInvoice);

  const openProofDialog = (invoice: MarkPaidInvoiceTarget, mode: SubmitPaymentProofDialogMode) => {
    if (billingActionsDisabled) {
      notifications.show(tErrors("auth.impersonationNotAllowedDuringSession"), {
        severity: "error",
        autoHideDuration: 4000,
      });
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
    notifications.show(proofMode === "markPaid" ? labels.markAsPaidSuccess : labels.submitProofSuccess, {
      severity: "success",
      autoHideDuration: 4000,
    });
  };

  const handleProofError = (message: string) => {
    notifications.show(message, {
      severity: "error",
      autoHideDuration: 6000,
    });
  };

  const handleDetailsSuccess = (action: "approve" | "reject") => {
    refreshBillingData();
    notifications.show(action === "approve" ? labels.approveProofSuccess : labels.rejectProofSuccess, {
      severity: "success",
      autoHideDuration: 4000,
    });
  };

  const handleDownloadPdf = (invoiceId: string) => {
    const popup = window.open(`/api/invoices/${invoiceId}/download`, "_blank", "noopener,noreferrer");
    if (!popup) {
      notifications.show(labels.notifications.popupBlocked, {
        severity: "error",
        autoHideDuration: 4000,
      });
    }
  };

  const handleQuickPay = () => {
    if (billingActionsDisabled) {
      notifications.show(tErrors("auth.impersonationNotAllowedDuringSession"), {
        severity: "error",
        autoHideDuration: 4000,
      });
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
      notifications.show(labels.notifications.paymentPendingReview, {
        severity: "info",
        autoHideDuration: 4000,
      });
      return;
    }

    notifications.show(labels.noUnpaidInvoices, {
      severity: "info",
      autoHideDuration: 4000,
    });
  };

  if (isLoading && !data && !summaryData) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || summaryError) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, mt: 8 }}>
        <StyledErrorTypography>{tc("loadFailed")}</StyledErrorTypography>
        <Button variant="outlined" onClick={refreshBillingData}>
          {labels.errors.retry}
        </Button>
      </Box>
    );
  }

  const viewProps = {
    labels,
    summary,
    metrics,
    invoices,
    searchQuery,
    canManage,
    canSubmitProof,
    canView: hasPermission(AppPermission.BillingViewHistory),
    canCreate,
    billingActionsDisabled,
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
    loading: isLoading,
  };

  return (
    <RequirePermission permissions={[AppPermission.BillingViewHistory]}>
      <DisplayCurrencyHint mode="subject" subjectUserId={userId} />
      <FxConversionNote mode="subject" subjectUserId={userId} />
      <BillingImpersonationNotice />
      <UserBillingProfileView {...viewProps} />
      <SubmitPaymentProofDialog
        open={proofTarget !== null}
        onClose={() => setProofTarget(null)}
        invoice={proofTarget}
        mode={proofMode}
        billingActionsDisabled={billingActionsDisabled}
        onSuccess={handleProofSuccess}
        onError={handleProofError}
      />
      <InvoicePaymentDetailsDialog
        open={detailsTarget !== null}
        onClose={() => setDetailsTarget(null)}
        invoiceId={detailsTarget?.invoiceId ?? null}
        subjectUserId={userId}
        canManage={canManage}
        billingActionsDisabled={billingActionsDisabled}
        onSuccess={handleDetailsSuccess}
      />
    </RequirePermission>
  );
}
