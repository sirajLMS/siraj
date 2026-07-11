import type { useTranslations } from "next-intl";
import { buildManualInvoiceLabels } from "@/frontend/views/dashboard/billing/manual/utils/buildManualInvoiceLabels";
import type { BillingLabels } from "@/shared/messages/types/dashboard/billing";
import type { CurrencyHedgesLabels } from "@/shared/messages/types/dashboard/billing/currency-hedges";
import type { ExchangeRatesLabels } from "@/shared/messages/types/dashboard/billing/exchange-rates";
import type { SupportedCurrenciesLabels } from "@/shared/messages/types/dashboard/billing/supported-currencies";

type BillingTranslator = ReturnType<typeof useTranslations<"dashboard.billing">>;

function buildPageLabels(t: BillingTranslator) {
  return {
    adminPageTitle: t("adminPageTitle"),
    adminPageSubtitle: t("adminPageSubtitle"),
    parentPageTitle: t("parentPageTitle"),
    parentPageSubtitle: t("parentPageSubtitle"),
    manualInvoice: t("manualInvoice"),
    exchangeRatesLink: t("exchangeRatesLink"),
    quickPay: t("quickPay"),
    viewAllNegativeBalance: t("viewAllNegativeBalance"),
    requiresAttention: t("requiresAttention"),
    showingResults: t.raw("showingResults") as string,
    invalidUserId: t("invalidUserId"),
    billingProfileTitle: t("billingProfileTitle"),
    profileForUser: t.raw("profileForUser") as string,
    reminderSent: t("reminderSent"),
  };
}

function buildMetricLabels(t: BillingTranslator) {
  return {
    adminMetrics: {
      totalOutstanding: t("adminMetrics.totalOutstanding"),
      pendingInvoices: t("adminMetrics.pendingInvoices"),
      negativeBalance: t("adminMetrics.negativeBalance"),
      mtdRevenue: t("adminMetrics.mtdRevenue"),
    },
    parentMetrics: {
      outstandingBalance: t("parentMetrics.outstandingBalance"),
      paidThisTerm: t("parentMetrics.paidThisTerm"),
      nextDueDate: t("parentMetrics.nextDueDate"),
      activeStudents: t("parentMetrics.activeStudents"),
    },
  };
}

function buildSectionAndSearchLabels(t: BillingTranslator) {
  return {
    sections: {
      recentInvoices: t("sections.recentInvoices"),
      studentCreditStatus: t("sections.studentCreditStatus"),
      invoiceHistory: t("sections.invoiceHistory"),
      invoiceHistorySubtitle: t("sections.invoiceHistorySubtitle"),
    },
    search: {
      invoicesPlaceholder: t("search.invoicesPlaceholder"),
      parentPlaceholder: t("search.parentPlaceholder"),
      searching: t("search.searching"),
    },
  };
}

function buildTableLabels(t: BillingTranslator) {
  return {
    adminTable: {
      invoiceId: t("adminTable.invoiceId"),
      studentName: t("adminTable.studentName"),
      dateIssued: t("adminTable.dateIssued"),
      amount: t("adminTable.amount"),
      status: t("adminTable.status"),
      actions: t("adminTable.actions"),
      markAsPaid: t("adminTable.markAsPaid"),
      quickPay: t("adminTable.quickPay"),
      reviewSubmission: t("adminTable.reviewSubmission"),
      viewRejection: t("adminTable.viewRejection"),
      deleteInvoice: t("adminTable.deleteInvoice"),
      noEntries: t("adminTable.noEntries"),
    },
    creditTable: {
      student: t("creditTable.student"),
      parentContact: t("creditTable.parentContact"),
      planType: t("creditTable.planType"),
      classesLeft: t("creditTable.classesLeft"),
      status: t("creditTable.status"),
      quickAction: t("creditTable.quickAction"),
      sendReminder: t("creditTable.sendReminder"),
      negativeBalance: t("creditTable.negativeBalance"),
      activeCredit: t("creditTable.activeCredit"),
      noEntries: t("creditTable.noEntries"),
      showingNegativeBalanceOnly: t("creditTable.showingNegativeBalanceOnly"),
      clearFilter: t("creditTable.clearFilter"),
    },
    parentTable: {
      invoiceNumber: t("parentTable.invoiceNumber"),
      month: t("parentTable.month"),
      issueDate: t("parentTable.issueDate"),
      dueDate: t("parentTable.dueDate"),
      paidDate: t("parentTable.paidDate"),
      fee: t("parentTable.fee"),
      status: t("parentTable.status"),
      options: t("parentTable.options"),
      viewDetails: t("parentTable.viewDetails"),
      downloadPdf: t("parentTable.downloadPdf"),
      payNow: t("parentTable.payNow"),
      viewSubmission: t("parentTable.viewSubmission"),
      viewFeedback: t("parentTable.viewFeedback"),
      noEntries: t("parentTable.noEntries"),
      emptyTitle: t("parentTable.emptyTitle"),
      emptySubtitle: t("parentTable.emptySubtitle"),
    },
  };
}

