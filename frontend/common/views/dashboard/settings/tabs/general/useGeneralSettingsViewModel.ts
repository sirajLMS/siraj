"use client";

import { useMutation } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useCallback, useMemo, useState } from "react";
import {
  AppPermission,
  SystemSettingCategory as GraphQLSystemSettingCategory,
  SystemSettingDataType as GraphQLSystemSettingDataType,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { upsertSystemSettingMutationDocument } from "@/frontend/common/graphql/sharedDocuments/settings/general-settings.documents";
import { useSystemSettingsQuery } from "@/frontend/common/hooks/settings";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import { validateSystemSettingValue } from "@/frontend/common/views/dashboard/settings/schemas/systemSettingForm.schema";
import type {
  GeneralSettingsViewModel,
  SystemSettingRow,
  UseGeneralSettingsViewModelProps,
} from "@/frontend/common/views/dashboard/settings/types/generalSettings.types";
import { GENERAL_SETTINGS_DEFINITIONS } from "@/shared/constants/settings/generalSettings.constants";
import { SystemSettingCategory, SystemSettingDataType } from "@/shared/constants/settings/system-settings.enum";
import { Translation, useAppTranslation } from "@/shared/locale";

type DbSystemSetting = {
  readonly key: string | null;
  readonly value: string | null;
  readonly updatedByUserId: string | null;
  readonly updatedAt: string | null;
};

function mergeDefinitionsWithDbRows(dbSettings: readonly DbSystemSetting[]): readonly SystemSettingRow[] {
  const dbByCode = new Map(
    dbSettings
      .filter((setting): setting is DbSystemSetting & { key: string } => setting.key != null)
      .map(setting => [setting.key, setting] as const)
  );

  return GENERAL_SETTINGS_DEFINITIONS.map(definition => {
    const dbRow = dbByCode.get(definition.code);

    return {
      ...definition,
      value: dbRow?.value ?? definition.defaultValue,
      isFromDb: dbRow != null,
      updatedByUserId: dbRow?.updatedByUserId ?? null,
      updatedAt: dbRow?.updatedAt ?? null,
    };
  });
}

/** Convert shared SystemSettingDataType (lowercase) to GraphQL SystemSettingDataType (PascalCase). */
function toGraphQLDataType(dataType: SystemSettingDataType): GraphQLSystemSettingDataType {
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
function toGraphQLCategory(category: SystemSettingCategory): GraphQLSystemSettingCategory {
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
    default: {
      // Exhaustiveness check
      const exhaustiveCheck: never = category;
      return exhaustiveCheck;
    }
  }
}

export function useGeneralSettingsViewModel(
  _props: Readonly<UseGeneralSettingsViewModelProps>
): GeneralSettingsViewModel {
  const labels = useAppTranslation(Translation.Dashboard.SettingsGeneral);
  const notifications = useNotifications();
  const hasPermission = useUserStore(state => state.hasPermission);
  const canManage = hasPermission(AppPermission.SettingsEditGeneral);
  const [savingCode, setSavingCode] = useState<string | null>(null);

  const { data, loading, refetch } = useSystemSettingsQuery();
  const [upsertSetting] = useMutation(upsertSystemSettingMutationDocument);

  const rows = useMemo<readonly SystemSettingRow[]>(
    () => mergeDefinitionsWithDbRows(data?.systemSettings ?? []),
    [data?.systemSettings]
  );

  const onValueChange = useCallback(
    async (code: string, value: string): Promise<void> => {
      const definition = GENERAL_SETTINGS_DEFINITIONS.find(setting => setting.code === code);
      if (!definition) {
        return;
      }

      // Convert shared dataType to GraphQL dataType for validation
      const graphQLDataType = toGraphQLDataType(definition.dataType);
      const validationError = validateSystemSettingValue(graphQLDataType, value, labels);
      if (validationError) {
        notifications.show(validationError, { severity: "error" });
        return;
      }

      setSavingCode(code);
      try {
        await upsertSetting({
          variables: {
            input: {
              key: definition.code,
              value,
              dataType: graphQLDataType,
              description: definition.description,
              category: toGraphQLCategory(definition.category),
            },
          },
        });
        notifications.show(labels.saveSuccess, { severity: "success" });
        await refetch();
      } catch (error) {
        notifications.show(labels.saveError, { severity: "error" });
        logger.error("Failed to save system setting", { error, code });
      } finally {
        setSavingCode(null);
      }
    },
    [labels, notifications, refetch, upsertSetting]
  );

  return {
    rows,
    loading,
    canManage,
    labels,
    savingCode,
    onValueChange,
  };
}
