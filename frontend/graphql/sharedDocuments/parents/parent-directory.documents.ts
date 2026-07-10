import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

export const parentDirectoryQueryDocument: TypedDocumentNode<
  Operations.ParentDirectoryQuery,
  Types.QueryParentDirectoryArgs
> = gql`
  query parentDirectory($paginationArgs: PaginationArgs, $search: String, $statusFilter: ParentStatus) {
    parentDirectory(paginationArgs: $paginationArgs, search: $search, statusFilter: $statusFilter) {
      id
      metrics {
        id
        activated
        deactivated
        regular
        onLeave
        onTrial
        suspended
      }
      rows {
        id
        userId
        index
        name
        email
        avatarUrl
        guardianOf
        time
        accountStatus
        unpaidInvoices
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
