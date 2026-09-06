import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  BulkCarryoverToExpenseMutation,
  BulkCarryoverToExpenseMutationVariables,
  BulkCreateCarryoverBalancesMutation,
  BulkCreateCarryoverBalancesMutationVariables,
  BulkDeleteCarryoverBalancesMutation,
  BulkDeleteCarryoverBalancesMutationVariables,
  CarryoverBalanceLinkedSessionsQuery,
  CarryoverBalanceLinkedSessionsQueryVariables,
  CarryoverBalanceQuery,
  CarryoverBalanceQueryVariables,
  CarryoverBalancesQuery,
  CarryoverBalancesQueryVariables,
  CreateCarryoverBalanceMutation,
  CreateCarryoverBalanceMutationVariables,
  DeleteCarryoverBalanceMutation,
  DeleteCarryoverBalanceMutationVariables,
  UnpayCarryoverBalanceMutation,
  UnpayCarryoverBalanceMutationVariables,
  UpdateCarryoverBalanceMutation,
  UpdateCarryoverBalanceMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

const CarryoverBalanceFieldsFragment = gql`
  fragment CarryoverBalanceFields on CarryoverBalance {
    id
    teacherId
    teacherName
    teacherAvatarUrl
    isDisabledTeacher
    studentsCount
    studentsText
    totalDuration
    payable
    teacherCurrency
    isPaid
    paid
    paidAt
    paymentDate
    expenseId
    fromDate
    toDate
    note
    linkedSessionCount
    createdAt
  }
`;

export const carryoverBalancesQueryDocument: TypedDocumentNode<
  CarryoverBalancesQuery,
  CarryoverBalancesQueryVariables
> = gql`
  ${CarryoverBalanceFieldsFragment}
  query CarryoverBalances($filter: CarryoverFilter, $limit: Int, $offset: Int) {
    carryoverBalances(filter: $filter, limit: $limit, offset: $offset) {
      id
      rows {
        ...CarryoverBalanceFields
      }
      totalCount
      aggregates {
        id
        totalPayable
        totalPaid
        dominantCurrency
        rowCountByPaid
      }
    }
  }
`;

export const carryoverBalanceQueryDocument: TypedDocumentNode<CarryoverBalanceQuery, CarryoverBalanceQueryVariables> =
  gql`
  ${CarryoverBalanceFieldsFragment}
  query CarryoverBalance($id: ID!) {
    carryoverBalance(id: $id) {
      ...CarryoverBalanceFields
    }
  }
`;

export const carryoverBalanceLinkedSessionsQueryDocument: TypedDocumentNode<
  CarryoverBalanceLinkedSessionsQuery,
  CarryoverBalanceLinkedSessionsQueryVariables
> = gql`
  query CarryoverBalanceLinkedSessions($carryoverId: ID!) {
    carryoverBalanceLinkedSessions(carryoverId: $carryoverId) {
      id
      studentId
      studentName
      subjectName
      scheduledStartAt
      durationMinutes
      originalAmount
      originalCurrency
      originalStatus
      currentStatus
    }
  }
`;

export const bulkCreateCarryoverBalancesMutationDocument: TypedDocumentNode<
  BulkCreateCarryoverBalancesMutation,
  BulkCreateCarryoverBalancesMutationVariables
> = gql`
  mutation BulkCreateCarryoverBalances($input: BulkCreateCarryoverInput!) {
    bulkCreateCarryoverBalances(input: $input) {
      id
      totalInstanceIds
      auditLogIds
      groups {
        id
        carryoverId
        instanceIds
        teacherId
        payable
        currency
        totalDuration
        studentsCount
      }
    }
  }
`;

export const bulkCarryoverToExpenseMutationDocument: TypedDocumentNode<
  BulkCarryoverToExpenseMutation,
  BulkCarryoverToExpenseMutationVariables
> = gql`
  mutation BulkCarryoverToExpense($input: BulkToExpenseInput!) {
    bulkCarryoverToExpense(input: $input) {
      id
      auditLogIds
      items {
        id
        carryoverId
        expenseId
        amount
        currency
      }
    }
  }
`;

export const createCarryoverBalanceMutationDocument: TypedDocumentNode<
  CreateCarryoverBalanceMutation,
  CreateCarryoverBalanceMutationVariables
> = gql`
  ${CarryoverBalanceFieldsFragment}
  mutation CreateCarryoverBalance($input: CreateCarryoverInput!) {
    createCarryoverBalance(input: $input) {
      ...CarryoverBalanceFields
    }
  }
`;

export const updateCarryoverBalanceMutationDocument: TypedDocumentNode<
  UpdateCarryoverBalanceMutation,
  UpdateCarryoverBalanceMutationVariables
> = gql`
  ${CarryoverBalanceFieldsFragment}
  mutation UpdateCarryoverBalance($input: UpdateCarryoverInput!) {
    updateCarryoverBalance(input: $input) {
      ...CarryoverBalanceFields
    }
  }
`;

export const deleteCarryoverBalanceMutationDocument: TypedDocumentNode<
  DeleteCarryoverBalanceMutation,
  DeleteCarryoverBalanceMutationVariables
> = gql`
  mutation DeleteCarryoverBalance($id: ID!) {
    deleteCarryoverBalance(id: $id) {
      id
      deleted
    }
  }
`;

export const bulkDeleteCarryoverBalancesMutationDocument: TypedDocumentNode<
  BulkDeleteCarryoverBalancesMutation,
  BulkDeleteCarryoverBalancesMutationVariables
> = gql`
  mutation BulkDeleteCarryoverBalances($ids: [ID!]!) {
    bulkDeleteCarryoverBalances(ids: $ids) {
      id
      deletedIds
      auditLogIds
    }
  }
`;

export const unpayCarryoverBalanceMutationDocument: TypedDocumentNode<
  UnpayCarryoverBalanceMutation,
  UnpayCarryoverBalanceMutationVariables
> = gql`
  ${CarryoverBalanceFieldsFragment}
  mutation UnpayCarryoverBalance($id: ID!, $note: String) {
    unpayCarryoverBalance(id: $id, note: $note) {
      ...CarryoverBalanceFields
    }
  }
`;
