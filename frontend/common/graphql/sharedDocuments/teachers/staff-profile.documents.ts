import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  TeacherProfileForEditQuery,
  TeacherProfileForEditQueryVariables,
  UpdateTeacherProfileMutation,
  UpdateTeacherProfileMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const teacherProfileForEditQueryDocument: TypedDocumentNode<
  TeacherProfileForEditQuery,
  TeacherProfileForEditQueryVariables
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
  UpdateTeacherProfileMutation,
  UpdateTeacherProfileMutationVariables
> = gql`
  mutation updateTeacherProfile($teacherId: ID!, $input: TeacherProfileUpdateInput!) {
    updateTeacherProfile(teacherId: $teacherId, input: $input) {
      id
      userId
      name
      email
      phone
      nationalId {
        countryCode
        number
      }
      nationality
      countryCode
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
