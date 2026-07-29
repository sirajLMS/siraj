"use client";

import { useMutation } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useCallback, useMemo, useState } from "react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
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

      const validationError = validateSystemSettingValue(definition.dataType, value, labels);
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
              dataType: definition.dataType,
              description: definition.description,
              category: definition.category,
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