function buildStatusLabels(t: BillingTranslator) {
  return {
    invoiceStatus: {
      OVERDUE: t("invoiceStatus.OVERDUE"),
      PENDING: t("invoiceStatus.PENDING"),
      PAYMENT_PENDING: t("invoiceStatus.PAYMENT_PENDING"),
      PAID: t("invoiceStatus.PAID"),
      UNPAID: t("invoiceStatus.UNPAID"),
      CANCELLED: t("invoiceStatus.CANCELLED"),
    },
    creditStatus: {
      negative_balance: t("creditStatus.negative_balance"),
      active_credit: t("creditStatus.active_credit"),
    },
  };
}

function buildPaymentLabels(t: BillingTranslator) {
  return {
    paymentMethodSelector: {
      label: t("paymentMethodSelector.label"),
      placeholder: t("paymentMethodSelector.placeholder"),
    },
    paymentStatusBadge: {
      paid: t("paymentStatusBadge.paid"),
      pending: t("paymentStatusBadge.pending"),
      unpaid: t("paymentStatusBadge.unpaid"),
      overdue: t("paymentStatusBadge.overdue"),
      cancelled: t("paymentStatusBadge.cancelled"),
      refunded: t("paymentStatusBadge.refunded"),
    },
    paymentSummaryCard: {
      amount: t("paymentSummaryCard.amount"),
      date: t("paymentSummaryCard.date"),
      paymentMethod: t("paymentSummaryCard.paymentMethod"),
    },
  };
}

