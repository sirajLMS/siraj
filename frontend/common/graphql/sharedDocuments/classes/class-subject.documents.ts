import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

const CLASS_SUBJECT_FIELDS = gql`
  fragment ClassSubjectFields on ClassSubject {
    id
    name
    slug
    description
    avatarUrl
    isActive
    sortOrder
    categoryId
    hourlyRate
    rateCurrency
    category {
      id
      name
      slug
    }
  }
`;

const SUBJECT_RESOURCE_FIELDS = gql`
  fragment SubjectResourceFields on SubjectResource {
    id
    subjectId
    learningResourceId
    resourceType
    sortOrder
    displayName
    filePath
  }
`;

export const classSubjectsQueryDocument: TypedDocumentNode<
  Operations.ClassSubjectsQuery,
  Types.QueryClassSubjectsArgs
> = gql`
  ${CLASS_SUBJECT_FIELDS}
  ${SUBJECT_RESOURCE_FIELDS}
  query classSubjects($categoryId: String) {
    classSubjects(categoryId: $categoryId) {
      ...ClassSubjectFields
      resources {
        ...SubjectResourceFields
      }
    }
  }
`;

export const classSubjectByIdQueryDocument: TypedDocumentNode<
  Operations.ClassSubjectByIdQuery,
  Types.QueryClassSubjectArgs
> = gql`
  ${CLASS_SUBJECT_FIELDS}
  ${SUBJECT_RESOURCE_FIELDS}
  query classSubjectById($id: ID!) {
    classSubject(id: $id) {
      ...ClassSubjectFields
      resources {
        ...SubjectResourceFields
      }
    }
  }
`;

export const createClassSubjectMutationDocument: TypedDocumentNode<
  Operations.CreateClassSubjectMutation,
  Types.MutationCreateClassSubjectArgs
> = gql`
  ${CLASS_SUBJECT_FIELDS}
  mutation createClassSubject($input: ClassSubjectCreateInput!) {
    createClassSubject(input: $input) {
      ...ClassSubjectFields
    }
  }
`;

export const updateClassSubjectMutationDocument: TypedDocumentNode<
  Operations.UpdateClassSubjectMutation,
  Types.MutationUpdateClassSubjectArgs
> = gql`
  ${CLASS_SUBJECT_FIELDS}
  mutation updateClassSubject($id: ID!, $input: ClassSubjectUpdateInput!) {
    updateClassSubject(id: $id, input: $input) {
      ...ClassSubjectFields
    }
  }
`;

export const deleteClassSubjectMutationDocument: TypedDocumentNode<
  Operations.DeleteClassSubjectMutation,
  Types.MutationDeleteClassSubjectArgs
> = gql`
  mutation deleteClassSubject($id: ID!) {
    deleteClassSubject(id: $id)
  }
`;

export const attachSubjectResourceMutationDocument: TypedDocumentNode<
  Operations.AttachSubjectResourceMutation,
  Types.MutationAttachSubjectResourceArgs
> = gql`
  ${SUBJECT_RESOURCE_FIELDS}
  mutation attachSubjectResource($input: AttachSubjectResourceInput!) {
    attachSubjectResource(input: $input) {
      ...SubjectResourceFields
    }
  }
`;

export const detachSubjectResourceMutationDocument: TypedDocumentNode<
  Operations.DetachSubjectResourceMutation,
  Types.MutationDetachSubjectResourceArgs
> = gql`
  mutation detachSubjectResource($subjectId: ID!, $learningResourceId: ID!) {
    detachSubjectResource(subjectId: $subjectId, learningResourceId: $learningResourceId)
  }
`;
