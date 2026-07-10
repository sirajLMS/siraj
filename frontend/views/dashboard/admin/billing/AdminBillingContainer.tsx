"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Alert, Snackbar } from "@mui/material";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import {
  AppPermission,
  CurrencyCode,
  type InvoiceType as GqlInvoiceType,
  type StudentStatus as GqlStudentStatus,
  InvoiceStatus,
} from "@/frontend/graphql/generated/gql/graphql-types";
import {
  adminBillingSummaryQueryDocument,
  adminInvoicesQueryDocument,
  deleteInvoiceMutationDocument,
  sendPaymentReminderMutationDocument,
  studentCreditStatusQueryDocument,
} from "@/frontend/graphql/sharedDocuments";
import {
  formatBillingCurrencyTotals,
  mapBillingCurrencyBuckets,
} from "@/frontend/lib/formatBillingCurrencyTotals";
import { formatCurrencyForDisplay } from "@/frontend/lib/fx-render";
import { buildPaidMethodHint } from "@/frontend/lib/user-payment-method";
import { useAdminBillingStore } from "@/frontend/stores/adminBillingStore";
import { logger } from "@/frontend/utils/logger";
import { AdminBillingView } from "@/frontend/views/dashboard/admin/billing/AdminBillingView";
import { filterAdminInvoices } from "@/frontend/views/dashboard/admin/billing/utils/billingFilters";
import { buildBillingLabels } from "@/frontend/views/dashboard/admin/billing/utils/buildBillingLabels";
import { InvoicePaymentDetailsDialog } from "@/frontend/views/dashboard/billing/components/InvoicePaymentDetailsDialog";
import { MarkInvoicePaidDialog } from "@/frontend/views/dashboard/billing/components/MarkInvoicePaidDialog";
import type {
  AdminBillingSummary,
  AdminInvoiceRow,
  AdminInvoiceStatus,
  MarkPaidInvoiceTarget,
  PaymentDetailsTarget,
  StudentCreditRow,
} from "@/frontend/views/dashboard/billing/types/billingViewTypes";
import { useRouter } from "@/shared/i18n/routing";

interface AdminBillingContainerProps {
  readonly parentId?: string;
}

