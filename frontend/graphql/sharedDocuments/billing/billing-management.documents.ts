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
  mutation MarkInvoicePaid($invoiceId: String!, $proofFileId: ID!, $expectedVersion: Int) {
    markInvoicePaid(invoiceId: $invoiceId, proofFileId: $proofFileId, expectedVersion: $expectedVersion) {
      id
      parentId
      status
      paidDate
      version
      notificationSummaryUpdated
    }
  }
`;

export const submitPaymentProofMutationDocument: TypedDocumentNode<
  Operations.SubmitPaymentProofMutation,
  Types.MutationSubmitPaymentProofArgs
> = gql`
  mutation SubmitPaymentProof($invoiceId: String!, $proofFileId: ID!, $expectedVersion: Int) {
    submitPaymentProof(invoiceId: $invoiceId, proofFileId: $proofFileId, expectedVersion: $expectedVersion) {
      id
      parentId
      status
      paidDate
      version
      notificationSummaryUpdated
    }
  }
`;

export const approvePaymentProofMutationDocument: TypedDocumentNode<
  Operations.ApprovePaymentProofMutation,
  Types.MutationApprovePaymentProofArgs
> = gql`
  mutation ApprovePaymentProof($invoiceId: String!, $expectedVersion: Int) {
    approvePaymentProof(invoiceId: $invoiceId, expectedVersion: $expectedVersion) {
      id
      parentId
      status
      paidDate
      version
      notificationSummaryUpdated
    }
  }
`;

export const rejectPaymentProofMutationDocument: TypedDocumentNode<
  Operations.RejectPaymentProofMutation,
  Types.MutationRejectPaymentProofArgs
> = gql`
  mutation RejectPaymentProof($invoiceId: String!, $rejectionReason: String, $expectedVersion: Int) {
    rejectPaymentProof(
      invoiceId: $invoiceId
      rejectionReason: $rejectionReason
      expectedVersion: $expectedVersion
    ) {
      id
      parentId
      status
      paidDate
      version
      notificationSummaryUpdated
    }
  }
`;

export const invoicePaymentSubmissionQueryDocument: TypedDocumentNode<
  Operations.InvoicePaymentSubmissionQuery,
  Types.QueryInvoicePaymentSubmissionArgs
> = gql`
  query InvoicePaymentSubmission($invoiceId: String!) {
    invoicePaymentSubmission(invoiceId: $invoiceId) {
      id
      invoiceId
      fileId
      filePath
      mimeType
      status
      submittedByUserId
      submittedAt
      reviewedByUserId
      reviewedAt
      rejectionReason
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
