import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

export const profileByUserIdQueryDocument: TypedDocumentNode<Operations.ProfileByUserIdQuery> = gql`
  query ProfileByUserId($userId: String!) {
    profileByUserId(userId: $userId) {
      id
      userId
      audience
      scope
      name
      email
      avatarUrl
      teacherId
      parentId
      staffProfileId
      displayCurrency
      teacherOwnProfile {
        id
        name
        email
        phone
        timezone
        hourlyRate
        rateCurrency
        paymentMethod
        totalClasses
      }
      teacherAdminProfile {
        id
        name
        email
        phone
        nationalId
        dateOfBirth
        gender
        address
        qualifications
        timezone
        hourlyRate
        rateCurrency
        status
        updatedAt
        paymentMethod
        totalClasses
        avgEngagementScore
      }
      parentOwnProfile {
        id
        name
        email
        phone
        facebook
        whatsapp
        twitter
      }
      parentAdminProfile {
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
      associatedStudents {
        id
        totalCount
        rows {
          id
          name
          studentAvatarUrl
          status
          primaryTeacherId
          teacherUserId
          teacherName
          teacherAvatarUrl
          hoursPerWeek
          classesRemaining
          classesTotal
        }
      }
      staffProfile {
        id
        staffProfileId
        name
        email
        avatarUrl
        phone
        status
        roleSlug
        roleName
      }
      staffPermissionGroups {
        id
        name
        slug
        description
      }
      staffPermissionOverrides {
        id
        permissionId
        permissionKey
        resource
        action
        state
      }
      bankingSummary {
        id
        beneficiaryName
        bankName
        accountNumber
        routingNumber
        swiftBic
        iban
        verifiedAt
        verifiedByUserId
        verifiedByName
      }
      assignedStudents {
        id
        totalCount
        rows {
          id
          name
          studentAvatarUrl
          parentId
          parentUserId
          parentName
          parentAvatarUrl
          className
          status
          hoursPerWeek
          classesRemaining
          classesTotal
        }
      }
    }
  }
`;

export const updateOwnProfileMutationDocument: TypedDocumentNode<Operations.UpdateOwnProfileMutation> = gql`
  mutation UpdateOwnProfile($input: UpdateOwnProfileInput!) {
    updateOwnProfile(input: $input) {
      id
      userId
      audience
      scope
      name
      email
      avatarUrl
      teacherId
      parentId
      staffProfileId
      displayCurrency
      teacherOwnProfile {
        id
        name
        email
        phone
        timezone
        hourlyRate
        rateCurrency
        paymentMethod
        totalClasses
      }
      parentOwnProfile {
        id
        name
        email
        phone
        facebook
        whatsapp
        twitter
      }
      staffProfile {
        id
        staffProfileId
        name
        email
        phone
        status
      }
    }
  }
`;

export const updateUserProfileMutationDocument: TypedDocumentNode<Operations.UpdateUserProfileMutation> = gql`
  mutation UpdateUserProfile($userId: String!, $input: UpdateUserProfileInput!) {
    updateUserProfile(userId: $userId, input: $input) {
      id
      userId
      audience
      scope
      name
      email
      avatarUrl
      teacherId
      parentId
      staffProfileId
      displayCurrency
      teacherAdminProfile {
        id
        name
        email
        phone
        nationalId
        dateOfBirth
        gender
        address
        qualifications
        timezone
        hourlyRate
        rateCurrency
        paymentMethod
        status
        updatedAt
        totalClasses
        avgEngagementScore
      }
      parentAdminProfile {
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
      staffProfile {
        id
        staffProfileId
        name
        email
        phone
        status
      }
    }
  }
`;
