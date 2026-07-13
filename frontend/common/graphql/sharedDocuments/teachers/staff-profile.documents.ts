import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

export const teacherProfileForEditQueryDocument: TypedDocumentNode<
  Operations.TeacherProfileForEditQuery,
  Types.QueryTeacherProfileForEditArgs
> = gql`
  query teacherProfileForEdit($teacherId: ID!) {
    teacherProfileForEdit(teacherId: $teacherId) {
      id
      userId
      name
      email
      phone
      dateOfBirth
      gender
      address
      qualifications
      timezone
      hourlyRate
      rateCurrency
      status
      updatedAt
      totalClasses
      avgEngagementScore
    }
  }
`;

export const updateTeacherProfileMutationDocument: TypedDocumentNode<
  Operations.UpdateTeacherProfileMutation,
  Types.MutationUpdateTeacherProfileArgs
> = gql`
  mutation updateTeacherProfile($teacherId: ID!, $input: TeacherProfileUpdateInput!) {
    updateTeacherProfile(teacherId: $teacherId, input: $input) {
      id
      userId
      name
      email
      phone
      dateOfBirth
      gender
      address
      qualifications
      timezone
      hourlyRate
      rateCurrency
      status
      updatedAt
      totalClasses
      avgEngagementScore
    }
  }
`;
