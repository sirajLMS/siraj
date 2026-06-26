import type { TypedDocumentNode } from "@apollo/client";
import { gql } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

export const parentInvoiceHistoryQueryDocument: TypedDocumentNode<
  Operations.ParentInvoiceHistoryQuery,
  Types.QueryParentInvoiceHistoryArgs
> = gql`
  query ParentInvoiceHistory($parentId: String!, $paginationArgs: PaginationArgs) {
    parentInvoiceHistory(parentId: $parentId, paginationArgs: $paginationArgs) {
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
