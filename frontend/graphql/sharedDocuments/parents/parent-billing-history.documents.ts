import type { TypedDocumentNode } from "@apollo/client";
import { gql } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

export const parentInvoiceHistoryQueryDocument: TypedDocumentNode<
  Operations.ParentInvoiceHistoryQuery,
  Types.QueryParentInvoiceHistoryArgs
> = gql`
  query ParentInvoiceHistory($parentId: String, $userId: String, $paginationArgs: PaginationArgs) {
    parentInvoiceHistory(parentId: $parentId, userId: $userId, paginationArgs: $paginationArgs) {
      id
      rows {
        id
        issueDate
        dueDate
        paidDate
        amount
        currency
        status
        invoiceType
        studentId
        studentName
        displayAmount {
          id
          amount
          currency
          stale
        }
      }
      totalCount
      pageInfo {
        count
        currentPage
        firstItem
        hasMorePages
        lastItem
        lastPage
        perPage
        total
      }
    }
  }
`;

export const adminInvoicesQueryDocument: TypedDocumentNode<
  Operations.AdminInvoicesQuery,
  Types.QueryAdminInvoicesArgs
> = gql`
  query AdminInvoices($paginationArgs: PaginationArgs) {
    adminInvoices(paginationArgs: $paginationArgs) {
      id
      rows {
        id
        issueDate
        dueDate
        paidDate
        amount
        currency
        status
        invoiceType
        studentId
        studentName
        displayAmount {
          id
          amount
          currency
          stale
        }
      }
      totalCount
      pageInfo {
        count
        currentPage
        firstItem
        hasMorePages
        lastItem
        lastPage
        perPage
        total
      }
    }
  }
`;

export const adminBillingSummaryQueryDocument: TypedDocumentNode<Operations.AdminBillingSummaryQuery> = gql`
  query AdminBillingSummary {
    adminBillingSummary {
      id
      totalOutstanding
      pendingCount
      mtdRevenue
      negativeBalanceCount
    }
  }
`;

export const studentCreditStatusQueryDocument: TypedDocumentNode<Operations.StudentCreditStatusQuery> = gql`
  query StudentCreditStatus {
    studentCreditStatus {
      id
      studentName
      parentEmail
      planType
      classesRemaining
      classesTotal
      status
    }
  }
`;

export const parentBillingSummaryQueryDocument: TypedDocumentNode<
  Operations.ParentBillingSummaryQuery,
  Types.QueryParentBillingSummaryArgs
> = gql`
  query ParentBillingSummary($parentId: String, $userId: String) {
    parentBillingSummary(parentId: $parentId, userId: $userId) {
      id
      outstandingBalance
      paidThisTerm
      nextDueDate
      activeStudents
    }
  }
`;
