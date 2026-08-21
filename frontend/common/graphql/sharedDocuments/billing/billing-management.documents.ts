import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  ApprovePaymentProofMutation,
  ApprovePaymentProofMutationVariables,
  CreateManualInvoiceMutation,
  CreateManualInvoiceMutationVariables,
  DeleteInvoiceMutation,
  DeleteInvoiceMutationVariables,
  InvoicePaymentSubmissionQuery,
  InvoicePaymentSubmissionQueryVariables,
  MarkInvoicePaidMutation,
  MarkInvoicePaidMutationVariables,
  RejectPaymentProofMutation,
  RejectPaymentProofMutationVariables,
  SendPaymentReminderMutation,
  SendPaymentReminderMutationVariables,
  SubmitPaymentProofMutation,
  SubmitPaymentProofMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const createManualInvoiceMutationDocument: TypedDocumentNode<
  CreateManualInvoiceMutation,
  CreateManualInvoiceMutationVariables
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
  MarkInvoicePaidMutation,
  MarkInvoicePaidMutationVariables
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
  SubmitPaymentProofMutation,
  SubmitPaymentProofMutationVariables
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
  ApprovePaymentProofMutation,
  ApprovePaymentProofMutationVariables
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
  RejectPaymentProofMutation,
  RejectPaymentProofMutationVariables
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
  InvoicePaymentSubmissionQuery,
  InvoicePaymentSubmissionQueryVariables
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

export const deleteInvoiceMutationDocument: TypedDocumentNode<DeleteInvoiceMutation, DeleteInvoiceMutationVariables> =
  gql`
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
  SendPaymentReminderMutation,
  SendPaymentReminderMutationVariables
> = gql`
  mutation SendPaymentReminder($studentId: String!) {
    sendPaymentReminder(studentId: $studentId) {
      id
      success
    }
  }
`;
