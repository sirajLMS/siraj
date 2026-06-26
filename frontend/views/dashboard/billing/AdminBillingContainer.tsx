"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Alert, Snackbar } from "@mui/material";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { deleteInvoiceMutationDocument, markInvoicePaidMutationDocument } from "@/frontend/graphql/sharedDocuments";
import { parentInvoiceHistoryQueryDocument } from "@/frontend/graphql/sharedDocuments/parent-billing-history.documents";
import { useAdminBillingStore } from "@/frontend/stores/adminBillingStore";
import { AdminBillingView } from "./AdminBillingView";
import type { AdminBillingSummary, AdminInvoiceRow, AdminInvoiceStatus } from "./types/billingViewTypes";
import { filterAdminInvoices } from "./utils/billingFilters";
import { buildBillingLabels } from "./utils/buildBillingLabels";

interface AdminBillingContainerProps {
  readonly parentId?: string;
}

function mapInvoiceStatus(gqlStatus: string | null, dueDate: string | null): AdminInvoiceStatus {
  if (gqlStatus === "PAID") return "paid";
  if (dueDate && new Date(dueDate) < new Date()) return "overdue";
  return "pending";
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

function deriveInitials(studentId: string | null): string {
  if (!studentId) return "?";
  return studentId.slice(0, 2).toUpperCase();
}

export function AdminBillingContainer({ parentId }: AdminBillingContainerProps) {
  const t = useTranslations("dashboard.billing");
  const router = useRouter();
  const locale = useLocale();
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

  const { data: invoicesData, refetch: refetchInvoices } = useQuery(parentInvoiceHistoryQueryDocument, {
    variables: {
      parentId: parentId ?? "",
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
    skip: !parentId,
  });

  const [markAsPaidMutation, { loading: markingPaid }] = useMutation(markInvoicePaidMutationDocument, {
    onCompleted: () => {
      showFeedback(labels.markAsPaidSuccess, "success");
      void refetchInvoices();
    },
    onError: error => {
      showFeedback(error.message, "error");
    },
  });

  const [deleteInvoiceMutation, { loading: deletingInvoice }] = useMutation(deleteInvoiceMutationDocument, {
    onCompleted: () => {
      showFeedback(labels.deleteInvoiceSuccess, "success");
      void refetchInvoices();
    },
    onError: error => {
      showFeedback(error.message, "error");
    },
  });

  const invoices: AdminInvoiceRow[] = useMemo(
    () =>
      (invoicesData?.parentInvoiceHistory?.rows ?? []).map(inv => ({
        id: inv.id ?? "",
        studentName: inv.studentId ?? "Student",
        studentInitials: deriveInitials(inv.studentId),
        dateIssued: formatDate(inv.issueDate),
        amount: formatCurrency(inv.amount, inv.currency),
        status: mapInvoiceStatus(inv.status, inv.dueDate),
      })),
    [invoicesData?.parentInvoiceHistory]
  );

  const filteredInvoices = useMemo(() => filterAdminInvoices(invoices, searchQuery), [invoices, searchQuery]);

  const totalCount = invoicesData?.parentInvoiceHistory?.totalCount ?? 0;

  const summary: AdminBillingSummary = useMemo(
    () => ({
      totalOutstanding: formatCurrency(
        String(
          invoices
            .filter(i => i.status !== "paid")
            .reduce((sum, i) => sum + Number(i.amount.replace(/[^0-9.-]/g, "")), 0)
        ),
        "USD"
      ),
      pendingInvoices: invoices.filter(i => i.status !== "paid").length,
      negativeBalanceCount: "0 Students",
      mtdRevenue: formatCurrency(
        String(
          invoices
            .filter(i => i.status === "paid")
            .reduce((sum, i) => sum + Number(i.amount.replace(/[^0-9.-]/g, "")), 0)
        ),
        "USD"
      ),
    }),
    [invoices]
  );

  const handleMarkAsPaid = (invoiceId: string) => {
    void markAsPaidMutation({ variables: { invoiceId, expectedVersion: null } });
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    void deleteInvoiceMutation({ variables: { invoiceId } });
  };

  return (
    <RequirePermission permissions={[AppPermission.BillingViewHistory]} fallback={null}>
      <AdminBillingView
        labels={labels}
        summary={summary}
        invoices={filteredInvoices}
        creditRows={[]}
        searchQuery={searchQuery}
        canManage
        canView
        canCreate
        onSearchChange={setSearchQuery}
        onMarkAsPaid={handleMarkAsPaid}
        onSendReminder={() => {}}
        onManualInvoice={() => {
          router.push(`/${locale}/billing/manual`);
        }}
        onDeleteInvoice={handleDeleteInvoice}
        markingPaid={markingPaid}
        deletingInvoice={deletingInvoice}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
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
