import type { BillingLabels } from "@/shared/locale";

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
