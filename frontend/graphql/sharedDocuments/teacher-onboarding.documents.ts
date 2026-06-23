import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

export const createTeacherMutationDocument: TypedDocumentNode<
  Operations.CreateTeacherMutation,
  Types.MutationCreateTeacherArgs
> = gql`
  mutation createTeacher($input: TeacherOnboardingInput!) {
    createTeacher(input: $input) {
      userId
      teacherId
      name
      email
      status
    }
  }
`;
