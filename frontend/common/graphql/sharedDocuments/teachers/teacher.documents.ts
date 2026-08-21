import { gql, type TypedDocumentNode } from "@apollo/client";
import type { TeachersQuery, TeachersQueryVariables } from "@/frontend/common/graphql/generated/gql/graphql";

export const teachersQueryDocument: TypedDocumentNode<TeachersQuery, TeachersQueryVariables> = gql`
  query teachers($search: String!, $limit: Int!) {
    teachers(search: $search, limit: $limit) {
      id
      name
      avatarUrl
    }
  }
`;
