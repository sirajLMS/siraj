import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

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
      pendingPaymentCount
      nextUnpaidInvoice {
        id
        amount
        currency
        dueDate
        studentName
      }
      outstandingByCurrency {
        id
        currency
        amount
        displayAmount {
          id
          amount
          currency
          stale
        }
      }
      paidThisTermByCurrency {
        id
        currency
        amount
        displayAmount {
          id
          amount
          currency
          stale
        }
      }
    }
  }
`;

export const userBillingProfileInvoiceHistoryQueryDocument: TypedDocumentNode<
  Operations.UserBillingProfileInvoiceHistoryQuery,
  Types.QueryParentInvoiceHistoryArgs
> = gql`
  query UserBillingProfileInvoiceHistory($userId: String, $parentId: String, $paginationArgs: PaginationArgs, $search: String) {
    parentInvoiceHistory(userId: $userId, parentId: $parentId, paginationArgs: $paginationArgs, search: $search) {
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
        hasPaymentProof
        hasRejectedSubmission
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
