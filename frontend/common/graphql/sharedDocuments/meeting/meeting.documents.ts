import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  ClassMeetingConfigsQuery,
  ClassMeetingConfigsQueryVariables,
  ClassMeetingConfigsWithStatusQuery,
  ConnectMeetingProviderOAuthMutation,
  ConnectMeetingProviderOAuthMutationVariables,
  CreateClassMeetingConfigMutation,
  CreateClassMeetingConfigMutationVariables,
  CreateMeetingProviderMutation,
  CreateMeetingProviderMutationVariables,
  CreateUserMeetingConfigMutation,
  CreateUserMeetingConfigMutationVariables,
  DeleteClassMeetingConfigMutation,
  DeleteClassMeetingConfigMutationVariables,
  DeleteMeetingProviderMutation,
  DeleteMeetingProviderMutationVariables,
  DeleteUserMeetingConfigMutation,
  DeleteUserMeetingConfigMutationVariables,
  DisconnectMeetingProviderOAuthMutation,
  DisconnectMeetingProviderOAuthMutationVariables,
  GenerateMeetingUrlMutation,
  GenerateMeetingUrlMutationVariables,
  MeetingProviderQuery,
  MeetingProviderQueryVariables,
  MeetingProvidersQuery,
  MeetingProvidersQueryVariables,
  MyConnectedMeetingProvidersQuery,
  RecurringMeetingConfigsQuery,
  RecurringMeetingConfigsQueryVariables,
  SetDefaultClassMeetingConfigMutation,
  SetDefaultClassMeetingConfigMutationVariables,
  SetDefaultMeetingConfigMutation,
  SetDefaultMeetingConfigMutationVariables,
  UpdateClassMeetingConfigMutation,
  UpdateClassMeetingConfigMutationVariables,
  UpdateMeetingProviderMutation,
  UpdateMeetingProviderMutationVariables,
  UpdateUserMeetingConfigMutation,
  UpdateUserMeetingConfigMutationVariables,
  UserMeetingConfigQuery,
  UserMeetingConfigQueryVariables,
  UserMeetingConfigsQuery,
  UserMeetingConfigsQueryVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

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

export const meetingProvidersQueryDocument: TypedDocumentNode<MeetingProvidersQuery, MeetingProvidersQueryVariables> =
  gql`
  ${MEETING_PROVIDER_FIELDS}
  query meetingProviders($activeOnly: Boolean) {
    meetingProviders(activeOnly: $activeOnly) {
      ...MeetingProviderFields
    }
  }
`;

export const meetingProviderQueryDocument: TypedDocumentNode<MeetingProviderQuery, MeetingProviderQueryVariables> = gql`
  ${MEETING_PROVIDER_FIELDS}
  query meetingProvider($id: ID!) {
    meetingProvider(id: $id) {
      ...MeetingProviderFields
    }
  }
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

export const createMeetingProviderMutationDocument: TypedDocumentNode<
  CreateMeetingProviderMutation,
  CreateMeetingProviderMutationVariables
> = gql`
  ${MEETING_PROVIDER_FIELDS}
  mutation createMeetingProvider($input: MeetingProviderCreateInput!) {
    createMeetingProvider(input: $input) {
      ...MeetingProviderFields
    }
  }
`;

export const updateMeetingProviderMutationDocument: TypedDocumentNode<
  UpdateMeetingProviderMutation,
  UpdateMeetingProviderMutationVariables
> = gql`
  ${MEETING_PROVIDER_FIELDS}
  mutation updateMeetingProvider($id: ID!, $input: MeetingProviderUpdateInput!) {
    updateMeetingProvider(id: $id, input: $input) {
      ...MeetingProviderFields
    }
  }
`;

export const deleteMeetingProviderMutationDocument: TypedDocumentNode<
  DeleteMeetingProviderMutation,
  DeleteMeetingProviderMutationVariables
> = gql`
  mutation deleteMeetingProvider($id: ID!) {
    deleteMeetingProvider(id: $id)
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
  ClassMeetingConfigsQuery,
  ClassMeetingConfigsQueryVariables
> = gql`
  ${CLASS_MEETING_CONFIG_FIELDS}
  query classMeetingConfigs($classInstanceId: ID!) {
    classMeetingConfigs(classInstanceId: $classInstanceId) {
      ...ClassMeetingConfigFields
    }
  }
`;

export const classMeetingConfigsWithStatusQueryDocument: TypedDocumentNode<
  ClassMeetingConfigsWithStatusQuery,
  ClassMeetingConfigsQueryVariables
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
        id
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
  RecurringMeetingConfigsQuery,
  RecurringMeetingConfigsQueryVariables
> = gql`
  ${CLASS_MEETING_CONFIG_FIELDS}
  query recurringMeetingConfigs($recurringScheduleId: ID!) {
    recurringMeetingConfigs(recurringScheduleId: $recurringScheduleId) {
      ...ClassMeetingConfigFields
    }
  }
`;

export const createClassMeetingConfigMutationDocument: TypedDocumentNode<
  CreateClassMeetingConfigMutation,
  CreateClassMeetingConfigMutationVariables
> = gql`
  ${CLASS_MEETING_CONFIG_FIELDS}
  mutation createClassMeetingConfig($input: ClassMeetingConfigCreateInput!) {
    createClassMeetingConfig(input: $input) {
      ...ClassMeetingConfigFields
    }
  }
`;

export const updateClassMeetingConfigMutationDocument: TypedDocumentNode<
  UpdateClassMeetingConfigMutation,
  UpdateClassMeetingConfigMutationVariables
> = gql`
  ${CLASS_MEETING_CONFIG_FIELDS}
  mutation updateClassMeetingConfig($id: ID!, $input: ClassMeetingConfigUpdateInput!) {
    updateClassMeetingConfig(id: $id, input: $input) {
      ...ClassMeetingConfigFields
    }
  }
`;

export const deleteClassMeetingConfigMutationDocument: TypedDocumentNode<
  DeleteClassMeetingConfigMutation,
  DeleteClassMeetingConfigMutationVariables
> = gql`
  mutation deleteClassMeetingConfig($id: ID!) {
    deleteClassMeetingConfig(id: $id)
  }
`;

export const setDefaultClassMeetingConfigMutationDocument: TypedDocumentNode<
  SetDefaultClassMeetingConfigMutation,
  SetDefaultClassMeetingConfigMutationVariables
> = gql`
  ${CLASS_MEETING_CONFIG_FIELDS}
  mutation setDefaultClassMeetingConfig($id: ID!) {
    setDefaultClassMeetingConfig(id: $id) {
      ...ClassMeetingConfigFields
    }
  }
`;

export const generateMeetingUrlMutationDocument: TypedDocumentNode<
  GenerateMeetingUrlMutation,
  GenerateMeetingUrlMutationVariables
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
  ConnectMeetingProviderOAuthMutation,
  ConnectMeetingProviderOAuthMutationVariables
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
  DisconnectMeetingProviderOAuthMutation,
  DisconnectMeetingProviderOAuthMutationVariables
> = gql`
  mutation disconnectMeetingProviderOAuth($input: DisconnectMeetingProviderOAuthInput!) {
    disconnectMeetingProviderOAuth(input: $input) {
      id
      ok
      providerSlug
    }
  }
`;

export const myConnectedMeetingProvidersQueryDocument: TypedDocumentNode<MyConnectedMeetingProvidersQuery> = gql`
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
