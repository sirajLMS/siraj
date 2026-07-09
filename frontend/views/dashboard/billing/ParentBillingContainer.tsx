"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Alert, Box, CircularProgress, Snackbar, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission, InvoiceStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import { markInvoicePaidMutationDocument } from "@/frontend/graphql/sharedDocuments";
import {
  parentBillingSummaryQueryDocument,
  parentInvoiceHistoryQueryDocument,
} from "@/frontend/graphql/sharedDocuments/parent-billing-history.documents";
import { useParentBillingStore } from "@/frontend/stores/parentBillingStore";
import { logger } from "@/frontend/utils/logger";
import { ParentBillingView } from "@/frontend/views/dashboard/billing/ParentBillingView";
import type { ParentBillingViewProps } from "@/frontend/views/dashboard/billing/types/billingViewTypes";
import { filterParentInvoices } from "@/frontend/views/dashboard/billing/utils/billingFilters";
import { buildBillingLabels } from "@/frontend/views/dashboard/billing/utils/buildBillingLabels";

const StyledErrorTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.error.main,
}));

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

export function ParentBillingContainer() {
  const t = useTranslations("dashboard.billing");
  const tc = useTranslations("common");
  const labels = buildBillingLabels(t);

  const [searchQuery, setSearchQuery] = useState("");
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

  const { data, loading, error } = useQuery(parentInvoiceHistoryQueryDocument, {
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

  const { data: summaryData } = useQuery(parentBillingSummaryQueryDocument, {
    variables: { parentId: null, userId: null },
    fetchPolicy: "cache-and-network",
  });

  const [markAsPaidMutation] = useMutation(markInvoicePaidMutationDocument, {
    onCompleted: () => {
      showFeedback(t("markAsPaidSuccess", { defaultValue: "Invoice marked as paid" }), "success");
    },
    onError: err => {
      logger.error("Mark as paid failed:", { err });
      showFeedback(tc("operationFailed"), "error");
    },
  });

  const totalCount = data ? (data.parentInvoiceHistory?.totalCount ?? 0) : undefined;

  const invoices = useMemo(() => data?.parentInvoiceHistory?.rows ?? [], [data?.parentInvoiceHistory]);

  const filteredInvoices = useMemo(
    () =>
      filterParentInvoices(
        invoices.map(inv => ({
          id: inv.id ?? "",
          invoiceNumber: (inv.id ?? "").slice(0, 8).toUpperCase(),
          month: inv.issueDate ? new Date(inv.issueDate).toLocaleString("en", { month: "long" }) : "",
          issueDate: inv.issueDate ?? "",
          dueDate: inv.dueDate ?? "",
          paidDate: inv.paidDate ?? "—",
          fee: `${inv.currency} ${inv.amount}`,
          status: inv.status === InvoiceStatus.Paid ? InvoiceStatus.Paid : InvoiceStatus.Unpaid,
        })),
        searchQuery
      ),
    [invoices, searchQuery]
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

  const handlePayNow = (invoiceId: string) => {
    void markAsPaidMutation({ variables: { invoiceId, expectedVersion: null } });
  };

  const viewProps: ParentBillingViewProps = {
    labels,
    summary,
    invoices: filteredInvoices,
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
    loading,
    onPageChange: setPage,
  };

  return (
    <RequirePermission permissions={[AppPermission.BillingViewHistory]}>
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
    </RequirePermission>
  );
}
