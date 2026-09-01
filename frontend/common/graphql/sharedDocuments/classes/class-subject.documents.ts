import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  ClassSubjectByIdQuery,
  ClassSubjectByIdQueryVariables,
  ClassSubjectsQuery,
  ClassSubjectsQueryVariables,
  CreateClassSubjectMutation,
  CreateClassSubjectMutationVariables,
  DeleteClassSubjectMutation,
  DeleteClassSubjectMutationVariables,
  UpdateClassSubjectMutation,
  UpdateClassSubjectMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

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

export const classSubjectsQueryDocument: TypedDocumentNode<ClassSubjectsQuery, ClassSubjectsQueryVariables> = gql`
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

export const classSubjectByIdQueryDocument: TypedDocumentNode<ClassSubjectByIdQuery, ClassSubjectByIdQueryVariables> =
  gql`
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
  CreateClassSubjectMutation,
  CreateClassSubjectMutationVariables
> = gql`
  ${CLASS_SUBJECT_FIELDS}
  mutation createClassSubject($input: ClassSubjectCreateInput!) {
    createClassSubject(input: $input) {
      ...ClassSubjectFields
    }
  }
`;

export const updateClassSubjectMutationDocument: TypedDocumentNode<
  UpdateClassSubjectMutation,
  UpdateClassSubjectMutationVariables
> = gql`
  ${CLASS_SUBJECT_FIELDS}
  mutation updateClassSubject($id: ID!, $input: ClassSubjectUpdateInput!) {
    updateClassSubject(id: $id, input: $input) {
      ...ClassSubjectFields
    }
  }
`;

export const deleteClassSubjectMutationDocument: TypedDocumentNode<
  DeleteClassSubjectMutation,
  DeleteClassSubjectMutationVariables
> = gql`
  mutation deleteClassSubject($id: ID!) {
    deleteClassSubject(id: $id)
  }
`;
