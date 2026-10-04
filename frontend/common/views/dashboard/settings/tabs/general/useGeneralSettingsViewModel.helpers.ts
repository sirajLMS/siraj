import {
  SystemSettingCategory as GraphQLSystemSettingCategory,
  SystemSettingDataType as GraphQLSystemSettingDataType,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { SystemSettingRow } from "@/frontend/common/views/dashboard/settings/types/generalSettings.types";
import { GENERAL_SETTINGS_DEFINITIONS } from "@/shared/constants/settings/generalSettings.constants";
import { SystemSettingCategory, SystemSettingDataType } from "@/shared/constants/settings/system-settings.enum";

type DbSystemSetting = {
  readonly key: string | null;
  readonly value: string | null;
  readonly updatedByUserId: string | null;
  readonly updatedAt: string | null;
};

export function mergeDefinitionsWithDbRows(dbSettings: readonly DbSystemSetting[]): readonly SystemSettingRow[] {
  const dbByCode = new Map(
    dbSettings
      .filter((setting): setting is DbSystemSetting & { key: string } => setting.key != null)
      .map(setting => [setting.key, setting] as const)
  );

  return GENERAL_SETTINGS_DEFINITIONS.map(definition => {
    const dbRow = dbByCode.get(definition.code);

    return Object.assign({}, definition, {
      value: dbRow?.value ?? definition.defaultValue,
      isFromDb: dbRow != null,
      updatedByUserId: dbRow?.updatedByUserId ?? null,
      updatedAt: dbRow?.updatedAt ?? null,
    });
  });
}

/** Convert shared SystemSettingDataType (lowercase) to GraphQL SystemSettingDataType (PascalCase). */
export function toGraphQLDataType(dataType: SystemSettingDataType): GraphQLSystemSettingDataType {
  switch (dataType) {
    case SystemSettingDataType.String:
      return GraphQLSystemSettingDataType.String;
    case SystemSettingDataType.Integer:
      return GraphQLSystemSettingDataType.Integer;
    case SystemSettingDataType.Boolean:
      return GraphQLSystemSettingDataType.Boolean;
    case SystemSettingDataType.Json:
      return GraphQLSystemSettingDataType.Json;
    default: {
      // Exhaustiveness check
      const exhaustiveCheck: never = dataType;
      return exhaustiveCheck;
    }
  }
}

/** Convert shared SystemSettingCategory (lowercase) to GraphQL SystemSettingCategory (PascalCase). */
export function toGraphQLCategory(category: SystemSettingCategory): GraphQLSystemSettingCategory {
  switch (category) {
    case SystemSettingCategory.Security:
      return GraphQLSystemSettingCategory.Security;
    case SystemSettingCategory.System:
      return GraphQLSystemSettingCategory.System;
    case SystemSettingCategory.Scheduling:
      return GraphQLSystemSettingCategory.Scheduling;
    case SystemSettingCategory.Communication:
      return GraphQLSystemSettingCategory.Communication;
    case SystemSettingCategory.Email:
      return GraphQLSystemSettingCategory.Email;
    case SystemSettingCategory.Sms:
      return GraphQLSystemSettingCategory.Sms;
    case SystemSettingCategory.Push:
      return GraphQLSystemSettingCategory.Push;
    case SystemSettingCategory.Fx:
      return GraphQLSystemSettingCategory.Fx;
    case SystemSettingCategory.Cache:
      return GraphQLSystemSettingCategory.Cache;
    case SystemSettingCategory.Redis:
      return GraphQLSystemSettingCategory.Redis;
    case SystemSettingCategory.Storage:
      return GraphQLSystemSettingCategory.Storage;
    case SystemSettingCategory.Auth:
      return GraphQLSystemSettingCategory.Auth;
    case SystemSettingCategory.App:
      return GraphQLSystemSettingCategory.App;
    case SystemSettingCategory.Meeting:
      return GraphQLSystemSettingCategory.Meeting;
    case SystemSettingCategory.Billing:
      return GraphQLSystemSettingCategory.Billing;
    case SystemSettingCategory.General:
      return GraphQLSystemSettingCategory.General;
    case SystemSettingCategory.Payroll:
      return GraphQLSystemSettingCategory.Payroll;
    default: {
      // Exhaustiveness check
      const exhaustiveCheck: never = category;
      return exhaustiveCheck;
    }
  }
}
