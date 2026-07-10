import type { InvoiceStatus } from "@/frontend/graphql/generated/gql/graphql-types";

export type ParentInvoiceStatus = `${InvoiceStatus}`;

export interface ParentBillingSummary {
  readonly outstandingBalance: string;
  readonly outstandingBalanceSubLabel?: string;
  readonly paidThisTerm: string;
  readonly paidThisTermSubLabel?: string;
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
  readonly hasPaymentProof: boolean;
  readonly hasRejectedSubmission: boolean;
  readonly fee: string;
  readonly status: InvoiceStatus;
}
