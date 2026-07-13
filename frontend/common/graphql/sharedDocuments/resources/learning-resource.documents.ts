import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

export const learningResourceRowFragment = gql`
fragment LearningResourceRowFragment on LearningResourceRow {
  id
  displayName
  filePath
  uploadedByUserId
  uploadedByUserName
  fileSize
  contentType
  createdAt
}
`;

export const learningResourcesQueryDocument: TypedDocumentNode<
  Operations.LearningResourcesQuery,
  Types.QueryLearningResourcesArgs
> = gql`
  ${learningResourceRowFragment}
  query learningResources($searchQuery: String) {
    learningResources(searchQuery: $searchQuery) {
      ...LearningResourceRowFragment
    }
  }
`;

export const uploadLearningResourceMutationDocument: TypedDocumentNode<
  Operations.UploadLearningResourceMutation,
  Types.MutationUploadLearningResourceArgs
> = gql`
  ${learningResourceRowFragment}
  mutation uploadLearningResource($input: ResourceUploadInput!) {
    uploadLearningResource(input: $input) {
      ...LearningResourceRowFragment
    }
  }
`;

export const prepareUploadMutationDocument: TypedDocumentNode<
  Operations.PrepareUploadMutation,
  Types.MutationPrepareUploadArgs
> = gql`
  mutation prepareUpload($input: UploadPreparationInput!) {
    prepareUpload(input: $input) {
      id
      url
      uploadType
    }
  }
`;

export const deleteLearningResourceMutationDocument: TypedDocumentNode<
  Operations.DeleteLearningResourceMutation,
  Types.MutationDeleteLearningResourceArgs
> = gql`
  mutation DeleteLearningResource($id: ID!) {
    deleteLearningResource(id: $id)
  }
`;
