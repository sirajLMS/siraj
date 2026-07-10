import type { TypedDocumentNode } from "@apollo/client";
import { gql } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

// ─── Query: parentProfile ────────────────────────────────────────────────────

export const parentProfileQueryDocument: TypedDocumentNode<
  Operations.ParentProfileQuery,
  Types.QueryParentProfileArgs
> = gql`
  query ParentProfile($parentId: String!) {
    parentProfile(parentId: $parentId) {
      id
      userId
      name
      email
      avatarUrl
      status
      phone
      nationality
      address
      facebook
      whatsapp
      twitter
      invoiceType
      feeAmount
      paymentMethod
      currency
      timezone
      createdAt
      updatedAt
    }
  }
`;

// ─── Query: parentAssociatedStudents ─────────────────────────────────────────

export const parentAssociatedStudentsQueryDocument: TypedDocumentNode<
  Operations.ParentAssociatedStudentsQuery,
  Types.QueryParentAssociatedStudentsArgs
> = gql`
  query ParentAssociatedStudents($parentId: String!) {
    parentAssociatedStudents(parentId: $parentId) {
      id
      name
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
  Operations.DeactivateParentMutation,
  Types.MutationDeactivateParentArgs
> = gql`
  mutation DeactivateParent($parentId: String!) {
    deactivateParent(parentId: $parentId) {
      id
      status
    }
  }
`;

// ─── Mutation: updateStudentQuota ─────────────────────────────────────────────

export const updateStudentQuotaMutationDocument: TypedDocumentNode<
  Operations.UpdateStudentQuotaMutation,
  Types.MutationUpdateStudentQuotaArgs
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
