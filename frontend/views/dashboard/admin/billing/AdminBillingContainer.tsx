"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { Alert, Box, Button, CircularProgress, Snackbar, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import {
  AppPermission,
  CurrencyCode,
  type InvoiceType as GqlInvoiceType,
  type StudentStatus as GqlStudentStatus,
} from "@/frontend/graphql/generated/gql/graphql-types";
import {
  adminBillingSummaryQueryDocument,
  adminInvoicesQueryDocument,
  deleteInvoiceMutationDocument,
  sendPaymentReminderMutationDocument,
  studentCreditStatusQueryDocument,
} from "@/frontend/graphql/sharedDocuments";
import { useImpersonation } from "@/frontend/hooks/useImpersonation";
import { buildFxDisplayMessages } from "@/frontend/lib/buildFxDisplayMessages";
import { formatBillingCurrencyTotals, mapBillingCurrencyBuckets } from "@/frontend/lib/formatBillingCurrencyTotals";
import { formatCurrencyForDisplay } from "@/frontend/lib/fx-render";
import { useAdminBillingStore } from "@/frontend/stores/adminBillingStore";
import { useUserStore } from "@/frontend/stores/userStore";
import { logger } from "@/frontend/utils/logger";
import { AdminBillingView } from "@/frontend/views/dashboard/admin/billing/AdminBillingView";
import { DeleteInvoiceDialog } from "@/frontend/views/dashboard/admin/billing/components/DeleteInvoiceDialog";
import { buildBillingLabels } from "@/frontend/views/dashboard/admin/billing/utils/buildBillingLabels";
import { BillingImpersonationNotice } from "@/frontend/views/dashboard/billing/components/BillingImpersonationNotice";
import { InvoicePaymentDetailsDialog } from "@/frontend/views/dashboard/billing/components/InvoicePaymentDetailsDialog";
import { SubmitPaymentProofDialog } from "@/frontend/views/dashboard/billing/components/SubmitPaymentProofDialog";
import { useBillingPollInterval } from "@/frontend/views/dashboard/billing/hooks/useBillingPollInterval";
import { useRefetchOnWindowFocus } from "@/frontend/views/dashboard/billing/hooks/useRefetchOnWindowFocus";
import type {
  AdminBillingSummary,
  AdminInvoiceRow,
  CreditFilter,
  MarkPaidInvoiceTarget,
  PaymentDetailsTarget,
  StudentCreditRow,
} from "@/frontend/views/dashboard/billing/types/billingViewTypes";
import { formatBillingDate } from "@/frontend/views/dashboard/billing/utils/formatBillingDate";
import { deriveAdminInvoiceDisplayStatus } from "@/frontend/views/dashboard/billing/utils/invoiceDisplayStatus";
import { DisplayCurrencyHint } from "@/frontend/views/dashboard/components/DisplayCurrencyHint";
import { FxConversionNote } from "@/frontend/views/dashboard/components/FxConversionNote";
import { useRouter } from "@/shared/i18n/routing";

const StyledErrorTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.error.main,
}));

interface AdminBillingContainerProps {
  readonly parentId?: string;
}

