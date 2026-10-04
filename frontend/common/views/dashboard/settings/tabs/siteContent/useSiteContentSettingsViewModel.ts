"use client";

import { useMemo } from "react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { useSiteContentEntriesQuery } from "@/frontend/common/hooks/settings";
import { useSiteContentSettingsStore } from "@/frontend/common/stores/siteContentSettingsStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { buildSiteContentRows } from "@/frontend/common/views/dashboard/settings/tabs/siteContent/useSiteContentSettingsViewModel.helpers";
import { useSiteContentRowActions } from "@/frontend/common/views/dashboard/settings/tabs/siteContent/useSiteContentSettingsViewModel.hooks";
import type {
  SiteContentSettingsViewModel,
  UseSiteContentSettingsViewModelProps,
} from "@/frontend/common/views/dashboard/settings/types/siteContentSettings.types";
import { Translation, useAppTranslation } from "@/shared/locale";

export function useSiteContentSettingsViewModel(
  _props: Readonly<UseSiteContentSettingsViewModelProps>
): SiteContentSettingsViewModel {
  const labels = useAppTranslation(Translation.Dashboard.SettingsSiteContent);
  const hasPermission = useUserStore(state => state.hasPermission);
  const canManage = hasPermission(AppPermission.SettingsSiteContentManage);

  const formOpen = useSiteContentSettingsStore(state => state.formOpen);
  const editRow = useSiteContentSettingsStore(state => state.editRow);
  const deleteRow = useSiteContentSettingsStore(state => state.deleteRow);
  const togglingPublishId = useSiteContentSettingsStore(state => state.togglingPublishId);
  const openCreateForm = useSiteContentSettingsStore(state => state.openCreateForm);
  const openEditForm = useSiteContentSettingsStore(state => state.openEditForm);
  const closeForm = useSiteContentSettingsStore(state => state.closeForm);
  const openDeleteDialog = useSiteContentSettingsStore(state => state.openDeleteDialog);
  const closeDeleteDialog = useSiteContentSettingsStore(state => state.closeDeleteDialog);
  const setTogglingPublishId = useSiteContentSettingsStore(state => state.setTogglingPublishId);

  const { data, loading, refetch } = useSiteContentEntriesQuery();

  const rows = useMemo(() => buildSiteContentRows(data?.siteContentEntries), [data?.siteContentEntries]);

  const { isDeleting, onSaved, onConfirmDelete, onTogglePublish } = useSiteContentRowActions({
    labels,
    deleteRow,
    closeForm,
    closeDeleteDialog,
    setTogglingPublishId,
    refetch,
  });

  return {
    rows,
    loading,
    canManage,
    labels,
    formOpen,
    editRow,
    deleteRow,
    isDeleting,
    togglingPublishId,
    onAdd: openCreateForm,
    onEdit: openEditForm,
    onDelete: openDeleteDialog,
    onFormClose: closeForm,
    onDeleteClose: closeDeleteDialog,
    onSaved,
    onConfirmDelete,
    onTogglePublish,
  };
}
