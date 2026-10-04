"use client";

import { useCallback } from "react";
import { AppPermission, type EnvConfigEntryFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import { useEnvironmentConfigSettingsStore } from "@/frontend/common/stores/environmentConfigSettingsStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import {
  useEnvironmentConfigEntries,
  useEnvironmentConfigMutations,
} from "@/frontend/common/views/dashboard/settings/tabs/environment/useEnvironmentConfigViewModel.hooks";
import type { EnvironmentConfigViewModel } from "@/frontend/common/views/dashboard/settings/types/environmentConfig.types";
import {
  getEnvConfigDisplayValue,
  isEnvConfigEntryDirty,
  isEnvConfigEntrySaving,
} from "@/frontend/common/views/dashboard/settings/utils/environmentConfig.helpers";
import { Translation, useAppLocale, useAppTranslation } from "@/shared/locale";

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
