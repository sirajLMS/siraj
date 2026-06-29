"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { markInvoicePaidMutationDocument } from "@/frontend/graphql/sharedDocuments";
import {
  userBillingProfileInvoiceHistoryQueryDocument,
  userBillingProfileSummaryQueryDocument,
} from "@/frontend/graphql/sharedDocuments/user-billing-profile.documents";
import { useUserBillingProfileStore } from "@/frontend/stores/userBillingProfileStore";
import { buildParentMetrics } from "@/frontend/views/dashboard/billing/utils/billingMetrics";
import { buildBillingLabels } from "@/frontend/views/dashboard/billing/utils/buildBillingLabels";
import { InvoiceStatus } from "@/shared/lib/enum";
import type { UserBillingProfileContainerProps } from "./types/userBillingProfile.types";
import { UserBillingProfileView } from "./UserBillingProfileView";

function formatCurrency(amount: string, currency: string): string {
  const numAmount = Number(amount);
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(numAmount);
}

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
  const labels = buildBillingLabels(t);
  const notifications = useNotifications();

  const [searchQuery, setSearchQuery] = useState("");

  const page = useUserBillingProfileStore(state => state.page);
  const pageSize = useUserBillingProfileStore(state => state.pageSize);
  const setPage = useUserBillingProfileStore(state => state.setPage);

  const { data: summaryData, loading: summaryLoading } = useQuery(userBillingProfileSummaryQueryDocument, {
    variables: { userId, parentId: null },
    fetchPolicy: "cache-and-network",
  });

  const { data, loading } = useQuery(userBillingProfileInvoiceHistoryQueryDocument, {
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

  const [markAsPaidMutation] = useMutation(markInvoicePaidMutationDocument, {
    refetchQueries: [
      {
        query: userBillingProfileInvoiceHistoryQueryDocument,
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
      },
      {
        query: userBillingProfileSummaryQueryDocument,
        variables: { userId, parentId: null },
      },
    ],
    onCompleted: () => {
      notifications.show(t("markAsPaidSuccess", { defaultValue: "Invoice marked as paid" }), {
        severity: "success",
        autoHideDuration: 4000,
      });
    },
    onError: err => {
      notifications.show(err.message, {
        severity: "error",
        autoHideDuration: 5000,
      });
    },
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
        paidDate: inv.paidDate ?? "—",
        fee: `${inv.currency} ${inv.amount}`,
        status: inv.status === InvoiceStatus.PAID ? InvoiceStatus.PAID : InvoiceStatus.UNPAID,
      })),
    [data?.parentInvoiceHistory]
  );

  const summary = useMemo(
    () => ({
      outstandingBalance: formatCurrency(summaryData?.parentBillingSummary?.outstandingBalance ?? "0.00", "USD"),
      paidThisTerm: formatCurrency(summaryData?.parentBillingSummary?.paidThisTerm ?? "0.00", "USD"),
      nextDueDate: formatDate(summaryData?.parentBillingSummary?.nextDueDate ?? null),
      activeStudents: String(summaryData?.parentBillingSummary?.activeStudents ?? 0),
    }),
    [summaryData?.parentBillingSummary]
  );

  const isLoading = summaryLoading || loading;

  const metrics = useMemo(() => buildParentMetrics(summary, labels), [summary, labels]);

  const handlePayNow = (invoiceId: string) => {
    void markAsPaidMutation({ variables: { invoiceId, expectedVersion: null } });
  };

  const viewProps = {
    labels,
    summary,
    metrics,
    invoices: invoices,
    searchQuery,
    canManage: false,
    canView: true,
    canCreate: false,
    onSearchChange: setSearchQuery,
    onPayNow: handlePayNow,
    onDownloadPdf: () => {},
    onQuickPay: () => {},
    page,
    pageSize,
    totalCount,
    onPageChange: setPage,
    loading: isLoading,
  };

  return (
    <RequirePermission permissions={[AppPermission.BillingViewHistory]}>
      <UserBillingProfileView {...viewProps} />
    </RequirePermission>
  );
}
