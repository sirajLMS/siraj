import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

// ─── Mutation: createManualInvoice ──────────────────────────────────────────

export const createManualInvoiceMutationDocument: TypedDocumentNode<
  Operations.CreateManualInvoiceMutation,
  Types.MutationCreateManualInvoiceArgs
> = gql`
  mutation CreateManualInvoice(
    $parentId: String!
    $studentId: String
    $amount: String!
    $currency: String!
    $invoiceType: String!
    $issueDate: String!
    $dueDate: String!
    $exchangeRateSnapshot: String
    $exchangeRateSource: String
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
    }
  }
`;

// ─── Mutation: markInvoicePaid ──────────────────────────────────────────────

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

// ─── Mutation: deleteInvoice ────────────────────────────────────────────────

export const deleteInvoiceMutationDocument: TypedDocumentNode<
  Operations.DeleteInvoiceMutation,
  Types.MutationDeleteInvoiceArgs
> = gql`
  mutation DeleteInvoice($invoiceId: String!) {
    deleteInvoice(invoiceId: $invoiceId) {
      id
      parentId
      deletedAt
      version
      notificationSummaryUpdated
    }
  }
`;
