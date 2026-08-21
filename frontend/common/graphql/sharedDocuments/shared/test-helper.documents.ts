import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  CleanupTestEntitiesMutation,
  CleanupTestEntitiesMutationVariables,
  CleanupTestGroupClassMutation,
  CleanupTestGroupClassMutationVariables,
  CleanupTestManagerMutation,
  CleanupTestManagerMutationVariables,
  CleanupTestSuperAdminMutation,
  CleanupTestSuperAdminMutationVariables,
  CreateTestEntitiesMutation,
  CreateTestEntitiesMutationVariables,
  CreateTestGroupClassMutation,
  CreateTestGroupClassMutationVariables,
  CreateTestSuperAdminMutation,
  CreateTestSuperAdminMutationVariables,
  EnsureDemoUsersMutation,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const ensureDemoUsersMutationDocument: TypedDocumentNode<EnsureDemoUsersMutation, Record<string, never>> = gql`
  mutation ensureDemoUsers {
    ensureDemoUsers
  }
`;

export const createTestEntitiesMutationDocument: TypedDocumentNode<
  CreateTestEntitiesMutation,
  CreateTestEntitiesMutationVariables
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
  CleanupTestEntitiesMutation,
  CleanupTestEntitiesMutationVariables
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
  CreateTestGroupClassMutation,
  CreateTestGroupClassMutationVariables
> = gql`
  mutation createTestGroupClass($classInstanceId: String!, $teacherName: String!) {
    createTestGroupClass(classInstanceId: $classInstanceId, teacherName: $teacherName) {
      groupClassId
    }
  }
`;

export const cleanupTestGroupClassMutationDocument: TypedDocumentNode<
  CleanupTestGroupClassMutation,
  CleanupTestGroupClassMutationVariables
> = gql`
  mutation cleanupTestGroupClass($groupClassId: String!) {
    cleanupTestGroupClass(groupClassId: $groupClassId)
  }
`;

export const cleanupTestManagerMutationDocument: TypedDocumentNode<
  CleanupTestManagerMutation,
  CleanupTestManagerMutationVariables
> = gql`
  mutation cleanupTestManager($userId: String!) {
    cleanupTestManager(userId: $userId)
  }
`;

export const createTestSuperAdminMutationDocument: TypedDocumentNode<
  CreateTestSuperAdminMutation,
  CreateTestSuperAdminMutationVariables
> = gql`
  mutation createTestSuperAdmin($prefix: String!) {
    createTestSuperAdmin(prefix: $prefix) {
      userId
      email
    }
  }
`;

export const cleanupTestSuperAdminMutationDocument: TypedDocumentNode<
  CleanupTestSuperAdminMutation,
  CleanupTestSuperAdminMutationVariables
> = gql`
  mutation cleanupTestSuperAdmin($userId: String!) {
    cleanupTestSuperAdmin(userId: $userId)
  }
`;
