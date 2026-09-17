import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  CompleteWhatsappEmbeddedSignupMutation,
  CompleteWhatsappEmbeddedSignupMutationVariables,
  CreateWhatsappAccountMutation,
  CreateWhatsappAccountMutationVariables,
  IsUserWhatsappOptInQuery,
  IsUserWhatsappOptInQueryVariables,
  LocalDeactivateWhatsappAccountMutation,
  LocalDeactivateWhatsappAccountMutationVariables,
  SetUserWhatsappOptInMutation,
  SetUserWhatsappOptInMutationVariables,
  SetWhatsappAccessTokenMutation,
  SetWhatsappAccessTokenMutationVariables,
  SetWhatsappTwoStepPinMutation,
  SetWhatsappTwoStepPinMutationVariables,
  SyncWhatsappAccountsFromMetaMutation,
  TestWhatsappAccessTokenMutation,
  TestWhatsappAccessTokenMutationVariables,
  UpdateWhatsappAccountMutation,
  UpdateWhatsappAccountMutationVariables,
  WhatsappAccountsQuery,
  WhatsappConfigurationStatusQuery,
  WhatsappEmbeddedSignupAllowedOriginsUrlQuery,
} from "@/frontend/common/graphql/generated/gql/graphql";

const WHATSAPP_ACCOUNT_FIELDS = gql`
  fragment WhatsappAccountFields on WhatsappAccount {
    id
    wabaId
    phoneNumberId
    displayPhoneNumber
    displayName
    isActive
    isTestNumber
    metaStatus
    purpose
    onboardingMode
    syncStatus
    syncPhase
    syncProgress
    syncDeadlineAt
    syncFailureReason
    qualityRating
    portfolioMessagingLimitTier
    throughputLevel
    maxPhoneNumbersPerBusiness
    lastWebhookAt
    createdAt
    updatedAt
  }
`;

const WHATSAPP_TEMPLATE_SNAPSHOT_FIELDS = gql`
  fragment WhatsappTemplateSnapshotFields on WhatsappTemplateSnapshot {
    id
    name
    language
    status
    category
    lastSyncedAt
  }
`;

// ─── Queries ─────────────────────────────────────────────────────────

export const whatsappAccountsQueryDocument: TypedDocumentNode<WhatsappAccountsQuery> = gql`
  ${WHATSAPP_ACCOUNT_FIELDS}
  query whatsappAccounts {
    whatsappAccounts {
      ...WhatsappAccountFields
    }
  }
`;

export const isUserWhatsappOptInQueryDocument: TypedDocumentNode<
  IsUserWhatsappOptInQuery,
  IsUserWhatsappOptInQueryVariables
> = gql`
  query isUserWhatsappOptIn($userId: String!) {
    isUserWhatsappOptIn(userId: $userId)
  }
`;

// ─── Mutations ───────────────────────────────────────────────────────

export const createWhatsappAccountMutationDocument: TypedDocumentNode<
  CreateWhatsappAccountMutation,
  CreateWhatsappAccountMutationVariables
> = gql`
  ${WHATSAPP_ACCOUNT_FIELDS}
  mutation createWhatsappAccount($input: WhatsappAccountCreateInput!) {
    createWhatsappAccount(input: $input) {
      ...WhatsappAccountFields
    }
  }
`;

export const updateWhatsappAccountMutationDocument: TypedDocumentNode<
  UpdateWhatsappAccountMutation,
  UpdateWhatsappAccountMutationVariables
> = gql`
  ${WHATSAPP_ACCOUNT_FIELDS}
  mutation updateWhatsappAccount($id: String!, $input: WhatsappAccountUpdateInput!) {
    updateWhatsappAccount(id: $id, input: $input) {
      ...WhatsappAccountFields
    }
  }
`;

export const localDeactivateWhatsappAccountMutationDocument: TypedDocumentNode<
  LocalDeactivateWhatsappAccountMutation,
  LocalDeactivateWhatsappAccountMutationVariables
