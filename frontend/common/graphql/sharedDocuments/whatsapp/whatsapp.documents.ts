import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  CompleteWhatsappEmbeddedSignupMutation,
  CompleteWhatsappEmbeddedSignupMutationVariables,
  CreateWhatsappAccountMutation,
  CreateWhatsappAccountMutationVariables,
  DeleteWhatsappAccountMutation,
  DeleteWhatsappAccountMutationVariables,
  IsUserWhatsappOptInQuery,
  IsUserWhatsappOptInQueryVariables,
  IsWhatsappConfiguredQuery,
  SetUserWhatsappOptInMutation,
  SetUserWhatsappOptInMutationVariables,
  SetWhatsappAccessTokenMutation,
  SetWhatsappAccessTokenMutationVariables,
  SetWhatsappTwoStepPinMutation,
  SetWhatsappTwoStepPinMutationVariables,
  SyncWhatsappAccountsFromMetaMutation,
  UpdateWhatsappAccountMutation,
  UpdateWhatsappAccountMutationVariables,
  WhatsappAccountsQuery,
} from "@/frontend/common/graphql/generated/gql/graphql";

const WHATSAPP_ACCOUNT_FIELDS = gql`
  fragment WhatsappAccountFields on WhatsappAccount {
    id
    wabaId
    phoneNumberId
    displayPhoneNumber
    displayName
    isActive
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

export const deleteWhatsappAccountMutationDocument: TypedDocumentNode<
  DeleteWhatsappAccountMutation,
  DeleteWhatsappAccountMutationVariables
> = gql`
  ${WHATSAPP_ACCOUNT_FIELDS}
  mutation deleteWhatsappAccount($id: String!) {
    deleteWhatsappAccount(id: $id) {
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

export const isWhatsappConfiguredQueryDocument: TypedDocumentNode<IsWhatsappConfiguredQuery> = gql`
  query isWhatsappConfigured {
    isWhatsappConfigured
  }
`;

// ─── Pending Backend Resolver Queries ────────────────────────────────
// The following documents target queries that do NOT yet exist in the
// backend Pothos schema (no `whatsappTemplates` or `whatsappOptInAudit`
// query root field). They are stub definitions ready to be un-commented
// once the backend resolvers are created.
//
// Required backend work:
//   - `whatsappTemplates` query returning `[WhatsappTemplateSnapshot!]`
//     (or a new persisted templates type with body/buttonStructure fields)
//   - `whatsappOptInAudit` query returning a new `WhatsappOptInAuditEntry` type
//   Resolvers belong in:
//     backend/graphql/query/whatsapp/whatsapp-account.query.ts
//   Pothos object types in:
//     backend/graphql/pothos/whatsapp/whatsapp-account.pothos.ts
//   Run `bun run generate:gqlSchema && bun codegen` after backend resolvers
//   are added, then replace the comments below with typed exports:
//
// export const whatsappTemplatesQueryDocument: TypedDocumentNode<WhatsappTemplatesQuery> = gql`
//   query WhatsappTemplatesQuery {
//     whatsappTemplates {
//       id
//       name
//       language
//       category
//       status
//     }
//   }
// `;
//
// export const whatsappOptInAuditQueryDocument: TypedDocumentNode<WhatsappOptInAuditQuery> = gql`
//   query WhatsappOptInAuditQuery {
//     whatsappOptInAudit {
//       id
//       optedIn
//       optedInAt
//       changedBy
//       createdAt
//     }
//   }
// `;
