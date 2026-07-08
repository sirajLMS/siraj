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
      teacherOwnProfile {
        id
        name
        email
        phone
        timezone
        hourlyRate
        rateCurrency
        paymentMethod
        zoomLink
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
        zoomLink
        zoomUsername
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
        defaultZoomLink
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
        defaultZoomLink
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
      teacherOwnProfile {
        id
        name
        email
        phone
        timezone
        hourlyRate
        rateCurrency
        paymentMethod
        zoomLink
      }
      parentOwnProfile {
        id
        name
        email
        phone
        facebook
        whatsapp
        twitter
        defaultZoomLink
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
      teacherAdminProfile {
        id
        name
        email
        phone
        timezone
        hourlyRate
        rateCurrency
        paymentMethod
        zoomLink
      }
      parentAdminProfile {
        id
        userId
        name
        email
        phone
        nationality
        address
        facebook
        whatsapp
        twitter
        defaultZoomLink
        invoiceType
        feeAmount
        paymentMethod
        currency
        timezone
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
