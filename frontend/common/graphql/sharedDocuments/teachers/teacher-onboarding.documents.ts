import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  CreateTeacherMutation,
  CreateTeacherMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const createTeacherMutationDocument: TypedDocumentNode<CreateTeacherMutation, CreateTeacherMutationVariables> =
  gql`
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
