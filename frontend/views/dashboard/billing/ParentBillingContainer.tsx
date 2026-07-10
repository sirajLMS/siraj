"use client";

import { useQuery } from "@apollo/client/react";
import { Alert, Box, CircularProgress, Snackbar, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission, CurrencyCode, InvoiceStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  parentBillingSummaryQueryDocument,
  parentInvoiceHistoryQueryDocument,
} from "@/frontend/graphql/sharedDocuments/parents/parent-billing-history.documents";
import { formatLockedAmount } from "@/frontend/lib/currency";
import { formatCurrencyForDisplay } from "@/frontend/lib/fx-render";
import { useParentBillingStore } from "@/frontend/stores/parentBillingStore";
import { useUserStore } from "@/frontend/stores/userStore";
import { MarkInvoicePaidDialog } from "@/frontend/views/dashboard/billing/components/MarkInvoicePaidDialog";
import { InvoicePaymentDetailsDialog } from "@/frontend/views/dashboard/billing/components/InvoicePaymentDetailsDialog";
import { ParentBillingView } from "@/frontend/views/dashboard/billing/ParentBillingView";
import type { MarkPaidInvoiceTarget, ParentBillingViewProps } from "@/frontend/views/dashboard/billing/types/billingViewTypes";
import { filterParentInvoices } from "@/frontend/views/dashboard/billing/utils/billingFilters";
import { buildBillingLabels } from "@/frontend/views/dashboard/billing/utils/buildBillingLabels";

const StyledErrorTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.error.main,
}));

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
  const tProfile = useTranslations("profile.teacher");
  const tErrors = useTranslations("errors");
  const locale = useLocale();
  const tc = useTranslations("common");
  const labels = buildBillingLabels(t);

  const [searchQuery, setSearchQuery] = useState("");
  const [markPaidTarget, setMarkPaidTarget] = useState<MarkPaidInvoiceTarget | null>(null);
  const [detailsInvoiceId, setDetailsInvoiceId] = useState<string | null>(null);
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

  const parentUserId = useUserStore(state => state.user?.id ?? null);

  const { data, loading, error, refetch } = useQuery(parentInvoiceHistoryQueryDocument, {
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

  const handlePayNow = (invoice: MarkPaidInvoiceTarget) => {
    setMarkPaidTarget({ ...invoice, parentUserId: parentUserId ?? invoice.parentUserId });
  };

  const handleMarkPaidSuccess = () => {
    showFeedback(t("markAsPaidSuccess", { defaultValue: "Invoice marked as paid" }), "success");
    void refetch();
  };

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
        searchQuery
      ),
    [invoices, searchQuery, tProfile, tErrors, locale]
  );

  const summary = useMemo(
    () => ({
      outstandingBalance: formatLockedAmount(
        summaryData?.parentBillingSummary?.outstandingBalance ?? "0.00",
        CurrencyCode.Usd,
        locale
      ),
      paidThisTerm: formatLockedAmount(
        summaryData?.parentBillingSummary?.paidThisTerm ?? "0.00",
        CurrencyCode.Usd,
        locale
      ),
      nextDueDate: formatDate(summaryData?.parentBillingSummary?.nextDueDate ?? null),
      activeStudents: String(summaryData?.parentBillingSummary?.activeStudents ?? 0),
    }),
    [summaryData?.parentBillingSummary, locale]
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
    onViewPaymentDetails: setDetailsInvoiceId,
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
      <MarkInvoicePaidDialog
        open={markPaidTarget !== null}
        onClose={() => setMarkPaidTarget(null)}
        invoiceId={markPaidTarget?.id ?? null}
        targetUserId={markPaidTarget?.parentUserId ?? parentUserId}
        onSuccess={handleMarkPaidSuccess}
      />
      <InvoicePaymentDetailsDialog
        open={detailsInvoiceId !== null}
        onClose={() => setDetailsInvoiceId(null)}
        invoiceId={detailsInvoiceId}
      />
    </RequirePermission>
  );
}
