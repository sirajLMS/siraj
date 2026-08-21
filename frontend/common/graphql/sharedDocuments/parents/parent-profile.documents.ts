import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  DeactivateParentMutation,
  DeactivateParentMutationVariables,
  ParentAssociatedStudentsQuery,
  ParentAssociatedStudentsQueryVariables,
  ParentProfileQuery,
  ParentProfileQueryVariables,
  ReactivateParentMutation,
  ReactivateParentMutationVariables,
  UpdateStudentQuotaMutation,
  UpdateStudentQuotaMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

// ─── Query: parentProfile ────────────────────────────────────────────────────

export const parentProfileQueryDocument: TypedDocumentNode<ParentProfileQuery, ParentProfileQueryVariables> = gql`
  query ParentProfile($parentId: String!) {
    parentProfile(parentId: $parentId) {
      id
      userId
      name
      email
      avatarUrl
      lifecycleStatus
      accountStatus
      phone
      nationality
      address
      facebook
      whatsapp
      twitter
      invoiceType
      feeAmount
      currency
      timezone
      displayAmount {
        id
        amount
        currency
        stale
      }
      createdAt
      updatedAt
    }
  }
`;

// ─── Query: parentAssociatedStudents ─────────────────────────────────────────

export const parentAssociatedStudentsQueryDocument: TypedDocumentNode<
  ParentAssociatedStudentsQuery,
  ParentAssociatedStudentsQueryVariables
> = gql`
  query ParentAssociatedStudents($parentId: String!) {
    parentAssociatedStudents(parentId: $parentId) {
      id
      name
      avatarUrl
      status
      primaryTeacherId
      teacherUserId
      teacherName
      hoursPerWeek
      classesRemaining
      classesTotal
      language
      gender
      updatedAt
    }
  }
`;

// ─── Mutation: deactivateParent ──────────────────────────────────────────────

export const deactivateParentMutationDocument: TypedDocumentNode<
  DeactivateParentMutation,
  DeactivateParentMutationVariables
> = gql`
  mutation DeactivateParent($parentId: String!) {
    deactivateParent(parentId: $parentId) {
      id
      userId
      accountStatus
    }
  }
`;

export const reactivateParentMutationDocument: TypedDocumentNode<
  ReactivateParentMutation,
  ReactivateParentMutationVariables
> = gql`
  mutation ReactivateParent($parentId: String!) {
    reactivateParent(parentId: $parentId) {
      id
      userId
      accountStatus
    }
  }
`;

// ─── Mutation: updateStudentQuota ─────────────────────────────────────────────

export const updateStudentQuotaMutationDocument: TypedDocumentNode<
  UpdateStudentQuotaMutation,
  UpdateStudentQuotaMutationVariables
> = gql`
  mutation UpdateStudentQuota(
    $studentId: String!
    $newClassesRemaining: Int!
    $expectedVersion: Int
  ) {
    updateStudentQuota(
      studentId: $studentId
      newClassesRemaining: $newClassesRemaining
      expectedVersion: $expectedVersion
    ) {
      id
      classesRemaining
      classesTotal
      version
    }
  }
`;
