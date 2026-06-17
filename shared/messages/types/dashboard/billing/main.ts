import type { AdminInvoiceStatus, StudentCreditStatus } from "@/frontend/stores/mockAdminBillingStore";
import type { ParentInvoiceStatus } from "@/frontend/stores/moackParentBillingStore";
import type { BillingManualLabels } from "./manual";

export interface BillingLabels {
  readonly adminPageTitle: string;
  readonly adminPageSubtitle: string;
  readonly parentPageTitle: string;
  readonly parentPageSubtitle: string;
  readonly manualInvoice: string;
  readonly quickPay: string;
  readonly viewAllNegativeBalance: string;
  readonly requiresAttention: string;
  readonly showingResults: string;
  readonly adminMetrics: {
    readonly totalOutstanding: string;
    readonly pendingInvoices: string;
    readonly negativeBalance: string;
    readonly mtdRevenue: string;
  };
  readonly parentMetrics: {
    readonly outstandingBalance: string;
    readonly paidThisTerm: string;
    readonly nextDueDate: string;
    readonly activeStudents: string;
  };
  readonly sections: {
    readonly recentInvoices: string;
    readonly studentCreditStatus: string;
    readonly invoiceHistory: string;
    readonly invoiceHistorySubtitle: string;
  };
  readonly search: {
    readonly invoicesPlaceholder: string;
    readonly parentPlaceholder: string;
    readonly filter: string;
  };
  readonly adminTable: {
    readonly invoiceId: string;
    readonly studentName: string;
    readonly dateIssued: string;
    readonly amount: string;
    readonly status: string;
    readonly actions: string;
    readonly markAsPaid: string;
    readonly quickPay: string;
    readonly noEntries: string;
  };
  readonly creditTable: {
    readonly student: string;
    readonly parentContact: string;
    readonly planType: string;
    readonly classesLeft: string;
    readonly status: string;
    readonly quickAction: string;
    readonly sendReminder: string;
    readonly negativeBalance: string;
    readonly activeCredit: string;
    readonly noEntries: string;
  };
  readonly parentTable: {
    readonly invoiceNumber: string;
    readonly month: string;
    readonly issueDate: string;
    readonly dueDate: string;
    readonly paidDate: string;
    readonly fee: string;
    readonly status: string;
    readonly options: string;
    readonly viewDetails: string;
    readonly downloadPdf: string;
    readonly payNow: string;
    readonly noEntries: string;
    readonly emptyTitle: string;
    readonly emptySubtitle: string;
  };
  readonly invoiceStatus: Record<AdminInvoiceStatus | ParentInvoiceStatus, string>;
  readonly creditStatus: Record<StudentCreditStatus, string>;
  readonly manual: BillingManualLabels;
}
