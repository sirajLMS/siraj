import type { TypedDocumentNode } from "@apollo/client";
import { gql } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

// ─── Query: parentDocuments ──────────────────────────────────────────────────

export const parentDocumentsQueryDocument: TypedDocumentNode<
  Operations.ParentDocumentsQuery,
  Types.QueryParentDocumentsArgs
> = gql`
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
  Operations.LinkDocumentToParentMutation,
  Types.MutationLinkDocumentToParentArgs
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
