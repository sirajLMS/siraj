"use client";

import { useQuery } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission, CurrencyCode, InvoiceStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  userBillingProfileInvoiceHistoryQueryDocument,
  userBillingProfileSummaryQueryDocument,
} from "@/frontend/graphql/sharedDocuments";
import { formatBillingCurrencyTotals, mapBillingCurrencyBuckets } from "@/frontend/lib/formatBillingCurrencyTotals";
import { formatCurrencyForDisplay } from "@/frontend/lib/fx-render";
import { useUserBillingProfileStore } from "@/frontend/stores/userBillingProfileStore";
import { useUserStore } from "@/frontend/stores/userStore";
import { InvoicePaymentDetailsDialog } from "@/frontend/views/dashboard/billing/components/InvoicePaymentDetailsDialog";
import { SubmitPaymentProofDialog } from "@/frontend/views/dashboard/billing/components/SubmitPaymentProofDialog";
import type {
  MarkPaidInvoiceTarget,
  PaymentDetailsTarget,
} from "@/frontend/views/dashboard/billing/types/billingViewTypes";
import { filterParentInvoices } from "@/frontend/views/dashboard/billing/utils/billingFilters";
import { buildParentMetrics } from "@/frontend/views/dashboard/billing/utils/billingMetrics";
import { buildBillingLabels } from "@/frontend/views/dashboard/billing/utils/buildBillingLabels";
import { DisplayCurrencyHint } from "@/frontend/views/dashboard/components/DisplayCurrencyHint";
import type { UserBillingProfileContainerProps } from "@/frontend/views/dashboard/users/billing-profile/types/userBillingProfile.types";
import { UserBillingProfileView } from "@/frontend/views/dashboard/users/billing-profile/UserBillingProfileView";

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

export function UserBillingProfileContainer({ userId }: Readonly<UserBillingProfileContainerProps>) {
  const t = useTranslations("dashboard.billing");
  const tProfile = useTranslations("profile.teacher");
  const tErrors = useTranslations("errors");
  const locale = useLocale();
  const labels = buildBillingLabels(t);
  const notifications = useNotifications();

  const [searchQuery, setSearchQuery] = useState("");
  const [proofTarget, setProofTarget] = useState<MarkPaidInvoiceTarget | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<PaymentDetailsTarget | null>(null);

  const page = useUserBillingProfileStore(state => state.page);
  const pageSize = useUserBillingProfileStore(state => state.pageSize);
  const setPage = useUserBillingProfileStore(state => state.setPage);

  const {
    data: summaryData,
    loading: summaryLoading,
    refetch: refetchSummary,
  } = useQuery(userBillingProfileSummaryQueryDocument, {
    variables: { userId, parentId: null },
    fetchPolicy: "cache-and-network",
  });

  const { data, loading, refetch } = useQuery(userBillingProfileInvoiceHistoryQueryDocument, {
    variables: {
      userId,
      parentId: null,
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
  });

  const totalCount = data?.parentInvoiceHistory?.totalCount ?? 0;

  const invoices = useMemo(
    () =>
      (data?.parentInvoiceHistory?.rows ?? []).map(inv => ({
        id: inv.id ?? "",
        invoiceNumber: (inv.id ?? "").slice(0, 8).toUpperCase(),
        month: inv.issueDate ? new Date(inv.issueDate).toLocaleString("en", { month: "long" }) : "",
        issueDate: formatDate(inv.issueDate),
        dueDate: formatDate(inv.dueDate),
        paidDate: inv.paidDate ? formatDate(inv.paidDate) : "—",
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
    [data?.parentInvoiceHistory, tProfile, tErrors, locale]
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

  const isLoading = summaryLoading || loading;

  const metrics = useMemo(() => buildParentMetrics(summary, labels), [summary, labels]);

  const hasPermission = useUserStore(state => state.hasPermission);
  const canManage = hasPermission(AppPermission.BillingUpdateStatusPaid);
  const canSubmitProof = hasPermission(AppPermission.BillingSubmitPaymentProof);
  const canCreate = hasPermission(AppPermission.BillingCreateInvoice);

  const handlePayNow = (invoice: MarkPaidInvoiceTarget) => {
    setProofTarget({
      ...invoice,
      parentUserId: userId,
      dueDate: invoice.dueDate ? formatDate(invoice.dueDate) : invoice.dueDate,
    });
  };

  const handleProofSuccess = () => {
    void refetch();
    void refetchSummary();
    notifications.show(labels.submitProofSuccess, {
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

  const handleDetailsSuccess = () => {
    void refetch();
    void refetchSummary();
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
    const firstUnpaid = invoices.find(inv => inv.status === InvoiceStatus.Unpaid);
    if (firstUnpaid) {
      handlePayNow({
        id: firstUnpaid.id,
        amount: firstUnpaid.fee,
        dueDate: firstUnpaid.dueDate,
        invoiceNumber: firstUnpaid.invoiceNumber,
      });
    } else {
      notifications.show(labels.noUnpaidInvoices, {
        severity: "info",
        autoHideDuration: 4000,
      });
    }
  };

  const filteredInvoices = useMemo(() => filterParentInvoices(invoices, searchQuery), [invoices, searchQuery]);

  const viewProps = {
    labels,
    summary,
    metrics,
    invoices: filteredInvoices,
    searchQuery,
    canManage,
    canSubmitProof,
    canView: hasPermission(AppPermission.BillingViewHistory),
    canCreate,
    onSearchChange: setSearchQuery,
    onPayNow: handlePayNow,
    onViewPaymentDetails: setDetailsTarget,
    onDownloadPdf: handleDownloadPdf,
    onQuickPay: handleQuickPay,
    page,
    pageSize,
    totalCount: searchQuery ? filteredInvoices.length : totalCount,
    onPageChange: setPage,
    loading: isLoading,
  };

  return (
    <RequirePermission permissions={[AppPermission.BillingViewHistory]}>
      <DisplayCurrencyHint />
      <UserBillingProfileView {...viewProps} />
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
        canManage={canManage}
        onSuccess={handleDetailsSuccess}
      />
    </RequirePermission>
  );
}
