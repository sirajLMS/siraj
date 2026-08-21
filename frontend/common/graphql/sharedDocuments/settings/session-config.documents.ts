import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  DeleteSessionConfigMutation,
  DeleteSessionConfigMutationVariables,
  SessionConfigQuery,
  SessionConfigQueryVariables,
  SessionConfigsQuery,
  UpsertSessionConfigMutation,
  UpsertSessionConfigMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

const SESSION_CONFIG_FIELDS = gql`
  fragment SessionConfigFields on SessionConfig {
    id
    roleName
    ttlSeconds
    maxConcurrentSessions
    createdAt
    updatedAt
  }
`;

export const sessionConfigsQueryDocument: TypedDocumentNode<SessionConfigsQuery> = gql`
  ${SESSION_CONFIG_FIELDS}
  query sessionConfigs {
    sessionConfigs {
      ...SessionConfigFields
    }
  }
`;

export const sessionConfigQueryDocument: TypedDocumentNode<SessionConfigQuery, SessionConfigQueryVariables> = gql`
  ${SESSION_CONFIG_FIELDS}
  query sessionConfig($roleName: String!) {
    sessionConfig(roleName: $roleName) {
      ...SessionConfigFields
    }
  }
`;

export const upsertSessionConfigMutationDocument: TypedDocumentNode<
  UpsertSessionConfigMutation,
  UpsertSessionConfigMutationVariables
> = gql`
  ${SESSION_CONFIG_FIELDS}
  mutation upsertSessionConfig($input: SessionConfigUpsertInput!) {
    upsertSessionConfig(input: $input) {
      ...SessionConfigFields
    }
  }
`;

export const deleteSessionConfigMutationDocument: TypedDocumentNode<
  DeleteSessionConfigMutation,
  DeleteSessionConfigMutationVariables
> = gql`
  mutation deleteSessionConfig($roleName: String!) {
    deleteSessionConfig(roleName: $roleName)
  }
`;
