import type { useTranslations } from "next-intl";
import { buildManualInvoiceLabels } from "@/frontend/views/dashboard/billing/manual/utils/buildManualInvoiceLabels";
import type { BillingLabels } from "@/shared/messages/types/dashboard/billing";

type BillingTranslator = ReturnType<typeof useTranslations<"dashboard.billing">>;

function buildPageLabels(t: BillingTranslator) {
  return {
    adminPageTitle: t("adminPageTitle"),
    adminPageSubtitle: t("adminPageSubtitle"),
    parentPageTitle: t("parentPageTitle"),
    parentPageSubtitle: t("parentPageSubtitle"),
    manualInvoice: t("manualInvoice"),
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
      filter: t("search.filter"),
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

export function buildBillingLabels(t: BillingTranslator): BillingLabels {
  return {
    ...buildPageLabels(t),
    ...buildMetricLabels(t),
    ...buildSectionAndSearchLabels(t),
    ...buildTableLabels(t),
    ...buildStatusLabels(t),
    ...buildPaymentLabels(t),
    manual: buildManualInvoiceLabels((key: string) => {
      if (key === "createSuccess") return t.raw(`manual.${key}`) as string;
      return t(`manual.${key}`);
    }),
    markAsPaidSuccess: t("markAsPaidSuccess"),
    noUnpaidInvoices: t("noUnpaidInvoices"),
    deleteInvoiceSuccess: t("deleteInvoiceSuccess"),
    markPaidDialog: {
      title: t("markPaidDialog.title"),
      confirm: t("markPaidDialog.confirm"),
      selectMethod: t("markPaidDialog.selectMethod"),
      noMethods: t("markPaidDialog.noMethods"),
      addMethods: t("markPaidDialog.addMethods"),
      manageMethods: t("markPaidDialog.manageMethods"),
      cancel: t("markPaidDialog.cancel"),
    },
    paymentDetailsDialog: {
      title: t("paymentDetailsDialog.title"),
      empty: t("paymentDetailsDialog.empty"),
      amount: t("paymentDetailsDialog.amount"),
      date: t("paymentDetailsDialog.date"),
    },
    errors: {
      invalidId: t("errors.invalidId"),
    },
  };
}
