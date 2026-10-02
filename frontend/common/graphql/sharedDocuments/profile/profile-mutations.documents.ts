import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  UpdateOwnProfileMutation,
  UpdateUserProfileMutation,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { PAYMENT_METHOD_DEFAULTS_FIELDS } from "@/frontend/common/graphql/sharedDocuments/billing/payment-method.documents";

export const updateOwnProfileMutationDocument: TypedDocumentNode<UpdateOwnProfileMutation> = gql`
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
        userId
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

export const updateUserProfileMutationDocument: TypedDocumentNode<UpdateUserProfileMutation> = gql`
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
        userId
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
