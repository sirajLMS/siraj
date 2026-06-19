import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

export const createTestEntitiesMutationDocument: TypedDocumentNode<
  Operations.CreateTestEntitiesMutation,
  Types.MutationCreateTestEntitiesArgs
> = gql`
  mutation createTestEntities($prefix: String!, $classesRemaining: Int) {
    createTestEntities(prefix: $prefix, classesRemaining: $classesRemaining) {
      studentUserEmail
      studentUserId
      studentId
      parentUserEmail
      parentUserId
      parentId
      teacherUserEmail
      teacherUserId
      teacherId
    }
  }
`;

export const cleanupTestEntitiesMutationDocument: TypedDocumentNode<
  Operations.CleanupTestEntitiesMutation,
  Types.MutationCleanupTestEntitiesArgs
> = gql`
  mutation cleanupTestEntities(
    $studentUserId: String!
    $teacherUserId: String!
    $parentUserId: String!
    $studentId: String!
    $teacherId: String!
    $parentId: String!
  ) {
    cleanupTestEntities(
      studentUserId: $studentUserId
      teacherUserId: $teacherUserId
      parentUserId: $parentUserId
      studentId: $studentId
      teacherId: $teacherId
      parentId: $parentId
    )
  }
`;
