import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  ChangeStudentStatusMutation,
  ChangeStudentStatusMutationVariables,
  ReassignStudentTeacherMutation,
  ReassignStudentTeacherMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

// ─── Mutation: reassignStudentTeacher ───────────────────────────────────────

export const reassignStudentTeacherMutationDocument: TypedDocumentNode<
  ReassignStudentTeacherMutation,
  ReassignStudentTeacherMutationVariables
> = gql`
  mutation ReassignStudentTeacher(
    $studentId: String!
    $newTeacherId: String!
    $expectedVersion: Int
  ) {
    reassignStudentTeacher(
      studentId: $studentId
      newTeacherId: $newTeacherId
      expectedVersion: $expectedVersion
    ) {
      id
      primaryTeacherId
      version
    }
  }
`;

// ─── Mutation: changeStudentStatus ──────────────────────────────────────────

export const changeStudentStatusMutationDocument: TypedDocumentNode<
  ChangeStudentStatusMutation,
  ChangeStudentStatusMutationVariables
> = gql`
  mutation ChangeStudentStatus(
    $studentId: String!
    $newStatus: StudentStatus!
    $expectedVersion: Int
  ) {
    changeStudentStatus(
      studentId: $studentId
      newStatus: $newStatus
      expectedVersion: $expectedVersion
    ) {
      id
      status
      version
    }
  }
`;
