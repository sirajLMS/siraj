"use client";

import type { useAppTranslation } from "@/shared/locale/client";
import type { BillingLabels } from "@/shared/locale/types/dashboard/billing/main";
import type { BillingManualLabels } from "@/shared/locale/types/dashboard/billing/manual";

export type BillingTranslator = ReturnType<typeof useAppTranslation<"dashboard.billing">>;

export function buildPageLabels(t: BillingTranslator) {
  return {
    adminPageTitle: t.adminPageTitle,
    adminPageSubtitle: t.adminPageSubtitle,
    parentPageTitle: t.parentPageTitle,
    parentPageSubtitle: t.parentPageSubtitle,
    manualInvoice: t.manualInvoice,
    exchangeRatesLink: t.exchangeRatesLink,
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

export function buildMetricLabels(t: BillingTranslator) {
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

export function buildSectionAndSearchLabels(t: BillingTranslator) {
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

export function buildTableLabels(t: BillingTranslator) {
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

export function buildStatusLabels(t: BillingTranslator) {
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

export function buildPaymentLabels(t: BillingTranslator) {
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

export function buildSubmitProofDialogLabels(t: BillingTranslator) {
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

export function buildPaymentDetailsDialogLabels(t: BillingTranslator) {
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

export function buildNotificationAndErrorLabels(t: BillingTranslator) {
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

export function buildFxAndCurrencyLabels(t: BillingTranslator) {
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

export function buildSuccessLabels(t: BillingTranslator) {
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

export function buildManualInvoiceLabels(t: BillingManualLabels): BillingManualLabels {
  return {
    pageTitle: t.pageTitle,
    pageSubtitle: t.pageSubtitle,
    backToFinancials: t.backToFinancials,
    parentSelection: t.parentSelection,
    parentPlaceholder: t.parentPlaceholder,
    studentSelection: t.studentSelection,
    feeAmount: t.feeAmount,
    feeAmountPlaceholder: t.feeAmountPlaceholder,
    issueDate: t.issueDate,
    dueDate: t.dueDate,
    billingMonths: t.billingMonths,
    billingMonthsMobile: t.billingMonthsMobile,
    summaryTitle: t.summaryTitle,
    summarySubtitle: t.summarySubtitle,
    totalDraftValue: t.totalDraftValue,
    submit: t.submit,
    submitAndSendEmail: t.submitAndSendEmail,
    successMessage: t.successMessage,
    createSuccess: t.createSuccess,
    manualInvoiceFxNote: t.manualInvoiceFxNote,
    unknown: t.unknown,
    months: {
      jan: t.months.jan,
      feb: t.months.feb,
      mar: t.months.mar,
      apr: t.months.apr,
      may: t.months.may,
      jun: t.months.jun,
      jul: t.months.jul,
      aug: t.months.aug,
      sep: t.months.sep,
      oct: t.months.oct,
      nov: t.months.nov,
      dec: t.months.dec,
    },
    validation: {
      parentRequired: t.validation.parentRequired,
      feeAmountRequired: t.validation.feeAmountRequired,
      feeAmountPositive: t.validation.feeAmountPositive,
      issueDateRequired: t.validation.issueDateRequired,
      dueDateRequired: t.validation.dueDateRequired,
      billingMonthsRequired: t.validation.billingMonthsRequired,
      dueDateBeforeIssueDate: t.validation.dueDateBeforeIssueDate,
    },
    support: {
      secureBilling: {
        title: t.support.secureBilling.title,
        body: t.support.secureBilling.body,
      },
      automatedLedgers: {
        title: t.support.automatedLedgers.title,
        body: t.support.automatedLedgers.body,
      },
      draftMode: {
        title: t.support.draftMode.title,
        body: t.support.draftMode.body,
      },
    },
  };
}

export function buildBillingLabels(t: BillingTranslator): BillingLabels {
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
  };
}
