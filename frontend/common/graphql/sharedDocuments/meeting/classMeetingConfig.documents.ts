import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  ClassMeetingConfigsQuery,
  ClassMeetingConfigsQueryVariables,
  ClassMeetingConfigsWithStatusQuery,
  CreateClassMeetingConfigMutation,
  CreateClassMeetingConfigMutationVariables,
  DeleteClassMeetingConfigMutation,
  DeleteClassMeetingConfigMutationVariables,
  RecurringMeetingConfigsQuery,
  RecurringMeetingConfigsQueryVariables,
  SetDefaultClassMeetingConfigMutation,
  SetDefaultClassMeetingConfigMutationVariables,
  UpdateClassMeetingConfigMutation,
  UpdateClassMeetingConfigMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { MEETING_PROVIDER_FIELDS } from "@/frontend/common/graphql/sharedDocuments/meeting/meetingFragments.documents";

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