function formatDate(dateStr: string | null, locale: string): string {
  return formatBillingDate(dateStr, locale);
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
  const tProfileRoot = useTranslations("profile");
  const tErrors = useTranslations("errors");
  const locale = useLocale();
  const tc = useTranslations("common");
  const router = useRouter();
  const labels = buildBillingLabels(t);
  const { isImpersonating } = useImpersonation();
  const billingActionsDisabled = isImpersonating;
  const hasPermission = useUserStore(state => state.hasPermission);
  const viewerDisplayCurrency = useUserStore(state => state.displayCurrency);
  const canViewExchangeRates = hasPermission(AppPermission.BillingViewExchangeRates);
  const canManage = hasPermission(AppPermission.BillingUpdateStatusPaid);
  const canCreate = hasPermission(AppPermission.BillingCreateInvoice);
  const canDelete = hasPermission(AppPermission.BillingDeleteInvoice);

  const fxMessages = useMemo(
    () => buildFxDisplayMessages(tProfile, tErrors, tProfileRoot),
    [tProfile, tErrors, tProfileRoot]
  );

  const page = useAdminBillingStore(state => state.page);
  const pageSize = useAdminBillingStore(state => state.pageSize);
  const setPage = useAdminBillingStore(state => state.setPage);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [creditFilter, setCreditFilter] = useState<CreditFilter>("all");
  const [proofTarget, setProofTarget] = useState<MarkPaidInvoiceTarget | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<PaymentDetailsTarget | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  const showFeedback = (message: string, severity: "success" | "error") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const debouncedApplySearch = useDebouncedCallback((value: string) => {
    setDebouncedSearch(value.trim());
    setPage(0);
  }, 300);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    debouncedApplySearch(value);
  };

  const isSearchPending = searchQuery.trim() !== debouncedSearch.trim();
  const billingDialogsOpen = proofTarget !== null || detailsTarget !== null || deleteTargetId !== null;
  const pollInterval = useBillingPollInterval(billingDialogsOpen);

  const {
    data: invoicesData,
    loading: invoicesLoading,
    error: invoicesError,
    refetch: refetchInvoices,
  } = useQuery(adminInvoicesQueryDocument, {
    variables: {
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
    fetchPolicy: "cache-and-network",
    pollInterval,
  });

  const {
    data: summaryData,
    loading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery(adminBillingSummaryQueryDocument, {
    fetchPolicy: "cache-and-network",
    pollInterval,
  });

  const refreshBillingData = useCallback(() => {
    void refetchInvoices();
    void refetchSummary();
  }, [refetchInvoices, refetchSummary]);

  useRefetchOnWindowFocus(refreshBillingData);

  const {
    data: creditData,
    loading: creditLoading,
    error: creditError,
    refetch: refetchCredit,
  } = useQuery(studentCreditStatusQueryDocument, {
    fetchPolicy: "cache-and-network",
  });

  const [deleteInvoiceMutation, { loading: deletingInvoice }] = useMutation(deleteInvoiceMutationDocument, {
    onCompleted: () => {
      setDeleteTargetId(null);
      showFeedback(labels.deleteInvoiceSuccess, "success");
      void refetchInvoices();
      void refetchSummary();
      void refetchCredit();
    },
    onError: error => {
      logger.error("Delete invoice failed:", { error });
      setDeleteTargetId(null);
      showFeedback(tc("operationFailed"), "error");
    },
  });

  const [sendReminderMutation] = useMutation(sendPaymentReminderMutationDocument, {
    onCompleted: data => {
      if (data.sendPaymentReminder?.success) {
        showFeedback(t("reminderSent"), "success");
      } else {
        showFeedback(t("reminderFailed"), "error");
      }
      setSendingReminderId(null);
    },
    onError: error => {
      logger.error("Send reminder failed:", { error });
      showFeedback(tc("operationFailed"), "error");
      setSendingReminderId(null);
    },
  });

  const invoices: AdminInvoiceRow[] = useMemo(
    () =>
      (invoicesData?.adminInvoices?.rows ?? []).map(inv => ({
        id: inv.id ?? "",
        studentId: inv.studentId ?? null,
        studentName: inv.studentName ?? inv.studentId ?? "Student",
        studentInitials: deriveInitials(inv.studentName),
        dateIssued: formatDate(inv.issueDate, locale),
        dueDate: formatDate(inv.dueDate, locale),
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
          fxMessages
        ),
        status: deriveAdminInvoiceDisplayStatus(inv.status, inv.dueDate),
        parentUserId: inv.parentUserId ?? null,
        hasPaymentProof: inv.hasPaymentProof ?? false,
        hasRejectedSubmission: inv.hasRejectedSubmission ?? false,
      })),
    [invoicesData?.adminInvoices, locale, fxMessages]
  );

  const totalCount = invoicesData ? (invoicesData.adminInvoices?.totalCount ?? 0) : undefined;

  const summary: AdminBillingSummary = useMemo(() => {
    const outstandingTotals = formatBillingCurrencyTotals(
      mapBillingCurrencyBuckets(summaryData?.adminBillingSummary?.outstandingByCurrency),
      locale,
      fxMessages
    );
    const mtdRevenueTotals = formatBillingCurrencyTotals(
      mapBillingCurrencyBuckets(summaryData?.adminBillingSummary?.mtdRevenueByCurrency),
      locale,
      fxMessages
    );

    return {
      totalOutstanding: outstandingTotals.primary,
      totalOutstandingSubLabel: outstandingTotals.breakdown,
      pendingInvoices: summaryData?.adminBillingSummary?.pendingCount ?? 0,
      negativeBalanceCount: t("adminMetrics.negativeBalance", {
        count: summaryData?.adminBillingSummary?.negativeBalanceCount ?? 0,
      }),
      mtdRevenue: mtdRevenueTotals.primary,
      mtdRevenueSubLabel: mtdRevenueTotals.breakdown,
    };
  }, [summaryData?.adminBillingSummary, locale, fxMessages, t]);

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

  const filteredCreditRows = useMemo(
    () =>
      creditFilter === "negative_balance" ? creditRows.filter(row => row.status === "negative_balance") : creditRows,
    [creditFilter, creditRows]
  );

  const handleViewAllNegativeBalance = () => {
    setCreditFilter("negative_balance");
    document.getElementById("student-credit-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleClearCreditFilter = () => {
    setCreditFilter("all");
  };

  const handleMarkAsPaid = (invoice: MarkPaidInvoiceTarget) => {
    if (billingActionsDisabled) {
      showFeedback(tErrors("auth.impersonationNotAllowedDuringSession"), "error");
      return;
    }
    setProofTarget(invoice);
  };

  const handleProofSuccess = () => {
    showFeedback(labels.markAsPaidSuccess, "success");
    void refetchInvoices();
    void refetchSummary();
  };

  const handleProofError = (message: string) => {
    showFeedback(message, "error");
  };

  const handleDetailsSuccess = (action: "approve" | "reject") => {
    showFeedback(action === "approve" ? labels.approveProofSuccess : labels.rejectProofSuccess, "success");
    void refetchInvoices();
    void refetchSummary();
  };

  const handleRequestDeleteInvoice = (invoiceId: string) => {
    if (billingActionsDisabled) {
      showFeedback(tErrors("auth.impersonationNotAllowedDuringSession"), "error");
      return;
    }
    setDeleteTargetId(invoiceId);
  };

  const handleConfirmDeleteInvoice = () => {
    if (!deleteTargetId || deletingInvoice) {
      return;
    }
    void deleteInvoiceMutation({ variables: { invoiceId: deleteTargetId } });
  };

  const refreshAfterDialogClose = useCallback(() => {
    void refetchInvoices();
    void refetchSummary();
  }, [refetchInvoices, refetchSummary]);

  const handleSendReminder = (studentId: string) => {
    if (billingActionsDisabled) {
      showFeedback(tErrors("auth.impersonationNotAllowedDuringSession"), "error");
      return;
    }
    setSendingReminderId(studentId);
    void sendReminderMutation({ variables: { studentId } });
  };

  if (invoicesLoading && !invoicesData) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (invoicesError) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, mt: 8 }}>
        <StyledErrorTypography>{tc("loadFailed")}</StyledErrorTypography>
        <Button variant="outlined" onClick={refreshBillingData}>
          {labels.errors.retry}
        </Button>
      </Box>
    );
  }

  return (
    <RequirePermission permissions={[AppPermission.BillingViewHistory]} fallback={null}>
      <DisplayCurrencyHint />
      <FxConversionNote />
      {viewerDisplayCurrency ? (
        <Typography variant="caption" sx={theme => ({ display: "block", mb: 1, color: theme.palette.text.secondary })}>
          {t("adminBillingFxNote")}
        </Typography>
      ) : null}
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
          {tc("loadFailed")}
        </Alert>
      ) : null}
      {creditError ? (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => void refetchCredit()}>
              {labels.errors.retry}
            </Button>
          }
        >
          {tc("loadFailed")}
        </Alert>
      ) : null}
      <AdminBillingView
        labels={labels}
        summary={summary}
        summaryLoading={summaryLoading}
        invoices={invoices}
        creditRows={filteredCreditRows}
        creditLoading={creditLoading}
        creditError={creditError}
        sendingReminderId={sendingReminderId}
        searchQuery={searchQuery}
        isSearchPending={isSearchPending}
        billingActionsDisabled={billingActionsDisabled}
        creditFilter={creditFilter}
        canManage={canManage}
        canSubmitProof={false}
        canView
        canCreate={canCreate && !billingActionsDisabled}
        canViewExchangeRates={canViewExchangeRates && !billingActionsDisabled}
        canDelete={canDelete && !billingActionsDisabled}
        onSearchChange={handleSearchChange}
        onMarkAsPaid={handleMarkAsPaid}
        onViewPaymentDetails={setDetailsTarget}
        onSendReminder={handleSendReminder}
        onViewAllNegativeBalance={handleViewAllNegativeBalance}
        onClearCreditFilter={handleClearCreditFilter}
        onManualInvoice={() => {
          router.push("/billing/manual");
        }}
        onDeleteInvoice={canDelete && !billingActionsDisabled ? handleRequestDeleteInvoice : undefined}
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
      <SubmitPaymentProofDialog
        open={proofTarget !== null}
        onClose={() => {
          setProofTarget(null);
          refreshAfterDialogClose();
        }}
        invoice={proofTarget}
        mode="markPaid"
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
        subjectUserId={detailsTarget?.parentUserId}
        canManage={canManage}
        billingActionsDisabled={billingActionsDisabled}
        onSuccess={handleDetailsSuccess}
      />
      <DeleteInvoiceDialog
        open={deleteTargetId !== null}
        invoiceId={deleteTargetId}
        isLoading={deletingInvoice}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDeleteInvoice}
      />
    </RequirePermission>
  );
}
