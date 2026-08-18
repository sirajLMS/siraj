"use client";

import { buildManualInvoiceLabels } from "@/frontend/common/views/dashboard/billing/manual/utils/buildManualInvoiceLabels";
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

export function buildTableLabels(t: BillingLabels) {
  return {
    adminTable: {
      invoiceId: t.adminTable.invoiceId,
      studentName: t.adminTable.studentName,
      dateIssued: t.adminTable.dateIssued,
      amount: t.adminTable.amount,
      status: t.adminTable.status,
      actions: t.adminTable.actions,
      markAsPaid: t.adminTable.markAsPaid,
      quickPay: t.adminTable.quickPay,
      reviewSubmission: t.adminTable.reviewSubmission,
      viewRejection: t.adminTable.viewRejection,
      deleteInvoice: t.adminTable.deleteInvoice,
      noEntries: t.adminTable.noEntries,
    },
    creditTable: {
      student: t.creditTable.student,
      parentContact: t.creditTable.parentContact,
      planType: t.creditTable.planType,
      classesLeft: t.creditTable.classesLeft,
      status: t.creditTable.status,
      quickAction: t.creditTable.quickAction,
      sendReminder: t.creditTable.sendReminder,
      negativeBalance: t.creditTable.negativeBalance,
      activeCredit: t.creditTable.activeCredit,
      noEntries: t.creditTable.noEntries,
      showingNegativeBalanceOnly: t.creditTable.showingNegativeBalanceOnly,
      clearFilter: t.creditTable.clearFilter,
    },
    parentTable: {
      invoiceNumber: t.parentTable.invoiceNumber,
      month: t.parentTable.month,
      issueDate: t.parentTable.issueDate,
      dueDate: t.parentTable.dueDate,
      paidDate: t.parentTable.paidDate,
      fee: t.parentTable.fee,
      status: t.parentTable.status,
      options: t.parentTable.options,
      viewDetails: t.parentTable.viewDetails,
      downloadPdf: t.parentTable.downloadPdf,
      payNow: t.parentTable.payNow,
      viewSubmission: t.parentTable.viewSubmission,
      viewFeedback: t.parentTable.viewFeedback,
      noEntries: t.parentTable.noEntries,
      emptyTitle: t.parentTable.emptyTitle,
      emptySubtitle: t.parentTable.emptySubtitle,
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

export function buildPaymentLabels(t: BillingLabels) {
  return {
    paymentMethodSelector: {
      label: t.paymentMethodSelector.label,
      placeholder: t.paymentMethodSelector.placeholder,
    },
    paymentStatusBadge: {
      paid: t.paymentStatusBadge.paid,
      pending: t.paymentStatusBadge.pending,
      unpaid: t.paymentStatusBadge.unpaid,
      overdue: t.paymentStatusBadge.overdue,
      cancelled: t.paymentStatusBadge.cancelled,
      refunded: t.paymentStatusBadge.refunded,
    },
    paymentSummaryCard: {
      amount: t.paymentSummaryCard.amount,
      date: t.paymentSummaryCard.date,
      paymentMethod: t.paymentSummaryCard.paymentMethod,
    },
  };
}

export function buildSubmitProofDialogLabels(t: BillingLabels) {
  return {
    submitProofDialog: {
      titleSubmit: t.submitProofDialog.titleSubmit,
      titleMarkPaid: t.submitProofDialog.titleMarkPaid,
      confirm: t.submitProofDialog.confirm,
      confirmMarkPaid: t.submitProofDialog.confirmMarkPaid,
      confirming: t.submitProofDialog.confirming,
      selectFile: t.submitProofDialog.selectFile,
      fileHint: t.submitProofDialog.fileHint,
      invalidFileType: t.submitProofDialog.invalidFileType,
      fileTooLarge: t.submitProofDialog.fileTooLarge,
      cancel: t.submitProofDialog.cancel,
      errorGeneric: t.submitProofDialog.errorGeneric,
      invoiceNumber: t.submitProofDialog.invoiceNumber,
      amount: t.submitProofDialog.amount,
      dueDate: t.submitProofDialog.dueDate,
      student: t.submitProofDialog.student,
      uploadFailed: t.submitProofDialog.uploadFailed,
      uploadPrepareFailed: t.submitProofDialog.uploadPrepareFailed,
      impersonationBlocked: t.submitProofDialog.impersonationBlocked,
    },
  };
}

export function buildPaymentDetailsDialogLabels(t: BillingLabels) {
  return {
    paymentDetailsDialog: {
      title: t.paymentDetailsDialog.title,
      empty: t.paymentDetailsDialog.empty,
      pending: t.paymentDetailsDialog.pending,
      approve: t.paymentDetailsDialog.approve,
      reject: t.paymentDetailsDialog.reject,
      rejecting: t.paymentDetailsDialog.rejecting,
      approving: t.paymentDetailsDialog.approving,
      rejected: t.paymentDetailsDialog.rejected,
      rejectionReason: t.paymentDetailsDialog.rejectionReason,
      rejectionReasonPlaceholder: t.paymentDetailsDialog.rejectionReasonPlaceholder,
      viewProof: t.paymentDetailsDialog.viewProof,
      viewProofFailed: t.paymentDetailsDialog.viewProofFailed,
      noProof: t.paymentDetailsDialog.noProof,
      loadFailed: t.paymentDetailsDialog.loadFailed,
      close: t.paymentDetailsDialog.close,
      amount: t.paymentDetailsDialog.amount,
      date: t.paymentDetailsDialog.date,
      submittedAt: t.paymentDetailsDialog.submittedAt,
      reviewActions: t.paymentDetailsDialog.reviewActions,
      tryAgain: t.paymentDetailsDialog.tryAgain,
      confirmReject: t.paymentDetailsDialog.confirmReject,
      confirmRejectMessage: t.paymentDetailsDialog.confirmRejectMessage,
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

export function buildFxAndCurrencyLabels(t: BillingLabels) {
  return {
    exchangeRates: t.exchangeRates,
    fxStaleBanner: {
      adminBody: t.fxStaleBanner.adminBody,
      userBody: t.fxStaleBanner.userBody,
      adminCta: t.fxStaleBanner.adminCta,
      userCta: t.fxStaleBanner.userCta,
    },
    displayCurrencyHint: {
      title: t.displayCurrencyHint.title,
      body: t.displayCurrencyHint.body,
      cta: t.displayCurrencyHint.cta,
      dismiss: t.displayCurrencyHint.dismiss,
      subject: {
        title: t.displayCurrencyHint.subject.title,
        body: t.displayCurrencyHint.subject.body,
        cta: t.displayCurrencyHint.subject.cta,
        dismiss: t.displayCurrencyHint.subject.dismiss,
      },
    },
    fxConversionNote: t.fxConversionNote,
    fxConversionNoteSubject: t.fxConversionNoteSubject,
    adminBillingFxNote: t.adminBillingFxNote,
    displayCurrencyMixed: t.displayCurrencyMixed,
    currencyHedges: t.currencyHedges,
    supportedCurrencies: t.supportedCurrencies,
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

export function buildBillingLabels(t: BillingLabels): BillingLabels {
  return {
    ...buildPageLabels(t),
    ...buildMetricLabels(t),
    ...buildSectionAndSearchLabels(t),
    ...buildTableLabels(t),
    ...buildStatusLabels(t),
    ...buildPaymentLabels(t),
    ...buildSuccessLabels(t),
    ...buildSubmitProofDialogLabels(t),
    ...buildPaymentDetailsDialogLabels(t),
    ...buildNotificationAndErrorLabels(t),
    ...buildFxAndCurrencyLabels(t),
    displayCurrencyNotSet: t.displayCurrencyNotSet,
    displayCurrencyStale: t.displayCurrencyStale,
    manual: buildManualInvoiceLabels(t.manual),
    tabsPageTitle: t.tabsPageTitle,
    tabsPageSubtitle: t.tabsPageSubtitle,
    tabNavAriaLabel: t.tabNavAriaLabel,
    billingTabs: t.billingTabs,
  };
}
