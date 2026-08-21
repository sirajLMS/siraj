import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  CreateTeacherImportantNoteMutation,
  CreateTeacherImportantNoteMutationVariables,
  DeleteTeacherImportantNoteMutation,
  DeleteTeacherImportantNoteMutationVariables,
  UpdateTeacherImportantNoteMutation,
  UpdateTeacherImportantNoteMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

const TEACHER_IMPORTANT_NOTE_FIELDS = gql`
  fragment TeacherImportantNoteFields on TeacherImportantNote {
    id
    title
    body
    priority
    startsAt
    expiresAt
  }
`;

export const createTeacherImportantNoteMutationDocument: TypedDocumentNode<
  CreateTeacherImportantNoteMutation,
  CreateTeacherImportantNoteMutationVariables
> = gql`
  ${TEACHER_IMPORTANT_NOTE_FIELDS}
  mutation createTeacherImportantNote($input: CreateTeacherNoteInput!) {
    createTeacherImportantNote(input: $input) {
      ...TeacherImportantNoteFields
    }
  }
`;

export const updateTeacherImportantNoteMutationDocument: TypedDocumentNode<
  UpdateTeacherImportantNoteMutation,
  UpdateTeacherImportantNoteMutationVariables
> = gql`
  ${TEACHER_IMPORTANT_NOTE_FIELDS}
  mutation updateTeacherImportantNote($id: ID!, $input: UpdateTeacherNoteInput!) {
    updateTeacherImportantNote(id: $id, input: $input) {
      ...TeacherImportantNoteFields
    }
  }
`;

export const deleteTeacherImportantNoteMutationDocument: TypedDocumentNode<
  DeleteTeacherImportantNoteMutation,
  DeleteTeacherImportantNoteMutationVariables
> = gql`
  mutation deleteTeacherImportantNote($id: ID!) {
    deleteTeacherImportantNote(id: $id)
  }
`;
