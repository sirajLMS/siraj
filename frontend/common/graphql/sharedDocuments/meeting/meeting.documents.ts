import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

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
      supportsAutoGeneration
      supportsUsername
      supportsPassword
      supportsTenantId
    }
    providerKind
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
    oauthTokenExpiresAt
    details {
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

const CLASS_MEETING_CONFIG_FIELDS = gql`
  fragment ClassMeetingConfigFields on ClassMeetingConfig {
    id
    classInstanceId
    recurringScheduleId
    providerId
    label
    isDefault
    hasSecret
    details {
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

const EFFECTIVE_MEETING_FIELDS = gql`
  fragment EffectiveMeetingFields on EffectiveMeeting {
    id
    joinUrl
    providerSlug
    providerName
    logoUrl
    meetingId
    source
    configId
    providerId
    supportsAutoGeneration
  }
`;

export const classMeetingConfigsQueryDocument: TypedDocumentNode<
  Operations.ClassMeetingConfigsQuery,
  Operations.ClassMeetingConfigsQueryVariables
> = gql`
  ${CLASS_MEETING_CONFIG_FIELDS}
  query classMeetingConfigs($classInstanceId: ID!) {
    classMeetingConfigs(classInstanceId: $classInstanceId) {
      ...ClassMeetingConfigFields
    }
  }
`;

export const classMeetingConfigsWithStatusQueryDocument: TypedDocumentNode<
  Operations.ClassMeetingConfigsWithStatusQuery,
  Types.QueryClassMeetingConfigsArgs
> = gql`
  query classMeetingConfigsWithStatus($classInstanceId: ID!) {
    classMeetingConfigs(classInstanceId: $classInstanceId) {
      id
      classInstanceId
      recurringScheduleId
      providerId
      label
      isDefault
      hasSecret
      details {
        meetingUrl
        username
        tenantId
      }
      providerMetadata
      meetingUrlStatus
      meetingUrlExpiresAt
      meetingUrlError
      provider {
        id
        slug
        name
        providerKind
        isActive
        fieldSchema {
          requiresMeetingUrl
          supportsAutoGeneration
          supportsUsername
          supportsPassword
          supportsTenantId
        }
      }
      createdAt
      updatedAt
    }
  }
`;

export const recurringMeetingConfigsQueryDocument: TypedDocumentNode<
  Operations.RecurringMeetingConfigsQuery,
  Operations.RecurringMeetingConfigsQueryVariables
> = gql`
  ${CLASS_MEETING_CONFIG_FIELDS}
  query recurringMeetingConfigs($recurringScheduleId: ID!) {
    recurringMeetingConfigs(recurringScheduleId: $recurringScheduleId) {
      ...ClassMeetingConfigFields
    }
  }
`;

export const createClassMeetingConfigMutationDocument: TypedDocumentNode<
  Operations.CreateClassMeetingConfigMutation,
  Operations.CreateClassMeetingConfigMutationVariables
> = gql`
  ${CLASS_MEETING_CONFIG_FIELDS}
  mutation createClassMeetingConfig($input: ClassMeetingConfigCreateInput!) {
    createClassMeetingConfig(input: $input) {
      ...ClassMeetingConfigFields
    }
  }
`;

export const updateClassMeetingConfigMutationDocument: TypedDocumentNode<
  Operations.UpdateClassMeetingConfigMutation,
  Operations.UpdateClassMeetingConfigMutationVariables
> = gql`
  ${CLASS_MEETING_CONFIG_FIELDS}
  mutation updateClassMeetingConfig($id: ID!, $input: ClassMeetingConfigUpdateInput!) {
    updateClassMeetingConfig(id: $id, input: $input) {
      ...ClassMeetingConfigFields
    }
  }
`;

export const deleteClassMeetingConfigMutationDocument: TypedDocumentNode<
  Operations.DeleteClassMeetingConfigMutation,
  Operations.DeleteClassMeetingConfigMutationVariables
> = gql`
  mutation deleteClassMeetingConfig($id: ID!) {
    deleteClassMeetingConfig(id: $id)
  }
`;

export const setDefaultClassMeetingConfigMutationDocument: TypedDocumentNode<
  Operations.SetDefaultClassMeetingConfigMutation,
  Operations.SetDefaultClassMeetingConfigMutationVariables
> = gql`
  ${CLASS_MEETING_CONFIG_FIELDS}
  mutation setDefaultClassMeetingConfig($id: ID!) {
    setDefaultClassMeetingConfig(id: $id) {
      ...ClassMeetingConfigFields
    }
  }
`;

export const generateMeetingUrlMutationDocument: TypedDocumentNode<
  Operations.GenerateMeetingUrlMutation,
  Types.MutationGenerateMeetingUrlArgs
> = gql`
  mutation generateMeetingUrl($input: GenerateMeetingUrlInput!) {
    generateMeetingUrl(input: $input) {
      joinUrl
      meetingId
      expiresAt
    }
  }
`;

export const connectMeetingProviderOAuthMutationDocument: TypedDocumentNode<
  Operations.ConnectMeetingProviderOAuthMutation,
  Types.MutationConnectMeetingProviderOAuthArgs
> = gql`
  mutation connectMeetingProviderOAuth($input: ConnectMeetingProviderOAuthInput!) {
    connectMeetingProviderOAuth(input: $input) {
      id
      authorizeUrl
      state
    }
  }
`;

export const disconnectMeetingProviderOAuthMutationDocument: TypedDocumentNode<
  Operations.DisconnectMeetingProviderOAuthMutation,
  Types.MutationDisconnectMeetingProviderOAuthArgs
> = gql`
  mutation disconnectMeetingProviderOAuth($input: DisconnectMeetingProviderOAuthInput!) {
    disconnectMeetingProviderOAuth(input: $input) {
      id
      ok
      providerSlug
    }
  }
`;

export const myConnectedMeetingProvidersQueryDocument: TypedDocumentNode<Operations.MyConnectedMeetingProvidersQuery> = gql`
  query myConnectedMeetingProviders {
    myConnectedMeetingProviders {
      id
      providerSlug
      email
      connectedAt
      expiresAt
    }
  }
`;

export { EFFECTIVE_MEETING_FIELDS };
