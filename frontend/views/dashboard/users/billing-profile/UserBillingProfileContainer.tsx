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
import {
  formatBillingCurrencyTotals,
  mapBillingCurrencyBuckets,
} from "@/frontend/lib/formatBillingCurrencyTotals";
import { formatCurrencyForDisplay } from "@/frontend/lib/fx-render";
import { buildPaidMethodHint } from "@/frontend/lib/user-payment-method";
import { useUserBillingProfileStore } from "@/frontend/stores/userBillingProfileStore";
import { useUserStore } from "@/frontend/stores/userStore";
import { InvoicePaymentDetailsDialog } from "@/frontend/views/dashboard/billing/components/InvoicePaymentDetailsDialog";
import { MarkInvoicePaidDialog } from "@/frontend/views/dashboard/billing/components/MarkInvoicePaidDialog";
import type {
  MarkPaidInvoiceTarget,
  PaymentDetailsTarget,
} from "@/frontend/views/dashboard/billing/types/billingViewTypes";
import { filterParentInvoices } from "@/frontend/views/dashboard/billing/utils/billingFilters";
import { buildParentMetrics } from "@/frontend/views/dashboard/billing/utils/billingMetrics";
import { buildBillingLabels } from "@/frontend/views/dashboard/billing/utils/buildBillingLabels";
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

export function UserBillingProfileContainer({ userId }: Readonly<UserBillingProfileContainerProps>) {
  const t = useTranslations("dashboard.billing");
  const tProfile = useTranslations("profile.teacher");
  const tErrors = useTranslations("errors");
  const tUi = useTranslations("ui.paymentMethod");
  const locale = useLocale();
  const labels = buildBillingLabels(t);
  const notifications = useNotifications();

  const [searchQuery, setSearchQuery] = useState("");
  const [markPaidTarget, setMarkPaidTarget] = useState<MarkPaidInvoiceTarget | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<PaymentDetailsTarget | null>(null);

  const page = useUserBillingProfileStore(state => state.page);
  const pageSize = useUserBillingProfileStore(state => state.pageSize);
  const setPage = useUserBillingProfileStore(state => state.setPage);

  const { data: summaryData, loading: summaryLoading, refetch: refetchSummary } = useQuery(
    userBillingProfileSummaryQueryDocument,
    {
      variables: { userId, parentId: null },
      fetchPolicy: "cache-and-network",
    }
  );

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
        issueDate: inv.issueDate ?? "",
        dueDate: inv.dueDate ?? "",
        paidDate: inv.paidDate ? formatDate(inv.paidDate) : "—",
        paidMethodHint: buildPaidMethodHint(
          inv.latestPaymentMethodType,
          inv.latestPaymentMethodLabel,
          key => tUi(key as never)
        ),
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
        status: inv.status === InvoiceStatus.Paid ? InvoiceStatus.Paid : InvoiceStatus.Unpaid,
      })),
    [data?.parentInvoiceHistory, tProfile, tErrors, locale, tUi]
  );

  const summary = useMemo(() => {
    const fxMessages = {
      convertedAmount: (values: {
        lockedAmount: string;
        lockedCurrency: string;
        convertedApprox: string;
        displayCurrency: string;
      }) => tProfile("convertedAmount", values),
      displayCurrencyFallback: (values: { lockedAmount: string; lockedCurrency: string }) =>
        tErrors("displayCurrencyFallback", values),
    };

    return {
      outstandingBalance: formatBillingCurrencyTotals(
        mapBillingCurrencyBuckets(summaryData?.parentBillingSummary?.outstandingByCurrency),
        locale,
        fxMessages
      ).primary,
      paidThisTerm: formatBillingCurrencyTotals(
        mapBillingCurrencyBuckets(summaryData?.parentBillingSummary?.paidThisTermByCurrency),
        locale,
        fxMessages
      ).primary,
      nextDueDate: formatDate(summaryData?.parentBillingSummary?.nextDueDate ?? null),
      activeStudents: String(summaryData?.parentBillingSummary?.activeStudents ?? 0),
    };
  }, [summaryData?.parentBillingSummary, locale, tProfile, tErrors]);

  const isLoading = summaryLoading || loading;

  const metrics = useMemo(() => buildParentMetrics(summary, labels), [summary, labels]);

  const hasPermission = useUserStore(state => state.hasPermission);
  const canManage = hasPermission(AppPermission.BillingUpdateStatusPaid);
  const canCreate = hasPermission(AppPermission.BillingCreateInvoice);

  const handlePayNow = (invoice: MarkPaidInvoiceTarget) => {
    setMarkPaidTarget({ ...invoice, parentUserId: userId });
  };

  const handleMarkPaidSuccess = () => {
    void refetch();
    void refetchSummary();
    notifications.show(t("markAsPaidSuccess", { defaultValue: "Invoice marked as paid" }), {
      severity: "success",
      autoHideDuration: 4000,
    });
  };

  const handleMarkPaidError = (message: string) => {
    notifications.show(message, {
      severity: "error",
      autoHideDuration: 6000,
    });
  };

  const handleDownloadPdf = (invoiceId: string) => {
    window.open(`/api/invoices/${invoiceId}/download`, "_blank", "noopener,noreferrer");
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
      <UserBillingProfileView {...viewProps} />
      <MarkInvoicePaidDialog
        open={markPaidTarget !== null}
        onClose={() => setMarkPaidTarget(null)}
        invoice={markPaidTarget}
        onSuccess={handleMarkPaidSuccess}
        onError={handleMarkPaidError}
      />
      <InvoicePaymentDetailsDialog
        open={detailsTarget !== null}
        onClose={() => setDetailsTarget(null)}
        invoiceId={detailsTarget?.invoiceId ?? null}
        isLegacyPaid={detailsTarget?.isLegacyPaid ?? false}
      />
    </RequirePermission>
  );
}
