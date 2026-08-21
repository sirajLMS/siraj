import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  ParentDirectoryQuery,
  ParentDirectoryQueryVariables,
  ParentsDirectoryQuery,
  ParentsDirectoryQueryVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const parentDirectoryAutocompleteRowFragment = gql`
  fragment ParentDirectoryAutocompleteRow on ParentDirectoryAutocompleteRow {
    id
    name
    avatarUrl
    email
  }
`;

export const parentDirectoryQueryDocument: TypedDocumentNode<ParentDirectoryQuery, ParentDirectoryQueryVariables> = gql`
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

export const parentsDirectoryQueryDocument: TypedDocumentNode<ParentsDirectoryQuery, ParentsDirectoryQueryVariables> =
  gql`
  ${parentDirectoryAutocompleteRowFragment}
  query parentsDirectory($search: String, $limit: Int) {
    parentsDirectory(search: $search, limit: $limit) {
      id
      ...ParentDirectoryAutocompleteRow
    }
  }
`;
