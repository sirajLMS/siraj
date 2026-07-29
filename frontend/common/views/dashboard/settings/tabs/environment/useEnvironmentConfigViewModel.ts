"use client";

import { useMutation } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { EnvConfigEntryFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import {
  deleteEnvConfigEntryMutationDocument,
  upsertEnvConfigEntryMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/settings/environment-config.documents";
import { useEnvConfigEntriesQuery } from "@/frontend/common/hooks/settings";
import { useEnvironmentConfigSettingsStore } from "@/frontend/common/stores/environmentConfigSettingsStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import type { EnvironmentConfigViewModel } from "@/frontend/common/views/dashboard/settings/types/environmentConfig.types";
import {
  getEnvConfigDisplayValue,
  isEnvConfigEntryDirty,
  isEnvConfigEntrySaving,
} from "@/frontend/common/views/dashboard/settings/utils/environmentConfig.helpers";
import {
  groupEnvConfigEntriesByCategory,
  isEnvConfigSecretEntry,
} from "@/frontend/common/views/dashboard/settings/utils/environmentConfig.utils";
import { type SettingsEnvironmentLabels, Translation, useAppLocale, useAppTranslation } from "@/shared/locale";

function buildInitialDraftValues(entries: readonly EnvConfigEntryFieldsFragment[]): Record<string, string> {
  const drafts: Record<string, string> = {};

  for (const entry of entries) {
    if (entry.key && !isEnvConfigSecretEntry(entry)) {
      drafts[entry.key] = entry.value ?? "";
    }
  }

  return drafts;
}

function useEnvironmentConfigEntries(canView: boolean, userId: string | undefined) {
  const mergeDraftValues = useEnvironmentConfigSettingsStore(state => state.mergeDraftValues);

  const { data, loading, error, refetch } = useEnvConfigEntriesQuery({
    skip: !userId || !canView,
  });

  const entries = useMemo(
    () => (data?.envConfigEntries ?? []).filter((entry): entry is EnvConfigEntryFieldsFragment => entry != null),
    [data?.envConfigEntries]
  );

  const groupedEntries = useMemo(() => groupEnvConfigEntriesByCategory(entries), [entries]);

  useEffect(() => {
    if (entries.length === 0) {
      return;
    }

    mergeDraftValues(buildInitialDraftValues(entries));
  }, [entries, mergeDraftValues]);

  return { entries, groupedEntries, loading, error, refetch };
}

function useEnvironmentConfigMutations(
  labels: SettingsEnvironmentLabels,
  draftValues: Readonly<Record<string, string>>,
  refetch: () => Promise<unknown>
) {
  const router = useRouter();
  const notifications = useNotifications();
  const setSaving = useEnvironmentConfigSettingsStore(state => state.setSaving);
  const removeDraftValue = useEnvironmentConfigSettingsStore(state => state.removeDraftValue);

  const [upsertEntry] = useMutation(upsertEnvConfigEntryMutationDocument);
  const [deleteEntry] = useMutation(deleteEnvConfigEntryMutationDocument);

  const onSave = useCallback(
    async (key: string) => {
      const value = draftValues[key] ?? "";
      setSaving(key, true);

      try {
        await upsertEntry({ variables: { input: { key, value } } });
        await refetch();
        router.refresh();
        notifications.show(labels.notifications.saveSuccess, { severity: "success" });
      } catch (saveError) {
        logger.error("Failed to save environment config override", { key, error: saveError });
        notifications.show(labels.notifications.saveError, { severity: "error" });
      } finally {
        setSaving(key, false);
      }
    },
    [
      draftValues,
      labels.notifications.saveError,
      labels.notifications.saveSuccess,
      notifications,
      refetch,
      router,
      setSaving,
      upsertEntry,
    ]
  );

  const onRevert = useCallback(
    async (key: string) => {
      setSaving(key, true);

      try {
        await deleteEntry({ variables: { key } });
        await refetch();
        removeDraftValue(key);
        router.refresh();
        notifications.show(labels.notifications.revertSuccess, { severity: "success" });
      } catch (revertError) {
        logger.error("Failed to revert environment config override", { key, error: revertError });
        notifications.show(labels.notifications.revertError, { severity: "error" });
      } finally {
        setSaving(key, false);
      }
    },
    [
      deleteEntry,
      labels.notifications.revertError,
      labels.notifications.revertSuccess,
      notifications,
      refetch,
      removeDraftValue,
      router,
      setSaving,
    ]
  );

  return { onSave, onRevert };
}

export function useEnvironmentConfigViewModel(): EnvironmentConfigViewModel {
  const labels = useAppTranslation(Translation.Dashboard.SettingsEnvironment);
  const locale = useAppLocale();
  const hasPermission = useUserStore(state => state.hasPermission);
  const userId = useUserStore(state => state.user?.id);
  const canEdit = hasPermission(AppPermission.SettingsEditEnv);
  const canView = hasPermission(AppPermission.SettingsView) || hasPermission(AppPermission.SettingsEditEnv);

  const draftValues = useEnvironmentConfigSettingsStore(state => state.draftValues);
  const savingKeys = useEnvironmentConfigSettingsStore(state => state.savingKeys);
  const expandedCategories = useEnvironmentConfigSettingsStore(state => state.expandedCategories);
  const setDraftValue = useEnvironmentConfigSettingsStore(state => state.setDraftValue);
  const setCategoryExpanded = useEnvironmentConfigSettingsStore(state => state.setCategoryExpanded);

  const { groupedEntries, loading, error, refetch } = useEnvironmentConfigEntries(canView, userId ?? undefined);
  const { onSave, onRevert } = useEnvironmentConfigMutations(labels, draftValues, refetch);

  const onDraftChange = useCallback(
    (key: string, value: string) => {
      setDraftValue(key, value);
    },
    [setDraftValue]
  );

  const getDisplayValue = useCallback(
    (entry: EnvConfigEntryFieldsFragment) => getEnvConfigDisplayValue(entry, draftValues),
    [draftValues]
  );

  const isEntryDirty = useCallback(
    (entry: EnvConfigEntryFieldsFragment) => isEnvConfigEntryDirty(entry, draftValues),
    [draftValues]
  );

  const isEntrySaving = useCallback((key: string) => isEnvConfigEntrySaving(key, savingKeys), [savingKeys]);

  const isCategoryExpanded = useCallback(
    (category: string) => expandedCategories[category] ?? true,
    [expandedCategories]
  );

  const onCategoryExpandedChange = useCallback(
    (category: string, expanded: boolean) => {
      setCategoryExpanded(category, expanded);
    },
    [setCategoryExpanded]
  );

  return {
    labels,
    locale,
    loading,
    error: error ?? undefined,
    groupedEntries,
    canEdit,
    draftValues,
    savingKeys,
    onDraftChange,
    onSave,
    onRevert,
    getDisplayValue,
    isEntryDirty,
    isEntrySaving,
    isCategoryExpanded,
    onCategoryExpandedChange,
  };
}
