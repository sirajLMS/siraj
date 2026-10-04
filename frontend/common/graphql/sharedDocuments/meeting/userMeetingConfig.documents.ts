import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  CreateUserMeetingConfigMutation,
  CreateUserMeetingConfigMutationVariables,
  DeleteUserMeetingConfigMutation,
  DeleteUserMeetingConfigMutationVariables,
  SetDefaultMeetingConfigMutation,
  SetDefaultMeetingConfigMutationVariables,
  UpdateUserMeetingConfigMutation,
  UpdateUserMeetingConfigMutationVariables,
  UserMeetingConfigQuery,
  UserMeetingConfigQueryVariables,
  UserMeetingConfigsQuery,
  UserMeetingConfigsQueryVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { MEETING_PROVIDER_FIELDS } from "@/frontend/common/graphql/sharedDocuments/meeting/meetingFragments.documents";

const USER_MEETING_CONFIG_FIELDS = gql`
  fragment UserMeetingConfigFields on UserMeetingConfig {
    id
    userId
    providerId
    label
    isDefault
    hasSecret
    oauthTokenExpiresAt
    details {
      id
      meetingUrl
      username
      tenantId
    }
    providerMetadata
    provider {
      ...MeetingProviderFields
    }
    createdAt
    updatedAt
  }
  ${MEETING_PROVIDER_FIELDS}
`;

export const userMeetingConfigsQueryDocument: TypedDocumentNode<
  UserMeetingConfigsQuery,
  UserMeetingConfigsQueryVariables
> = gql`
  ${USER_MEETING_CONFIG_FIELDS}
  query userMeetingConfigs($userId: ID!) {
    userMeetingConfigs(userId: $userId) {
      ...UserMeetingConfigFields
    }
  }
`;

export const userMeetingConfigQueryDocument: TypedDocumentNode<
  UserMeetingConfigQuery,
  UserMeetingConfigQueryVariables
> = gql`
  ${USER_MEETING_CONFIG_FIELDS}
  query userMeetingConfig($id: ID!) {
    userMeetingConfig(id: $id) {
      ...UserMeetingConfigFields
    }
  }
`;

export const createUserMeetingConfigMutationDocument: TypedDocumentNode<
  CreateUserMeetingConfigMutation,
  CreateUserMeetingConfigMutationVariables
> = gql`
  ${USER_MEETING_CONFIG_FIELDS}
  mutation createUserMeetingConfig($input: UserMeetingConfigCreateInput!) {
    createUserMeetingConfig(input: $input) {
      ...UserMeetingConfigFields
    }
  }
`;

export const updateUserMeetingConfigMutationDocument: TypedDocumentNode<
  UpdateUserMeetingConfigMutation,
  UpdateUserMeetingConfigMutationVariables
> = gql`
  ${USER_MEETING_CONFIG_FIELDS}
  mutation updateUserMeetingConfig($id: ID!, $input: UserMeetingConfigUpdateInput!) {
    updateUserMeetingConfig(id: $id, input: $input) {
      ...UserMeetingConfigFields
    }
  }
`;

export const deleteUserMeetingConfigMutationDocument: TypedDocumentNode<
  DeleteUserMeetingConfigMutation,
  DeleteUserMeetingConfigMutationVariables
> = gql`
  mutation deleteUserMeetingConfig($id: ID!) {
    deleteUserMeetingConfig(id: $id)
  }
`;

export const setDefaultMeetingConfigMutationDocument: TypedDocumentNode<
  SetDefaultMeetingConfigMutation,
  SetDefaultMeetingConfigMutationVariables
> = gql`
  ${USER_MEETING_CONFIG_FIELDS}
  mutation setDefaultMeetingConfig($id: ID!) {
    setDefaultMeetingConfig(id: $id) {
      ...UserMeetingConfigFields
    }
  }
`;
