import { gql, type TypedDocumentNode } from "@apollo/client";
import type { ProfileByUserIdQuery } from "@/frontend/common/graphql/generated/gql/graphql";
import { PAYMENT_METHOD_DEFAULTS_FIELDS } from "@/frontend/common/graphql/sharedDocuments/billing/payment-method.documents";

export { updateOwnProfileMutationDocument, updateUserProfileMutationDocument } from "./profile-mutations.documents";

export const profileByUserIdQueryDocument: TypedDocumentNode<ProfileByUserIdQuery> = gql`
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
        nationalId {
          countryCode
          number
        }
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
        userId
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
          id
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
