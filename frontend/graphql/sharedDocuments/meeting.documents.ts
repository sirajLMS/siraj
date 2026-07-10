import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

const MEETING_PROVIDER_FIELDS = gql`
  fragment MeetingProviderFields on MeetingProvider {
    id
    slug
    name
    description
    instructions
    urlAllowlist
    urlExample
    logoUrl
    fieldSchema {
      requiresMeetingUrl
      supportsUsername
      supportsPassword
      supportsTenantId
    }
    isActive
    createdAt
    updatedAt
  }
`;

const USER_MEETING_CONFIG_FIELDS = gql`
  fragment UserMeetingConfigFields on UserMeetingConfig {
    id
    userId
    providerId
    label
    isDefault
    hasSecret
    details {
      meetingUrl
      username
      tenantId
    }
    provider {
      ...MeetingProviderFields
    }
    createdAt
    updatedAt
  }
  ${MEETING_PROVIDER_FIELDS}
`;

export const meetingProvidersQueryDocument: TypedDocumentNode<
  Operations.MeetingProvidersQuery,
  Types.QueryMeetingProvidersArgs
> = gql`
  ${MEETING_PROVIDER_FIELDS}
  query meetingProviders($activeOnly: Boolean) {
    meetingProviders(activeOnly: $activeOnly) {
      ...MeetingProviderFields
    }
  }
`;

export const meetingProviderQueryDocument: TypedDocumentNode<
  Operations.MeetingProviderQuery,
  Types.QueryMeetingProviderArgs
> = gql`
  ${MEETING_PROVIDER_FIELDS}
  query meetingProvider($id: ID!) {
    meetingProvider(id: $id) {
      ...MeetingProviderFields
    }
  }
`;

export const userMeetingConfigsQueryDocument: TypedDocumentNode<
  Operations.UserMeetingConfigsQuery,
  Types.QueryUserMeetingConfigsArgs
> = gql`
  ${USER_MEETING_CONFIG_FIELDS}
  query userMeetingConfigs($userId: ID!) {
    userMeetingConfigs(userId: $userId) {
      ...UserMeetingConfigFields
    }
  }
`;

export const userMeetingConfigQueryDocument: TypedDocumentNode<
  Operations.UserMeetingConfigQuery,
  Types.QueryUserMeetingConfigArgs
> = gql`
  ${USER_MEETING_CONFIG_FIELDS}
  query userMeetingConfig($id: ID!) {
    userMeetingConfig(id: $id) {
      ...UserMeetingConfigFields
    }
  }
`;

export const createMeetingProviderMutationDocument: TypedDocumentNode<
  Operations.CreateMeetingProviderMutation,
  Types.MutationCreateMeetingProviderArgs
> = gql`
  ${MEETING_PROVIDER_FIELDS}
  mutation createMeetingProvider($input: MeetingProviderCreateInput!) {
    createMeetingProvider(input: $input) {
      ...MeetingProviderFields
    }
  }
`;

export const updateMeetingProviderMutationDocument: TypedDocumentNode<
  Operations.UpdateMeetingProviderMutation,
  Types.MutationUpdateMeetingProviderArgs
> = gql`
  ${MEETING_PROVIDER_FIELDS}
  mutation updateMeetingProvider($id: ID!, $input: MeetingProviderUpdateInput!) {
    updateMeetingProvider(id: $id, input: $input) {
      ...MeetingProviderFields
    }
  }
`;

export const deleteMeetingProviderMutationDocument: TypedDocumentNode<
  Operations.DeleteMeetingProviderMutation,
  Types.MutationDeleteMeetingProviderArgs
> = gql`
  mutation deleteMeetingProvider($id: ID!) {
    deleteMeetingProvider(id: $id)
  }
`;

export const createUserMeetingConfigMutationDocument: TypedDocumentNode<
  Operations.CreateUserMeetingConfigMutation,
  Types.MutationCreateUserMeetingConfigArgs
> = gql`
  ${USER_MEETING_CONFIG_FIELDS}
  mutation createUserMeetingConfig($input: UserMeetingConfigCreateInput!) {
    createUserMeetingConfig(input: $input) {
      ...UserMeetingConfigFields
    }
  }
`;

export const updateUserMeetingConfigMutationDocument: TypedDocumentNode<
  Operations.UpdateUserMeetingConfigMutation,
  Types.MutationUpdateUserMeetingConfigArgs
> = gql`
  ${USER_MEETING_CONFIG_FIELDS}
  mutation updateUserMeetingConfig($id: ID!, $input: UserMeetingConfigUpdateInput!) {
    updateUserMeetingConfig(id: $id, input: $input) {
      ...UserMeetingConfigFields
    }
  }
`;

export const deleteUserMeetingConfigMutationDocument: TypedDocumentNode<
  Operations.DeleteUserMeetingConfigMutation,
  Types.MutationDeleteUserMeetingConfigArgs
> = gql`
  mutation deleteUserMeetingConfig($id: ID!) {
    deleteUserMeetingConfig(id: $id)
  }
`;

export const setDefaultMeetingConfigMutationDocument: TypedDocumentNode<
  Operations.SetDefaultMeetingConfigMutation,
  Types.MutationSetDefaultMeetingConfigArgs
> = gql`
  ${USER_MEETING_CONFIG_FIELDS}
  mutation setDefaultMeetingConfig($id: ID!) {
    setDefaultMeetingConfig(id: $id) {
      ...UserMeetingConfigFields
    }
  }
`;
