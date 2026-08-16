import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

const WHATSAPP_ACCOUNT_FIELDS = gql`
  fragment WhatsappAccountFields on WhatsappAccount {
    id
    wabaId
    phoneNumberId
    displayPhoneNumber
    displayName
    isActive
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

export const whatsappAccountsQueryDocument: TypedDocumentNode<Operations.WhatsappAccountsQuery> = gql`
  ${WHATSAPP_ACCOUNT_FIELDS}
  query whatsappAccounts {
    whatsappAccounts {
      ...WhatsappAccountFields
    }
  }
`;

export const isUserWhatsappOptInQueryDocument: TypedDocumentNode<
  Operations.IsUserWhatsappOptInQuery,
  Types.QueryIsUserWhatsappOptInArgs
> = gql`
  query isUserWhatsappOptIn($userId: String!) {
    isUserWhatsappOptIn(userId: $userId)
  }
`;

// ─── Mutations ───────────────────────────────────────────────────────

export const createWhatsappAccountMutationDocument: TypedDocumentNode<
  Operations.CreateWhatsappAccountMutation,
  Types.MutationCreateWhatsappAccountArgs
> = gql`
  ${WHATSAPP_ACCOUNT_FIELDS}
  mutation createWhatsappAccount($input: WhatsappAccountCreateInput!) {
    createWhatsappAccount(input: $input) {
      ...WhatsappAccountFields
    }
  }
`;

export const updateWhatsappAccountMutationDocument: TypedDocumentNode<
  Operations.UpdateWhatsappAccountMutation,
  Types.MutationUpdateWhatsappAccountArgs
> = gql`
  mutation updateWhatsappAccount($id: String!, $input: WhatsappAccountUpdateInput!) {
    updateWhatsappAccount(id: $id, input: $input) {
      id
    }
  }
`;

export const deleteWhatsappAccountMutationDocument: TypedDocumentNode<
  Operations.DeleteWhatsappAccountMutation,
  Types.MutationDeleteWhatsappAccountArgs
> = gql`
  mutation deleteWhatsappAccount($id: String!) {
    deleteWhatsappAccount(id: $id) {
      id
    }
  }
`;

export const setWhatsappAccessTokenMutationDocument: TypedDocumentNode<
  Operations.SetWhatsappAccessTokenMutation,
  Types.MutationSetWhatsappAccessTokenArgs
> = gql`
  mutation setWhatsappAccessToken($id: String!, $accessToken: String!) {
    setWhatsappAccessToken(id: $id, accessToken: $accessToken) {
      id
    }
  }
`;

export const setWhatsappTwoStepPinMutationDocument: TypedDocumentNode<
  Operations.SetWhatsappTwoStepPinMutation,
  Types.MutationSetWhatsappTwoStepPinArgs
> = gql`
  mutation setWhatsappTwoStepPin($id: String!, $twoStepPin: String!) {
    setWhatsappTwoStepPin(id: $id, twoStepPin: $twoStepPin) {
      id
    }
  }
`;

export const setUserWhatsappOptInMutationDocument: TypedDocumentNode<
  Operations.SetUserWhatsappOptInMutation,
  Types.MutationSetUserWhatsappOptInArgs
> = gql`
  mutation setUserWhatsappOptIn($userId: String!, $enabled: Boolean!, $source: String) {
    setUserWhatsappOptIn(userId: $userId, enabled: $enabled, source: $source) {
      id
    }
  }
`;

export const syncWhatsappAccountsFromMetaMutationDocument: TypedDocumentNode<Operations.SyncWhatsappAccountsFromMetaMutation> = gql`
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

export const isWhatsappConfiguredQueryDocument: TypedDocumentNode<Operations.IsWhatsappConfiguredQuery> = gql`
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
// CROSS-FILE DEPENDENCY (Task 9):
//   Required backend resolvers:
//   - `whatsappTemplates` query returning `[WhatsappTemplateSnapshot!]`
//     (or a new persisted templates type with body/buttonStructure fields)
//   - `whatsappOptInAudit` query returning a new `WhatsappOptInAuditEntry` type
//   Resolvers must be added in:
//     backend/graphql/query/whatsapp/whatsapp-account.query.ts
//   Pothos object types in:
//     backend/graphql/pothos/whatsapp/whatsapp-account.pothos.ts
//   Run `bun run generate:gqlSchema && bun codegen` after backend resolvers
//   are added, then replace the comments below with typed exports:
//
// export const whatsappTemplatesQueryDocument: TypedDocumentNode<Operations.WhatsappTemplatesQuery> = gql`
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
// export const whatsappOptInAuditQueryDocument: TypedDocumentNode<Operations.WhatsappOptInAuditQuery> = gql`
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
