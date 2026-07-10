import type { BillingLabels } from "@/shared/messages/types/dashboard/billing";

export function getAdminInvoiceGridLabels(labels: BillingLabels) {
  return {
    invoiceId: labels.adminTable.invoiceId,
    studentName: labels.adminTable.studentName,
    dateIssued: labels.adminTable.dateIssued,
    amount: labels.adminTable.amount,
    status: labels.adminTable.status,
    actions: labels.adminTable.actions,
    markAsPaid: labels.adminTable.markAsPaid,
    quickPay: labels.adminTable.quickPay,
    reviewSubmission: labels.adminTable.reviewSubmission,
    viewDetails: labels.parentTable.viewDetails,
    noEntries: labels.adminTable.noEntries,
    statusLabels: labels.invoiceStatus,
  };
}

export function getStudentCreditGridLabels(labels: BillingLabels) {
  return {
    student: labels.creditTable.student,
    parentContact: labels.creditTable.parentContact,
    planType: labels.creditTable.planType,
    classesLeft: labels.creditTable.classesLeft,
    status: labels.creditTable.status,
    quickAction: labels.creditTable.quickAction,
    sendReminder: labels.creditTable.sendReminder,
    negativeBalance: labels.creditTable.negativeBalance,
    activeCredit: labels.creditTable.activeCredit,
    noEntries: labels.creditTable.noEntries,
    creditStatusLabels: labels.creditStatus,
  };
}

export function getParentInvoiceGridLabels(labels: BillingLabels) {
  return {
    invoiceNumber: labels.parentTable.invoiceNumber,
    month: labels.parentTable.month,
    issueDate: labels.parentTable.issueDate,
    dueDate: labels.parentTable.dueDate,
    paidDate: labels.parentTable.paidDate,
    fee: labels.parentTable.fee,
    status: labels.parentTable.status,
    options: labels.parentTable.options,
    viewDetails: labels.parentTable.viewDetails,
    downloadPdf: labels.parentTable.downloadPdf,
    payNow: labels.parentTable.payNow,
    viewSubmission: labels.parentTable.viewSubmission,
    noEntries: labels.parentTable.noEntries,
    statusLabels: labels.invoiceStatus,
  };
}
