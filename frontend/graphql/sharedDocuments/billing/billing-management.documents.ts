import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

export const createManualInvoiceMutationDocument: TypedDocumentNode<
  Operations.CreateManualInvoiceMutation,
  Types.MutationCreateManualInvoiceArgs
> = gql`
  mutation CreateManualInvoice(
    $parentId: String!
    $studentId: String
    $amount: String!
    $currency: CurrencyCode!
    $invoiceType: InvoiceType!
    $issueDate: String!
    $dueDate: String!
    $exchangeRateSnapshot: String
    $exchangeRateSource: String
    $billingMonths: [BillingMonthInput!]
    $sendEmail: Boolean
  ) {
    createManualInvoice(
      parentId: $parentId
      studentId: $studentId
      amount: $amount
      currency: $currency
      invoiceType: $invoiceType
      issueDate: $issueDate
      dueDate: $dueDate
      exchangeRateSnapshot: $exchangeRateSnapshot
      exchangeRateSource: $exchangeRateSource
      billingMonths: $billingMonths
      sendEmail: $sendEmail
    ) {
      id
      parentId
      studentId
      amount
      currency
      status
      invoiceType
      issueDate
      dueDate
      paidDate
      version
      createdAt
      displayAmount {
        id
        amount
        currency
        stale
      }
    }
  }
`;

export const markInvoicePaidMutationDocument: TypedDocumentNode<
  Operations.MarkInvoicePaidMutation,
  Types.MutationMarkInvoicePaidArgs
> = gql`
  mutation MarkInvoicePaid($invoiceId: String!, $expectedVersion: Int) {
    markInvoicePaid(invoiceId: $invoiceId, expectedVersion: $expectedVersion) {
      id
      parentId
      status
      paidDate
      version
      notificationSummaryUpdated
    }
  }
`;

export const deleteInvoiceMutationDocument: TypedDocumentNode<
  Operations.DeleteInvoiceMutation,
  Types.MutationDeleteInvoiceArgs
> = gql`
  mutation DeleteInvoice($invoiceId: String!) {
    deleteInvoice(invoiceId: $invoiceId) {
      id
      parentId
      version
      notificationSummaryUpdated
    }
  }
`;

export const sendPaymentReminderMutationDocument: TypedDocumentNode<
  Operations.SendPaymentReminderMutation,
  Types.MutationSendPaymentReminderArgs
> = gql`
  mutation SendPaymentReminder($studentId: String!) {
    sendPaymentReminder(studentId: $studentId) {
      id
      success
    }
  }
`;
