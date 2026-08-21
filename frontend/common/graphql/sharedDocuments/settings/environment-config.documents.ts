import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  DeleteEnvConfigEntryMutation,
  DeleteEnvConfigEntryMutationVariables,
  EnvConfigEntriesQuery,
  UpsertEnvConfigEntryMutation,
  UpsertEnvConfigEntryMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

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

export const envConfigEntriesQueryDocument: TypedDocumentNode<EnvConfigEntriesQuery> = gql`
  ${ENV_CONFIG_ENTRY_FIELDS}
  query envConfigEntries {
    envConfigEntries {
      ...EnvConfigEntryFields
    }
  }
`;

export const upsertEnvConfigEntryMutationDocument: TypedDocumentNode<
  UpsertEnvConfigEntryMutation,
  UpsertEnvConfigEntryMutationVariables
> = gql`
  ${ENV_CONFIG_UPSERT_RESULT_FIELDS}
  mutation upsertEnvConfigEntry($input: EnvConfigUpsertInput!) {
    upsertEnvConfigEntry(input: $input) {
      ...EnvConfigUpsertResultFields
    }
  }
`;

export const deleteEnvConfigEntryMutationDocument: TypedDocumentNode<
  DeleteEnvConfigEntryMutation,
  DeleteEnvConfigEntryMutationVariables
> = gql`
  ${ENV_CONFIG_DELETE_RESULT_FIELDS}
  mutation deleteEnvConfigEntry($key: String!) {
    deleteEnvConfigEntry(key: $key) {
      ...EnvConfigDeleteResultFields
    }
  }
`;
