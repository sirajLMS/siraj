import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  DeleteLearningResourceMutation,
  DeleteLearningResourceMutationVariables,
  LearningResourcesQuery,
  LearningResourcesQueryVariables,
  PrepareUploadMutation,
  PrepareUploadMutationVariables,
  UploadLearningResourceMutation,
  UploadLearningResourceMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const learningResourceRowFragment = gql`
fragment LearningResourceRow on LearningResourceRow {
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
  LearningResourcesQuery,
  LearningResourcesQueryVariables
> = gql`
  ${learningResourceRowFragment}
  query learningResources($searchQuery: String) {
    learningResources(searchQuery: $searchQuery) {
      ...LearningResourceRow
    }
  }
`;

export const uploadLearningResourceMutationDocument: TypedDocumentNode<
  UploadLearningResourceMutation,
  UploadLearningResourceMutationVariables
> = gql`
  ${learningResourceRowFragment}
  mutation uploadLearningResource($input: ResourceUploadInput!) {
    uploadLearningResource(input: $input) {
      ...LearningResourceRow
    }
  }
`;

export const prepareUploadMutationDocument: TypedDocumentNode<PrepareUploadMutation, PrepareUploadMutationVariables> =
  gql`
  mutation prepareUpload($input: UploadPreparationInput!) {
    prepareUpload(input: $input) {
      id
      url
      uploadType
    }
  }
`;

export const deleteLearningResourceMutationDocument: TypedDocumentNode<
  DeleteLearningResourceMutation,
  DeleteLearningResourceMutationVariables
> = gql`
  mutation DeleteLearningResource($id: ID!) {
    deleteLearningResource(id: $id)
  }
`;
