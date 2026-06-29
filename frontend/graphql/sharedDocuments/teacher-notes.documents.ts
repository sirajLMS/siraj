import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

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
  Operations.CreateTeacherImportantNoteMutation,
  Types.MutationCreateTeacherImportantNoteArgs
> = gql`
  ${TEACHER_IMPORTANT_NOTE_FIELDS}
  mutation createTeacherImportantNote($input: CreateTeacherNoteInput!) {
    createTeacherImportantNote(input: $input) {
      ...TeacherImportantNoteFields
    }
  }
`;

export const updateTeacherImportantNoteMutationDocument: TypedDocumentNode<
  Operations.UpdateTeacherImportantNoteMutation,
  Types.MutationUpdateTeacherImportantNoteArgs
> = gql`
  ${TEACHER_IMPORTANT_NOTE_FIELDS}
  mutation updateTeacherImportantNote($id: ID!, $input: UpdateTeacherNoteInput!) {
    updateTeacherImportantNote(id: $id, input: $input) {
      ...TeacherImportantNoteFields
    }
  }
`;

export const deleteTeacherImportantNoteMutationDocument: TypedDocumentNode<
  Operations.DeleteTeacherImportantNoteMutation,
  Types.MutationDeleteTeacherImportantNoteArgs
> = gql`
  mutation deleteTeacherImportantNote($id: ID!) {
    deleteTeacherImportantNote(id: $id)
  }
`;
