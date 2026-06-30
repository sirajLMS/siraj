import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

// ─── Mutation: reassignStudentTeacher ───────────────────────────────────────

export const reassignStudentTeacherMutationDocument: TypedDocumentNode<
  Operations.ReassignStudentTeacherMutation,
  Types.MutationReassignStudentTeacherArgs
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
  Operations.ChangeStudentStatusMutation,
  Types.MutationChangeStudentStatusArgs
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
