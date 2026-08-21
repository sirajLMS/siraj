import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  CreateStudentMutation,
  CreateStudentMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const createStudentMutationDocument: TypedDocumentNode<CreateStudentMutation, CreateStudentMutationVariables> =
  gql`
  mutation createStudent($input: StudentOnboardingInput!) {
    createStudent(input: $input) {
      id
      studentId
      parentId
      name
      status
      primaryTeacherId
    }
  }
`;
