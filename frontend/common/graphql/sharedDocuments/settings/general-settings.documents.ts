import { gql, type TypedDocumentNode } from "@apollo/client";
import type {
  DeleteSystemSettingMutation,
  DeleteSystemSettingMutationVariables,
  SystemSettingQuery,
  SystemSettingQueryVariables,
  SystemSettingsQuery,
  UpsertSystemSettingMutation,
  UpsertSystemSettingMutationVariables,
} from "@/frontend/common/graphql/generated/gql/graphql";

const SYSTEM_SETTING_FIELDS = gql`
  fragment SystemSettingFields on SystemSetting {
    id
    key
    value
    dataType
    description
    category
    updatedByUserId
    updatedAt
  }
`;

export const systemSettingsQueryDocument: TypedDocumentNode<SystemSettingsQuery> = gql`
  ${SYSTEM_SETTING_FIELDS}
  query systemSettings {
    systemSettings {
      ...SystemSettingFields
    }
  }
`;

export const systemSettingQueryDocument: TypedDocumentNode<SystemSettingQuery, SystemSettingQueryVariables> = gql`
  ${SYSTEM_SETTING_FIELDS}
  query systemSetting($key: String!) {
    systemSetting(key: $key) {
      ...SystemSettingFields
    }
  }
`;

export const upsertSystemSettingMutationDocument: TypedDocumentNode<
  UpsertSystemSettingMutation,
  UpsertSystemSettingMutationVariables
> = gql`
  ${SYSTEM_SETTING_FIELDS}
  mutation upsertSystemSetting($input: SystemSettingUpsertInput!) {
    upsertSystemSetting(input: $input) {
      ...SystemSettingFields
    }
  }
`;

export const deleteSystemSettingMutationDocument: TypedDocumentNode<
  DeleteSystemSettingMutation,
  DeleteSystemSettingMutationVariables
> = gql`
  mutation deleteSystemSetting($key: String!) {
    deleteSystemSetting(key: $key)
  }
`;
