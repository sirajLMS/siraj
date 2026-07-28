import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

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

export const sessionConfigsQueryDocument: TypedDocumentNode<Operations.SessionConfigsQuery> = gql`
  ${SESSION_CONFIG_FIELDS}
  query sessionConfigs {
    sessionConfigs {
      ...SessionConfigFields
    }
  }
`;

export const sessionConfigQueryDocument: TypedDocumentNode<
  Operations.SessionConfigQuery,
  Types.QuerySessionConfigArgs
> = gql`
  ${SESSION_CONFIG_FIELDS}
  query sessionConfig($roleName: String!) {
    sessionConfig(roleName: $roleName) {
      ...SessionConfigFields
    }
  }
`;

export const upsertSessionConfigMutationDocument: TypedDocumentNode<
  Operations.UpsertSessionConfigMutation,
  Types.MutationUpsertSessionConfigArgs
> = gql`
  ${SESSION_CONFIG_FIELDS}
  mutation upsertSessionConfig($input: SessionConfigUpsertInput!) {
    upsertSessionConfig(input: $input) {
      ...SessionConfigFields
    }
  }
`;

export const deleteSessionConfigMutationDocument: TypedDocumentNode<
  Operations.DeleteSessionConfigMutation,
  Types.MutationDeleteSessionConfigArgs
> = gql`
  mutation deleteSessionConfig($roleName: String!) {
    deleteSessionConfig(roleName: $roleName)
  }
`;
