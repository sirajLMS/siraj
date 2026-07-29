import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";
import {
  PAYMENT_METHOD_DEFAULTS_FIELDS,
  USER_PAYMENT_METHOD_FIELDS,
} from "@/frontend/common/graphql/sharedDocuments/billing/payment-method.documents";

export const profileByUserIdQueryDocument: TypedDocumentNode<Operations.ProfileByUserIdQuery> = gql`
  ${USER_PAYMENT_METHOD_FIELDS}
  ${PAYMENT_METHOD_DEFAULTS_FIELDS}
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
      timezone
      phone
      teacherOwnProfile {
        id
        name
        email
        phone
        nationality
        countryCode
        nationalId
        dateOfBirth
        gender
        address
        qualifications
        timezone
        hourlyRate
        rateCurrency
        totalClasses
        displayAmount {
          id
          amount
          currency
          stale
        }
      }
      teacherAdminProfile {
        id
        name
        email
        phone
        nationalId
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
        displayAmount {
          id
          amount
          currency
          stale
        }
      }
      parentOwnProfile {
        id
        name
        email
        phone
        nationality
        address
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
        createdAt
        updatedAt
        displayAmount {
          id
          amount
          currency
          stale
        }
      }
      paymentMethods {
        ...UserPaymentMethodFields
      }
      paymentMethodDefaults {
        ...PaymentMethodDefaultsFields
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
        hourlyRate
        rateCurrency
        displayAmount {
          id
          amount
          currency
          stale
        }
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
      meetingConfigs {
        id
        userId
        providerId
        label
        isDefault
        hasSecret
        details {
          meetingUrl
          username
          tenantId
        }
        provider {
          id
          slug
          name
        }
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
      timezone
      teacherOwnProfile {
        id
        name
        email
        phone
        nationality
        countryCode
        nationalId
        dateOfBirth
        gender
        address
        qualifications
        timezone
        hourlyRate
        rateCurrency
        totalClasses
      }
      parentOwnProfile {
        id
        name
        email
        phone
        nationality
        address
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
        hourlyRate
        rateCurrency
        displayAmount {
          id
          amount
          currency
          stale
        }
      }
    }
  }
`;

export const updateUserProfileMutationDocument: TypedDocumentNode<Operations.UpdateUserProfileMutation> = gql`
  ${USER_PAYMENT_METHOD_FIELDS}
  ${PAYMENT_METHOD_DEFAULTS_FIELDS}
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
      parentAdminProfile {
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
        createdAt
        updatedAt
        displayAmount {
          id
          amount
          currency
          stale
        }
      }
      paymentMethods {
        ...UserPaymentMethodFields
      }
      paymentMethodDefaults {
        ...PaymentMethodDefaultsFields
      }
      staffProfile {
        id
        staffProfileId
        name
        email
        phone
        status
        hourlyRate
        rateCurrency
        displayAmount {
          id
          amount
          currency
          stale
        }
      }
    }
  }
`;
