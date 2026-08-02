import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

export const createTeacherMutationDocument: TypedDocumentNode<
  Operations.CreateTeacherMutation,
  Types.MutationCreateTeacherArgs
> = gql`
  mutation createTeacher($input: TeacherOnboardingInput!) {
    createTeacher(input: $input) {
      userId
      id
      name
      email
      phone
      status
      gender
      timezoneDisplay
    }
  }
`;
