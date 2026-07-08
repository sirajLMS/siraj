import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

export const createStudentMutationDocument: TypedDocumentNode<
  Operations.CreateStudentMutation,
  Types.MutationCreateStudentArgs
> = gql`
  mutation createStudent($input: StudentOnboardingInput!) {
    createStudent(input: $input) {
      studentId
      parentId
      name
      status
      primaryTeacherId
    }
  }
`;