> = gql`
  ${WHATSAPP_ACCOUNT_FIELDS}
  mutation localDeactivateWhatsappAccount($id: String!) {
    localDeactivateWhatsappAccount(id: $id) {
      ...WhatsappAccountFields
    }
  }
`;

export const setWhatsappAccessTokenMutationDocument: TypedDocumentNode<
  SetWhatsappAccessTokenMutation,
  SetWhatsappAccessTokenMutationVariables
> = gql`
  ${WHATSAPP_ACCOUNT_FIELDS}
  mutation setWhatsappAccessToken($id: String!, $accessToken: String!) {
    setWhatsappAccessToken(id: $id, accessToken: $accessToken) {
      ...WhatsappAccountFields
    }
  }
`;

export const testWhatsappAccessTokenMutationDocument: TypedDocumentNode<
  TestWhatsappAccessTokenMutation,
  TestWhatsappAccessTokenMutationVariables
> = gql`
  mutation testWhatsappAccessToken($id: String!, $accessToken: String!) {
    testWhatsappAccessToken(id: $id, accessToken: $accessToken) {
      isValid
      isConnected
      status
      reason
      failureKind
    }
  }
`;

export const setWhatsappTwoStepPinMutationDocument: TypedDocumentNode<
  SetWhatsappTwoStepPinMutation,
  SetWhatsappTwoStepPinMutationVariables
> = gql`
  ${WHATSAPP_ACCOUNT_FIELDS}
  mutation setWhatsappTwoStepPin($id: String!, $twoStepPin: String!) {
    setWhatsappTwoStepPin(id: $id, twoStepPin: $twoStepPin) {
      ...WhatsappAccountFields
    }
  }
`;

export const setUserWhatsappOptInMutationDocument: TypedDocumentNode<
  SetUserWhatsappOptInMutation,
  SetUserWhatsappOptInMutationVariables
> = gql`
  ${WHATSAPP_ACCOUNT_FIELDS}
  mutation setUserWhatsappOptIn($userId: String!, $enabled: Boolean!, $source: String) {
    setUserWhatsappOptIn(userId: $userId, enabled: $enabled, source: $source) {
      ...WhatsappAccountFields
    }
  }
`;

export const syncWhatsappAccountsFromMetaMutationDocument: TypedDocumentNode<SyncWhatsappAccountsFromMetaMutation> = gql`
  ${WHATSAPP_ACCOUNT_FIELDS}
  ${WHATSAPP_TEMPLATE_SNAPSHOT_FIELDS}
  mutation syncWhatsappAccountsFromMeta {
    syncWhatsappAccountsFromMeta {
      id
      accounts {
        ...WhatsappAccountFields
      }
      templates {
        ...WhatsappTemplateSnapshotFields
      }
    }
  }
`;

export const completeWhatsappEmbeddedSignupMutationDocument: TypedDocumentNode<
  CompleteWhatsappEmbeddedSignupMutation,
  CompleteWhatsappEmbeddedSignupMutationVariables
> = gql`
  ${WHATSAPP_ACCOUNT_FIELDS}
  mutation completeWhatsappEmbeddedSignup($input: WhatsappEmbeddedSignupInput!) {
    completeWhatsappEmbeddedSignup(input: $input) {
      ...WhatsappAccountFields
    }
  }
`;

export const whatsappConfigurationStatusQueryDocument: TypedDocumentNode<WhatsappConfigurationStatusQuery> = gql`
  query whatsappConfigurationStatus {
    whatsappConfigurationStatus {
      isConfigured
      envBootstrapAvailable
      missingEnvKeys
    }
  }
`;

export const whatsappEmbeddedSignupAllowedOriginsUrlQueryDocument: TypedDocumentNode<WhatsappEmbeddedSignupAllowedOriginsUrlQuery> = gql`
    query whatsappEmbeddedSignupAllowedOriginsUrl {
      whatsappEmbeddedSignupAllowedOriginsUrl
    }
  `;
