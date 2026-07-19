import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

export const parentDirectoryAutocompleteRowFragment = gql`
  fragment ParentDirectoryAutocompleteRowFragment on ParentDirectoryAutocompleteRow {
    id
    name
    avatarUrl
    email
  }
`;

export const parentDirectoryQueryDocument: TypedDocumentNode<
  Operations.ParentDirectoryQuery,
  Types.QueryParentDirectoryArgs
> = gql`
  query parentDirectory(
    $paginationArgs: PaginationArgs
    $search: String
    $lifecycleStatusFilter: ParentStatus
  ) {
    parentDirectory(
      paginationArgs: $paginationArgs
      search: $search
      lifecycleStatusFilter: $lifecycleStatusFilter
    ) {
      id
      metrics {
        id
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
        lifecycleStatus
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

export const parentsDirectoryQueryDocument: TypedDocumentNode<
  Operations.ParentsDirectoryQuery,
  Types.QueryParentsDirectoryArgs
> = gql`
  ${parentDirectoryAutocompleteRowFragment}
  query parentsDirectory($search: String, $limit: Int) {
    parentsDirectory(search: $search, limit: $limit) {
      ...ParentDirectoryAutocompleteRowFragment
    }
  }
`;
