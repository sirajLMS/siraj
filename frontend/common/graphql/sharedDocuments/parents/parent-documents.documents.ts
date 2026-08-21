import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  LinkDocumentToParentMutation,
  LinkDocumentToParentMutationVariables,
  ParentDocumentsQuery,
  ParentDocumentsQueryVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

// ─── Query: parentDocuments ──────────────────────────────────────────────────

export const parentDocumentsQueryDocument: TypedDocumentNode<ParentDocumentsQuery, ParentDocumentsQueryVariables> = gql`
  query ParentDocuments($parentId: String!) {
    parentDocuments(parentId: $parentId) {
      id
      fileId
      filePath
      isProtected
      usageType
      createdAt
    }
  }
`;

// ─── Mutation: linkDocumentToParent ──────────────────────────────────────────

export const linkDocumentToParentMutationDocument: TypedDocumentNode<
  LinkDocumentToParentMutation,
  LinkDocumentToParentMutationVariables
> = gql`
  mutation LinkDocumentToParent(
    $parentId: String!
    $fileId: String!
    $usageType: String!
  ) {
    linkDocumentToParent(
      parentId: $parentId
      fileId: $fileId
      usageType: $usageType
    ) {
      id
      fileId
      filePath
      isProtected
      usageType
      createdAt
    }
  }
`;
