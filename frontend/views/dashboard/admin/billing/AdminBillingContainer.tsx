"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Alert, Snackbar } from "@mui/material";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import {
  AppPermission,
  type InvoiceType as GqlInvoiceType,
  type StudentStatus as GqlStudentStatus,
  InvoiceStatus,
} from "@/frontend/graphql/generated/gql/graphql-types";
import {
  deleteInvoiceMutationDocument,
  markInvoicePaidMutationDocument,
  sendPaymentReminderMutationDocument,
} from "@/frontend/graphql/sharedDocuments";
import {
  adminBillingSummaryQueryDocument,
  adminInvoicesQueryDocument,
  studentCreditStatusQueryDocument,
} from "@/frontend/graphql/sharedDocuments/parent-billing-history.documents";
import { useAdminBillingStore } from "@/frontend/stores/adminBillingStore";
import { logger } from "@/frontend/utils/logger";
import type {
  AdminBillingSummary,
  AdminInvoiceRow,
  AdminInvoiceStatus,
  StudentCreditRow,
} from "@/frontend/views/dashboard/billing/types/billingViewTypes";
import { useRouter } from "@/shared/i18n/routing";
import { AdminBillingView } from "./AdminBillingView";
import { filterAdminInvoices } from "./utils/billingFilters";
import { buildBillingLabels } from "./utils/buildBillingLabels";

interface AdminBillingContainerProps {
  readonly parentId?: string;
}

function mapInvoiceStatus(gqlStatus: string | null, dueDate: string | null): AdminInvoiceStatus {
  if (gqlStatus === InvoiceStatus.Paid) return InvoiceStatus.Paid;
  if (dueDate && new Date(dueDate) < new Date()) return "OVERDUE";
  return "PENDING";
}

function formatCurrency(amount: string | null, currency: string | null): string {
  const numAmount = Number(amount ?? 0);
  const curr = currency ?? "USD";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: curr }).format(numAmount);
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
  const tc = useTranslations("common");
  const router = useRouter();
  const labels = buildBillingLabels(t);

  const page = useAdminBillingStore(state => state.page);
  const pageSize = useAdminBillingStore(state => state.pageSize);
  const setPage = useAdminBillingStore(state => state.setPage);

  const [searchQuery, setSearchQuery] = useState("");
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

  const { data: summaryData } = useQuery(adminBillingSummaryQueryDocument, {
    fetchPolicy: "cache-and-network",
  });

  const { data: creditData } = useQuery(studentCreditStatusQueryDocument, {
    fetchPolicy: "cache-and-network",
  });

  const [markAsPaidMutation, { loading: markingPaid }] = useMutation(markInvoicePaidMutationDocument, {
    onCompleted: () => {
      showFeedback(labels.markAsPaidSuccess, "success");
      void refetchInvoices();
    },
    onError: error => {
      logger.error("Mark as paid failed:", { error });
      showFeedback(tc("operationFailed"), "error");
    },
  });

  const [deleteInvoiceMutation, { loading: deletingInvoice }] = useMutation(deleteInvoiceMutationDocument, {
    onCompleted: () => {
      showFeedback(labels.deleteInvoiceSuccess, "success");
      void refetchInvoices();
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
        amount: formatCurrency(inv.amount, inv.currency),
        status: mapInvoiceStatus(inv.status, inv.dueDate),
      })),
    [invoicesData?.adminInvoices]
  );

  const filteredInvoices = useMemo(() => filterAdminInvoices(invoices, searchQuery), [invoices, searchQuery]);

  const totalCount = invoicesData ? (invoicesData.adminInvoices?.totalCount ?? 0) : undefined;

  const summary: AdminBillingSummary = useMemo(
    () => ({
      totalOutstanding: formatCurrency(summaryData?.adminBillingSummary?.totalOutstanding ?? "0.00", "USD"),
      pendingInvoices: summaryData?.adminBillingSummary?.pendingCount ?? 0,
      negativeBalanceCount: `${summaryData?.adminBillingSummary?.negativeBalanceCount ?? 0} Students`,
      mtdRevenue: formatCurrency(summaryData?.adminBillingSummary?.mtdRevenue ?? "0.00", "USD"),
    }),
    [summaryData?.adminBillingSummary]
  );

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

  const handleMarkAsPaid = (invoiceId: string) => {
    void markAsPaidMutation({ variables: { invoiceId, expectedVersion: null } });
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
        onSendReminder={handleSendReminder}
        onManualInvoice={() => {
          router.push("/billing/manual");
        }}
        onDeleteInvoice={handleDeleteInvoice}
        markingPaid={markingPaid}
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
    </RequirePermission>
  );
}
