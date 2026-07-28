import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

const ENV_CONFIG_ENTRY_FIELDS = gql`
  fragment EnvConfigEntryFields on EnvConfigEntry {
    id
    key
    category
    displayStrategy
    description
    isSecret
    excludeFromDb
    value
    source
    hasDbOverride
    editable
  }
`;

const ENV_CONFIG_UPSERT_RESULT_FIELDS = gql`
  fragment EnvConfigUpsertResultFields on EnvConfigUpsertResult {
    id
    key
    source
    hasDbOverride
    updatedAt
  }
`;

const ENV_CONFIG_DELETE_RESULT_FIELDS = gql`
  fragment EnvConfigDeleteResultFields on EnvConfigDeleteResult {
    id
    key
    deleted
    source
  }
`;

export const envConfigEntriesQueryDocument: TypedDocumentNode<Operations.EnvConfigEntriesQuery> = gql`
  ${ENV_CONFIG_ENTRY_FIELDS}
  query envConfigEntries {
    envConfigEntries {
      ...EnvConfigEntryFields
    }
  }
`;

export const upsertEnvConfigEntryMutationDocument: TypedDocumentNode<
  Operations.UpsertEnvConfigEntryMutation,
  Types.MutationUpsertEnvConfigEntryArgs
> = gql`
  ${ENV_CONFIG_UPSERT_RESULT_FIELDS}
  mutation upsertEnvConfigEntry($input: EnvConfigUpsertInput!) {
    upsertEnvConfigEntry(input: $input) {
      ...EnvConfigUpsertResultFields
    }
  }
`;

export const deleteEnvConfigEntryMutationDocument: TypedDocumentNode<
  Operations.DeleteEnvConfigEntryMutation,
  Types.MutationDeleteEnvConfigEntryArgs
> = gql`
  ${ENV_CONFIG_DELETE_RESULT_FIELDS}
  mutation deleteEnvConfigEntry($key: String!) {
    deleteEnvConfigEntry(key: $key) {
      ...EnvConfigDeleteResultFields
    }
  }
`;
