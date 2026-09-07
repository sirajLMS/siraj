import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  BulkDeleteExpensesMutation,
  BulkDeleteExpensesMutationVariables,
  CreateExpenseMutation,
  CreateExpenseMutationVariables,
  DeleteExpenseMutation,
  DeleteExpenseMutationVariables,
  ExpenseQuery,
  ExpenseQueryVariables,
  ExpensesQuery,
  ExpensesQueryVariables,
  UpdateExpenseMutation,
  UpdateExpenseMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

const ExpenseFieldsFragment = gql`
  fragment ExpenseFields on Expense {
    id
    title
    type
    expenseValue
    expenseCurrency
    paymentDate
    expenseDate
    teacherId
    teacherName
    note
    sourceEntity
    sourceEntityId
    createdByUserId
    createdByName
    createdAt
    updatedAt
    deletedAt
    deletedByUserId
    deletedReason
  }
`;

export const expensesQueryDocument: TypedDocumentNode<ExpensesQuery, ExpensesQueryVariables> = gql`
  ${ExpenseFieldsFragment}
  query Expenses($filter: ExpenseFilter, $limit: Int, $offset: Int) {
    expenses(filter: $filter, limit: $limit, offset: $offset) {
      id
      rows {
        ...ExpenseFields
      }
      totalCount
      totalValue
      dominantCurrency
      rowCountByType
    }
  }
`;

export const expenseQueryDocument: TypedDocumentNode<ExpenseQuery, ExpenseQueryVariables> = gql`
  ${ExpenseFieldsFragment}
  query Expense($id: ID!) {
    expense(id: $id) {
      ...ExpenseFields
    }
  }
`;

export const createExpenseMutationDocument: TypedDocumentNode<CreateExpenseMutation, CreateExpenseMutationVariables> =
  gql`
  ${ExpenseFieldsFragment}
  mutation CreateExpense($input: CreateExpenseInput!) {
    createExpense(input: $input) {
      ...ExpenseFields
    }
  }
`;

export const updateExpenseMutationDocument: TypedDocumentNode<UpdateExpenseMutation, UpdateExpenseMutationVariables> =
  gql`
  ${ExpenseFieldsFragment}
  mutation UpdateExpense($input: UpdateExpenseInput!) {
    updateExpense(input: $input) {
      ...ExpenseFields
    }
  }
`;

export const deleteExpenseMutationDocument: TypedDocumentNode<DeleteExpenseMutation, DeleteExpenseMutationVariables> =
  gql`
  mutation DeleteExpense($input: DeleteExpenseInput!) {
    deleteExpense(input: $input) {
      id
      deleted
    }
  }
`;

export const bulkDeleteExpensesMutationDocument: TypedDocumentNode<
  BulkDeleteExpensesMutation,
  BulkDeleteExpensesMutationVariables
> = gql`
  mutation BulkDeleteExpenses($input: BulkDeleteExpensesInput!) {
    bulkDeleteExpenses(input: $input) {
      id
      deleted
      auditLogIds
    }
  }
`;
