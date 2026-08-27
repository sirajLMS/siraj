import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  RecordCreditPurchaseMutation,
  RecordCreditPurchaseMutationVariables,
  StudentCreditBalanceQuery,
  StudentCreditBalanceQueryVariables,
  StudentCreditTransactionsQuery,
  StudentCreditTransactionsQueryVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const studentCreditBalanceQueryDocument: TypedDocumentNode<
  StudentCreditBalanceQuery,
  StudentCreditBalanceQueryVariables
> = gql`
  query StudentCreditBalance($studentId: ID!) {
    studentCreditBalance(studentId: $studentId) {
      id
      studentId
      classesRemaining
      classesTotal
    }
  }
`;

export const studentCreditTransactionsQueryDocument: TypedDocumentNode<
  StudentCreditTransactionsQuery,
  StudentCreditTransactionsQueryVariables
> = gql`
  query StudentCreditTransactions($studentId: ID!, $paginationArgs: PaginationArgs, $hoursOnly: Boolean) {
    studentCreditTransactions(studentId: $studentId, paginationArgs: $paginationArgs, hoursOnly: $hoursOnly) {
      id
      studentId
      changeAmount
      changeAmountHours
      reason
      sourcePaymentId
      classInstanceId
      notes
      creditedByUserId
      idempotencyKey
      createdAt
      updatedAt
    }
  }
`;

export const recordCreditPurchaseMutationDocument: TypedDocumentNode<
  RecordCreditPurchaseMutation,
  RecordCreditPurchaseMutationVariables
> = gql`
  mutation RecordCreditPurchase($studentId: ID!, $hours: Int!, $notes: String) {
    recordCreditPurchase(studentId: $studentId, hours: $hours, notes: $notes) {
      id
      studentId
      changeAmount
      reason
      sourcePaymentId
      classInstanceId
      notes
      creditedByUserId
      idempotencyKey
      createdAt
      updatedAt
    }
  }
`;