function mapInvoiceStatus(gqlStatus: string | null, dueDate: string | null): AdminInvoiceStatus {
  if (gqlStatus === InvoiceStatus.Paid) return InvoiceStatus.Paid;
  if (dueDate && new Date(dueDate) < new Date()) return "OVERDUE";
  return "PENDING";
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function deriveInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    const first = parts[0][0] ?? "";
    const second = parts.at(-1)?.[0] ?? "";
    return (first + second).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function AdminBillingContainer(_props: AdminBillingContainerProps) {
  const t = useTranslations("dashboard.billing");
  const tProfile = useTranslations("profile.teacher");
  const tErrors = useTranslations("errors");
  const tUi = useTranslations("ui.paymentMethod");
  const locale = useLocale();
  const tc = useTranslations("common");
  const router = useRouter();
  const labels = buildBillingLabels(t);

  const page = useAdminBillingStore(state => state.page);
  const pageSize = useAdminBillingStore(state => state.pageSize);
  const setPage = useAdminBillingStore(state => state.setPage);

  const [searchQuery, setSearchQuery] = useState("");
  const [markPaidTarget, setMarkPaidTarget] = useState<MarkPaidInvoiceTarget | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<PaymentDetailsTarget | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  const showFeedback = (message: string, severity: "success" | "error") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const {
    data: invoicesData,
    loading: invoicesLoading,
    refetch: refetchInvoices,
  } = useQuery(adminInvoicesQueryDocument, {
    variables: {
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

  const { data: summaryData, refetch: refetchSummary } = useQuery(adminBillingSummaryQueryDocument, {
    fetchPolicy: "cache-and-network",
  });

  const { data: creditData } = useQuery(studentCreditStatusQueryDocument, {
    fetchPolicy: "cache-and-network",
  });

  const [deleteInvoiceMutation, { loading: deletingInvoice }] = useMutation(deleteInvoiceMutationDocument, {
    onCompleted: () => {
      showFeedback(labels.deleteInvoiceSuccess, "success");
      void refetchInvoices();
      void refetchSummary();
    },
    onError: error => {
      logger.error("Delete invoice failed:", { error });
      showFeedback(tc("operationFailed"), "error");
    },
  });

  const [sendReminderMutation] = useMutation(sendPaymentReminderMutationDocument, {
    onCompleted: data => {
      if (data.sendPaymentReminder?.success) {
        showFeedback(t("reminderSent", { defaultValue: "Payment reminder sent" }), "success");
      }
    },
    onError: error => {
      logger.error("Send reminder failed:", { error });
      showFeedback(tc("operationFailed"), "error");
    },
  });

  const invoices: AdminInvoiceRow[] = useMemo(
    () =>
      (invoicesData?.adminInvoices?.rows ?? []).map(inv => ({
        id: inv.id ?? "",
        studentId: inv.studentId ?? null,
        studentName: inv.studentName ?? inv.studentId ?? "Student",
        studentInitials: deriveInitials(inv.studentName),
        dateIssued: formatDate(inv.issueDate),
        dueDate: formatDate(inv.dueDate),
        amount: formatCurrencyForDisplay(
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
        status: mapInvoiceStatus(inv.status, inv.dueDate),
        parentUserId: inv.parentUserId ?? null,
        paidMethodHint: buildPaidMethodHint(
          inv.latestPaymentMethodType,
          inv.latestPaymentMethodLabel,
          key => tUi(key as never)
        ),
      })),
    [invoicesData?.adminInvoices, locale, tErrors, tProfile, tUi]
  );

  const filteredInvoices = useMemo(() => filterAdminInvoices(invoices, searchQuery), [invoices, searchQuery]);

  const totalCount = invoicesData ? (invoicesData.adminInvoices?.totalCount ?? 0) : undefined;

  const summary: AdminBillingSummary = useMemo(() => {
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
      totalOutstanding: formatBillingCurrencyTotals(
        mapBillingCurrencyBuckets(summaryData?.adminBillingSummary?.outstandingByCurrency),
        locale,
        fxMessages
      ).primary,
      pendingInvoices: summaryData?.adminBillingSummary?.pendingCount ?? 0,
      negativeBalanceCount: `${summaryData?.adminBillingSummary?.negativeBalanceCount ?? 0} Students`,
      mtdRevenue: formatBillingCurrencyTotals(
        mapBillingCurrencyBuckets(summaryData?.adminBillingSummary?.mtdRevenueByCurrency),
        locale,
        fxMessages
      ).primary,
    };
  }, [summaryData?.adminBillingSummary, locale, tProfile, tErrors]);

  const creditRows: StudentCreditRow[] = useMemo(
    () =>
      (creditData?.studentCreditStatus ?? [])
        .filter(
          (
            row
          ): row is {
            id: string;
            studentName: string;
            parentEmail: string;
            planType: GqlInvoiceType | null;
            classesRemaining: number;
            classesTotal: number;
            status: GqlStudentStatus;
          } => row.id != null && row.studentName != null && row.parentEmail != null && row.status != null
        )
        .map(row => ({
          id: row.id,
          studentName: row.studentName,
          parentEmail: row.parentEmail,
          planType: row.planType,
          classesLeft: row.classesRemaining,
          classesTotal: row.classesTotal,
          status: row.classesRemaining === 0 ? ("negative_balance" as const) : ("active_credit" as const),
        })),
    [creditData?.studentCreditStatus]
  );

  const handleMarkAsPaid = (invoice: MarkPaidInvoiceTarget) => {
    setMarkPaidTarget(invoice);
  };

  const handleMarkPaidSuccess = () => {
    showFeedback(labels.markAsPaidSuccess, "success");
    void refetchInvoices();
    void refetchSummary();
  };

  const handleMarkPaidError = (message: string) => {
    showFeedback(message, "error");
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    void deleteInvoiceMutation({ variables: { invoiceId } });
  };

  const handleSendReminder = (studentId: string) => {
    void sendReminderMutation({ variables: { studentId } });
  };

  return (
    <RequirePermission permissions={[AppPermission.BillingViewHistory]} fallback={null}>
      <AdminBillingView
        labels={labels}
        summary={summary}
        invoices={filteredInvoices}
        creditRows={creditRows}
        searchQuery={searchQuery}
        canManage
        canView
        canCreate
        onSearchChange={setSearchQuery}
        onMarkAsPaid={handleMarkAsPaid}
        onViewPaymentDetails={setDetailsTarget}
        onSendReminder={handleSendReminder}
        onManualInvoice={() => {
          router.push("/billing/manual");
        }}
        onDeleteInvoice={handleDeleteInvoice}
        deletingInvoice={deletingInvoice}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        loading={invoicesLoading}
        onPageChange={setPage}
      />
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
