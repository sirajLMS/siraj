import type { BillingLabels } from "@/shared/locale";

export function buildPageLabels(t: BillingLabels) {
  return {
    adminPageTitle: t.adminPageTitle,
    adminPageSubtitle: t.adminPageSubtitle,
    parentPageTitle: t.parentPageTitle,
    parentPageSubtitle: t.parentPageSubtitle,
    manualInvoice: t.manualInvoice,
    exchangeRatesLink: t.exchangeRatesLink,
    quotasLink: t.quotasLink,
    quickPay: t.quickPay,
    viewAllNegativeBalance: t.viewAllNegativeBalance,
    requiresAttention: t.requiresAttention,
    showingResults: t.showingResults,
    invalidUserId: t.invalidUserId,
    billingProfileTitle: t.billingProfileTitle,
    profileForUser: t.profileForUser,
    reminderSent: t.reminderSent,
  };
}

export function buildMetricLabels(t: BillingLabels) {
  return {
    adminMetrics: {
      totalOutstanding: t.adminMetrics.totalOutstanding,
      pendingInvoices: t.adminMetrics.pendingInvoices,
      negativeBalance: t.adminMetrics.negativeBalance,
      mtdRevenue: t.adminMetrics.mtdRevenue,
    },
    parentMetrics: {
      outstandingBalance: t.parentMetrics.outstandingBalance,
      paidThisTerm: t.parentMetrics.paidThisTerm,
      nextDueDate: t.parentMetrics.nextDueDate,
      activeStudents: t.parentMetrics.activeStudents,
    },
  };
}

export function buildSectionAndSearchLabels(t: BillingLabels) {
  return {
    sections: {
      recentInvoices: t.sections.recentInvoices,
      studentCreditStatus: t.sections.studentCreditStatus,
      invoiceHistory: t.sections.invoiceHistory,
      invoiceHistorySubtitle: t.sections.invoiceHistorySubtitle,
    },
    search: {
      invoicesPlaceholder: t.search.invoicesPlaceholder,
      parentPlaceholder: t.search.parentPlaceholder,
      searching: t.search.searching,
    },
  };
}

export function buildStatusLabels(t: BillingLabels) {
  return {
    invoiceStatus: {
      OVERDUE: t.invoiceStatus.OVERDUE,
      PENDING: t.invoiceStatus.PENDING,
      PAYMENT_PENDING: t.invoiceStatus.PAYMENT_PENDING,
      PAID: t.invoiceStatus.PAID,
      UNPAID: t.invoiceStatus.UNPAID,
      CANCELLED: t.invoiceStatus.CANCELLED,
    },
    creditStatus: {
      negative_balance: t.creditStatus.negative_balance,
      active_credit: t.creditStatus.active_credit,
    },
  };
}

export function buildNotificationAndErrorLabels(t: BillingLabels) {
  return {
    notifications: {
      popupBlocked: t.notifications.popupBlocked,
      paymentPendingReview: t.notifications.paymentPendingReview,
    },
    errors: {
      invalidId: t.errors.invalidId,
      retry: t.errors.retry,
    },
  };
}

export function buildSuccessLabels(t: BillingLabels) {
  return {
    markAsPaidSuccess: t.markAsPaidSuccess,
    submitProofSuccess: t.submitProofSuccess,
    approveProofSuccess: t.approveProofSuccess,
    rejectProofSuccess: t.rejectProofSuccess,
    noUnpaidInvoices: t.noUnpaidInvoices,
    deleteInvoiceSuccess: t.deleteInvoiceSuccess,
    deleteInvoiceDialog: {
      title: t.deleteInvoiceDialog.title,
      body: t.deleteInvoiceDialog.body,
      confirm: t.deleteInvoiceDialog.confirm,
    },
    reminderSent: t.reminderSent,
    reminderFailed: t.reminderFailed,
    hasPaymentProofHint: t.hasPaymentProofHint,
  };
}
