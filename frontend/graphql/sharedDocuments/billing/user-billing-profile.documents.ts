import type { TypedDocumentNode } from "@apollo/client";
import { gql } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

export const userBillingProfileSummaryQueryDocument: TypedDocumentNode<
  Operations.UserBillingProfileSummaryQuery,
  Types.QueryParentBillingSummaryArgs
> = gql`
  query UserBillingProfileSummary($userId: String, $parentId: String) {
    parentBillingSummary(userId: $userId, parentId: $parentId) {
      id
      outstandingBalance
      paidThisTerm
      nextDueDate
      activeStudents
    }
  }
`;

export const userBillingProfileInvoiceHistoryQueryDocument: TypedDocumentNode<
  Operations.UserBillingProfileInvoiceHistoryQuery,
  Types.QueryParentInvoiceHistoryArgs
> = gql`
  query UserBillingProfileInvoiceHistory($userId: String, $parentId: String, $paginationArgs: PaginationArgs) {
    parentInvoiceHistory(userId: $userId, parentId: $parentId, paginationArgs: $paginationArgs) {
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
