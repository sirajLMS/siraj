import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

export const teachersQueryDocument: TypedDocumentNode<Operations.TeachersQuery, Types.QueryTeachersArgs> = gql`
  query teachers($search: String!, $limit: Int!) {
    teachers(search: $search, limit: $limit) {
      id
      name
      avatarUrl
    }
  }
`;
