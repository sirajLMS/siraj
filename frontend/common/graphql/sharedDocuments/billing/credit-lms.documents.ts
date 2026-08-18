import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

export const studentCreditBalanceQueryDocument: TypedDocumentNode<
  Operations.StudentCreditBalanceQuery,
  Types.QueryStudentCreditBalanceArgs
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
  Operations.StudentCreditTransactionsQuery,
  Types.QueryStudentCreditTransactionsArgs
> = gql`
  query StudentCreditTransactions($studentId: ID!, $paginationArgs: PaginationArgs) {
    studentCreditTransactions(studentId: $studentId, paginationArgs: $paginationArgs) {
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

export const recordCreditPurchaseMutationDocument: TypedDocumentNode<
  Operations.RecordCreditPurchaseMutation,
  Types.MutationRecordCreditPurchaseArgs
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
