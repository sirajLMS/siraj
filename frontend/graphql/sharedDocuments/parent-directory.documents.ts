import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

export const parentDirectoryQueryDocument: TypedDocumentNode<
  Operations.ParentDirectoryQuery,
  Types.QueryParentDirectoryArgs
> = gql`
  query parentDirectory($search: String, $limit: Int, $offset: Int) {
    parentDirectory(search: $search, limit: $limit, offset: $offset) {
      id
      metrics {
        id
        activated
        deactivated
        regular
        onLeave
        suspended
        onTrial
      }
      rows {
        id
        index
        name
        email
        avatarUrl
        guardianOf
        time
        accountStatus
        unpaidInvoices
      }
      totalParents
    }
  }
`;
