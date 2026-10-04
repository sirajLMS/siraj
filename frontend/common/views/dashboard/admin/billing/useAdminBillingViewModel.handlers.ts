import type { AdminBillingMutations } from "@/frontend/common/views/dashboard/admin/billing/useAdminBillingViewModel.mutations";
import type { AdminBillingQueries } from "@/frontend/common/views/dashboard/admin/billing/useAdminBillingViewModel.queries";
import type { AdminBillingStoreBindings } from "@/frontend/common/views/dashboard/admin/billing/useAdminBillingViewModel.store";
import type { MarkPaidInvoiceTarget } from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";
import type { buildBillingLabels } from "@/frontend/common/views/dashboard/billing/utils/buildBillingLabels";

interface BillingImpersonationCopy {
  readonly auth: { readonly impersonationNotAllowedDuringSession: string };
}

interface BillingActionHandlerArgs {
  readonly actions: AdminBillingStoreBindings["actions"];
  readonly mutations: AdminBillingMutations;
  readonly refetch: AdminBillingQueries["refetch"];
  readonly labels: ReturnType<typeof buildBillingLabels>;
  readonly tErrors: BillingImpersonationCopy;
  readonly billingActionsDisabled: boolean;
  readonly router: { push: (href: string) => void };
  readonly deleteTargetId: string | null;
}

/** Invoice, payment-proof, and dialog handlers for the admin billing screen. */
export function createBillingActionHandlers(args: Readonly<BillingActionHandlerArgs>) {
  const { actions, mutations, refetch, labels, tErrors, billingActionsDisabled, router, deleteTargetId } = args;
  const deletingInvoice = mutations.vm.deletingInvoice;

  const handleMarkAsPaid = (invoice: MarkPaidInvoiceTarget) => {
    if (billingActionsDisabled) {
      actions.showFeedback(tErrors.auth.impersonationNotAllowedDuringSession, "error");
      return;
    }
    actions.setProofTarget(invoice);
  };

  const handleRequestDeleteInvoice = (invoiceId: string) => {
    if (billingActionsDisabled) {
      actions.showFeedback(tErrors.auth.impersonationNotAllowedDuringSession, "error");
      return;
    }
    actions.setDeleteTargetId(invoiceId);
  };

  const handleConfirmDeleteInvoice = () => {
    if (!deleteTargetId || deletingInvoice) {
      return;
    }
    void mutations.deleteInvoiceMutation({ variables: { invoiceId: deleteTargetId } });
  };

  const handleManualInvoice = () => {
    router.push("/billing/manual");
  };

  const handleProofSuccess = () => {
    actions.showFeedback(labels.markAsPaidSuccess, "success");
    void refetch.invoices();
    void refetch.summary();
  };

  const handleProofError = (message: string) => {
    actions.showFeedback(message, "error");
  };

  const handleDetailsSuccess = (action: "approve" | "reject") => {
    actions.showFeedback(action === "approve" ? labels.approveProofSuccess : labels.rejectProofSuccess, "success");
    void refetch.invoices();
    void refetch.summary();
  };

  return {
    onMarkAsPaid: handleMarkAsPaid,
    onViewPaymentDetails: actions.setDetailsTarget,
    onDeleteInvoice: handleRequestDeleteInvoice,
    onConfirmDeleteInvoice: handleConfirmDeleteInvoice,
    onManualInvoice: handleManualInvoice,
    onProofSuccess: handleProofSuccess,
    onProofError: handleProofError,
    onDetailsSuccess: handleDetailsSuccess,
    onPageChange: actions.setPage,
  };
}

interface BillingCreditHandlerArgs {
  readonly actions: AdminBillingStoreBindings["actions"];
  readonly mutations: AdminBillingMutations;
  readonly tErrors: BillingImpersonationCopy;
  readonly billingActionsDisabled: boolean;
}

/** Student-credit handlers: filter shortcuts and reminder dispatch. */
export function createBillingCreditHandlers(args: Readonly<BillingCreditHandlerArgs>) {
  const { actions, mutations, tErrors, billingActionsDisabled } = args;

  const handleViewAllNegativeBalance = () => {
    actions.setCreditFilter("negative_balance");
    document.getElementById("student-credit-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleClearCreditFilter = () => {
    actions.setCreditFilter("all");
  };

  const handleSendReminder = (studentId: string) => {
    if (billingActionsDisabled) {
      actions.showFeedback(tErrors.auth.impersonationNotAllowedDuringSession, "error");
      return;
    }
    actions.setSendingReminderId(studentId);
    void mutations.sendReminderMutation({ variables: { studentId } });
  };

  return {
    onSendReminder: handleSendReminder,
    onViewAllNegativeBalance: handleViewAllNegativeBalance,
    onClearCreditFilter: handleClearCreditFilter,
  };
}

interface BillingDialogHandlerArgs {
  readonly actions: AdminBillingStoreBindings["actions"];
  readonly refreshBillingData: () => void;
  readonly refetchCredit: () => void;
}

/** Dialog dismiss handlers, refreshing the affected query on close. */
export function createBillingDialogHandlers(args: Readonly<BillingDialogHandlerArgs>) {
  const { actions, refreshBillingData, refetchCredit } = args;

  return {
    onCloseSnackbar: () => actions.setSnackbarOpen(false),
    onCloseProofDialog: () => {
      actions.setProofTarget(null);
      refreshBillingData();
    },
    onCloseDetailsDialog: () => {
      actions.setDetailsTarget(null);
      refreshBillingData();
    },
    onCloseDeleteDialog: () => {
      actions.setDeleteTargetId(null);
      refetchCredit();
    },
  };
}
