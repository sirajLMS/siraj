import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

export const ensureDemoUsersMutationDocument: TypedDocumentNode<
  Operations.EnsureDemoUsersMutation,
  Record<string, never>
> = gql`
  mutation ensureDemoUsers {
    ensureDemoUsers
  }
`;

export const createTestEntitiesMutationDocument: TypedDocumentNode<
  Operations.CreateTestEntitiesMutation,
  Types.MutationCreateTestEntitiesArgs
> = gql`
  mutation createTestEntities($prefix: String!, $classesRemaining: Int) {
    createTestEntities(prefix: $prefix, classesRemaining: $classesRemaining) {
      studentUserEmail
      studentUserId
      studentId
      studentName
      parentUserEmail
      parentUserId
      parentId
      parentName
      teacherUserEmail
      teacherUserId
      teacherId
      teacherName
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

export const createTestGroupClassMutationDocument: TypedDocumentNode<
  Operations.CreateTestGroupClassMutation,
  Types.MutationCreateTestGroupClassArgs
> = gql`
  mutation createTestGroupClass($classInstanceId: String!, $teacherName: String!) {
    createTestGroupClass(classInstanceId: $classInstanceId, teacherName: $teacherName) {
      groupClassId
    }
  }
`;

export const cleanupTestGroupClassMutationDocument: TypedDocumentNode<
  Operations.CleanupTestGroupClassMutation,
  Types.MutationCleanupTestGroupClassArgs
> = gql`
  mutation cleanupTestGroupClass($groupClassId: String!) {
    cleanupTestGroupClass(groupClassId: $groupClassId)
  }
`;

export const cleanupTestManagerMutationDocument: TypedDocumentNode<
  Operations.CleanupTestManagerMutation,
  Types.MutationCleanupTestManagerArgs
> = gql`
  mutation cleanupTestManager($userId: String!) {
    cleanupTestManager(userId: $userId)
  }
`;

export const createTestSuperAdminMutationDocument: TypedDocumentNode<
  Operations.CreateTestSuperAdminMutation,
  Types.MutationCreateTestSuperAdminArgs
> = gql`
  mutation createTestSuperAdmin($prefix: String!) {
    createTestSuperAdmin(prefix: $prefix) {
      userId
      email
    }
  }
`;

export const cleanupTestSuperAdminMutationDocument: TypedDocumentNode<
  Operations.CleanupTestSuperAdminMutation,
  Types.MutationCleanupTestSuperAdminArgs
> = gql`
  mutation cleanupTestSuperAdmin($userId: String!) {
    cleanupTestSuperAdmin(userId: $userId)
  }
`;
