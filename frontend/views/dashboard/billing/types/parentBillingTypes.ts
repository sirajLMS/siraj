export type ParentInvoiceStatus = "paid" | "unpaid";

export interface ParentBillingSummary {
  readonly outstandingBalance: string;
  readonly paidThisTerm: string;
  readonly nextDueDate: string;
  readonly activeStudents: string;
}

export interface ParentInvoiceRow {
  readonly id: string;
  readonly invoiceNumber: string;
  readonly month: string;
  readonly issueDate: string;
  readonly dueDate: string;
  readonly paidDate: string;
  readonly fee: string;
  readonly status: ParentInvoiceStatus;
}
