import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  AdminBillingSummaryQuery,
  AdminInvoicesQuery,
  AdminInvoicesQueryVariables,
  ParentBillingSummaryQuery,
  ParentBillingSummaryQueryVariables,
  ParentInvoiceHistoryQuery,
  ParentInvoiceHistoryQueryVariables,
  StudentCreditStatusQuery,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const parentInvoiceHistoryQueryDocument: TypedDocumentNode<
  ParentInvoiceHistoryQuery,
  ParentInvoiceHistoryQueryVariables
> = gql`
  query ParentInvoiceHistory($parentId: String, $userId: String, $paginationArgs: PaginationArgs, $search: String) {
    parentInvoiceHistory(parentId: $parentId, userId: $userId, paginationArgs: $paginationArgs, search: $search) {
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
        parentId
        parentUserId
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

export const adminInvoicesQueryDocument: TypedDocumentNode<AdminInvoicesQuery, AdminInvoicesQueryVariables> = gql`
  query AdminInvoices($paginationArgs: PaginationArgs, $search: String) {
    adminInvoices(paginationArgs: $paginationArgs, search: $search) {
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
        parentId
        parentUserId
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

export const adminBillingSummaryQueryDocument: TypedDocumentNode<AdminBillingSummaryQuery> = gql`
  query AdminBillingSummary {
    adminBillingSummary {
      id
      totalOutstanding
      pendingCount
      mtdRevenue
      negativeBalanceCount
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
      mtdRevenueByCurrency {
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

export const studentCreditStatusQueryDocument: TypedDocumentNode<StudentCreditStatusQuery> = gql`
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
  ParentBillingSummaryQuery,
  ParentBillingSummaryQueryVariables
> = gql`
  query ParentBillingSummary($parentId: String, $userId: String) {
    parentBillingSummary(parentId: $parentId, userId: $userId) {
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
