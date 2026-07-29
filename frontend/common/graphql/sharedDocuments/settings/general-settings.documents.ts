import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

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

export const systemSettingsQueryDocument: TypedDocumentNode<Operations.SystemSettingsQuery> = gql`
  ${SYSTEM_SETTING_FIELDS}
  query systemSettings {
    systemSettings {
      ...SystemSettingFields
    }
  }
`;

export const systemSettingQueryDocument: TypedDocumentNode<
  Operations.SystemSettingQuery,
  Types.QuerySystemSettingArgs
> = gql`
  ${SYSTEM_SETTING_FIELDS}
  query systemSetting($key: String!) {
    systemSetting(key: $key) {
      ...SystemSettingFields
    }
  }
`;

export const upsertSystemSettingMutationDocument: TypedDocumentNode<
  Operations.UpsertSystemSettingMutation,
  Types.MutationUpsertSystemSettingArgs
> = gql`
  ${SYSTEM_SETTING_FIELDS}
  mutation upsertSystemSetting($input: SystemSettingUpsertInput!) {
    upsertSystemSetting(input: $input) {
      ...SystemSettingFields
    }
  }
`;

export const deleteSystemSettingMutationDocument: TypedDocumentNode<
  Operations.DeleteSystemSettingMutation,
  Types.MutationDeleteSystemSettingArgs
> = gql`
  mutation deleteSystemSetting($key: String!) {
    deleteSystemSetting(key: $key)
  }
`;
