import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
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