function buildSuccessAndDialogLabels(t: BillingTranslator) {
  return {
    markAsPaidSuccess: t("markAsPaidSuccess"),
    submitProofSuccess: t("submitProofSuccess"),
    approveProofSuccess: t("approveProofSuccess"),
    rejectProofSuccess: t("rejectProofSuccess"),
    noUnpaidInvoices: t("noUnpaidInvoices"),
    deleteInvoiceSuccess: t("deleteInvoiceSuccess"),
    deleteInvoiceDialog: {
      title: t("deleteInvoiceDialog.title"),
      body: t.raw("deleteInvoiceDialog.body") as string,
      confirm: t("deleteInvoiceDialog.confirm"),
    },
    hasPaymentProofHint: t("hasPaymentProofHint"),
    submitProofDialog: {
      titleSubmit: t("submitProofDialog.titleSubmit"),
      titleMarkPaid: t("submitProofDialog.titleMarkPaid"),
      confirm: t("submitProofDialog.confirm"),
      confirmMarkPaid: t("submitProofDialog.confirmMarkPaid"),
      confirming: t("submitProofDialog.confirming"),
      selectFile: t("submitProofDialog.selectFile"),
      fileHint: t("submitProofDialog.fileHint"),
      invalidFileType: t("submitProofDialog.invalidFileType"),
      fileTooLarge: t("submitProofDialog.fileTooLarge"),
      cancel: t("submitProofDialog.cancel"),
      errorGeneric: t("submitProofDialog.errorGeneric"),
      invoiceNumber: t("submitProofDialog.invoiceNumber"),
      amount: t("submitProofDialog.amount"),
      dueDate: t("submitProofDialog.dueDate"),
      student: t("submitProofDialog.student"),
      uploadFailed: t("submitProofDialog.uploadFailed"),
      uploadPrepareFailed: t("submitProofDialog.uploadPrepareFailed"),
      impersonationBlocked: t("submitProofDialog.impersonationBlocked"),
    },
    paymentDetailsDialog: {
      title: t("paymentDetailsDialog.title"),
      empty: t("paymentDetailsDialog.empty"),
      pending: t("paymentDetailsDialog.pending"),
      approve: t("paymentDetailsDialog.approve"),
      reject: t("paymentDetailsDialog.reject"),
      rejecting: t("paymentDetailsDialog.rejecting"),
      approving: t("paymentDetailsDialog.approving"),
      rejected: t("paymentDetailsDialog.rejected"),
      rejectionReason: t("paymentDetailsDialog.rejectionReason"),
      rejectionReasonPlaceholder: t("paymentDetailsDialog.rejectionReasonPlaceholder"),
      viewProof: t("paymentDetailsDialog.viewProof"),
      viewProofFailed: t("paymentDetailsDialog.viewProofFailed"),
      noProof: t("paymentDetailsDialog.noProof"),
      loadFailed: t("paymentDetailsDialog.loadFailed"),
      close: t("paymentDetailsDialog.close"),
      amount: t("paymentDetailsDialog.amount"),
      date: t("paymentDetailsDialog.date"),
      submittedAt: t("paymentDetailsDialog.submittedAt"),
      reviewActions: t("paymentDetailsDialog.reviewActions"),
      tryAgain: t("paymentDetailsDialog.tryAgain"),
      confirmReject: t("paymentDetailsDialog.confirmReject"),
      confirmRejectMessage: t("paymentDetailsDialog.confirmRejectMessage"),
    },
  };
}

function buildNotificationAndErrorLabels(t: BillingTranslator) {
  return {
    notifications: {
      popupBlocked: t("notifications.popupBlocked"),
      paymentPendingReview: t("notifications.paymentPendingReview"),
    },
    errors: {
      invalidId: t("errors.invalidId"),
      retry: t("errors.retry"),
    },
  };
}

function buildFxAndCurrencyLabels(t: BillingTranslator) {
  return {
    exchangeRates: t.raw("exchangeRates") as ExchangeRatesLabels,
    fxStaleBanner: {
      adminBody: t("fxStaleBanner.adminBody"),
      userBody: t("fxStaleBanner.userBody"),
      adminCta: t("fxStaleBanner.adminCta"),
      userCta: t("fxStaleBanner.userCta"),
    },
    displayCurrencyHint: {
      title: t("displayCurrencyHint.title"),
      body: t("displayCurrencyHint.body"),
      cta: t("displayCurrencyHint.cta"),
      dismiss: t("displayCurrencyHint.dismiss"),
      subject: {
        title: t("displayCurrencyHint.subject.title"),
        body: t("displayCurrencyHint.subject.body"),
        cta: t("displayCurrencyHint.subject.cta"),
        dismiss: t("displayCurrencyHint.subject.dismiss"),
      },
    },
    fxConversionNote: t("fxConversionNote"),
    fxConversionNoteSubject: t("fxConversionNoteSubject"),
    adminBillingFxNote: t("adminBillingFxNote"),
    currencyHedges: t.raw("currencyHedges") as CurrencyHedgesLabels,
    supportedCurrencies: t.raw("supportedCurrencies") as SupportedCurrenciesLabels,
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
    ...buildSuccessAndDialogLabels(t),
    ...buildNotificationAndErrorLabels(t),
    ...buildFxAndCurrencyLabels(t),
    manual: buildManualInvoiceLabels((key: string) => {
      if (key === "createSuccess") return t.raw(`manual.${key}`) as string;
      return t(`manual.${key}`);
    }),
  };
}
