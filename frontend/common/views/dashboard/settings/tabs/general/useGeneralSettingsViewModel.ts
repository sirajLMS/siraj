"use client";

import { useMutation } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useMemo } from "react";
import {
  AppPermission,
  SystemSettingCategory,
  SystemSettingDataType,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { deleteSystemSettingMutationDocument } from "@/frontend/common/graphql/sharedDocuments/settings/general-settings.documents";
import { useSystemSettingsQuery } from "@/frontend/common/hooks/settings";
import { useGeneralSettingsStore } from "@/frontend/common/stores/generalSettingsStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import type {
  GeneralSettingsViewModel,
  SystemSettingRow,
  UseGeneralSettingsViewModelProps,
} from "@/frontend/common/views/dashboard/settings/types/generalSettings.types";
import { Translation, useAppTranslation } from "@/shared/locale";

function toSystemSettingRow(
  setting: {
    readonly id: string | null;
    readonly key: string | null;
    readonly value: string | null;
    readonly dataType: SystemSettingDataType | null;
    readonly description: string | null;
    readonly category: SystemSettingCategory | null;
    readonly updatedByUserId: string | null;
    readonly updatedAt: string | null;
  },
  index: number
): SystemSettingRow | null {
  if (!setting.key) {
    return null;
  }

  return {
    id: setting.id ?? `${setting.key}-${index}`,
    key: setting.key,
    value: setting.value ?? "",
    dataType: setting.dataType ?? SystemSettingDataType.String,
    description: setting.description ?? "",
    category: setting.category ?? SystemSettingCategory.System,
    updatedByUserId: setting.updatedByUserId,
    updatedAt: setting.updatedAt,
  };
}

export function useGeneralSettingsViewModel(
  _props: Readonly<UseGeneralSettingsViewModelProps>
): GeneralSettingsViewModel {
  const labels = useAppTranslation(Translation.Dashboard.SettingsGeneral);
  const notifications = useNotifications();
  const hasPermission = useUserStore(state => state.hasPermission);
  const canManage = hasPermission(AppPermission.SettingsEditGeneral);

  const formOpen = useGeneralSettingsStore(state => state.formOpen);
  const editRow = useGeneralSettingsStore(state => state.editRow);
  const deleteRow = useGeneralSettingsStore(state => state.deleteRow);
  const openCreateForm = useGeneralSettingsStore(state => state.openCreateForm);
  const openEditForm = useGeneralSettingsStore(state => state.openEditForm);
  const closeForm = useGeneralSettingsStore(state => state.closeForm);
  const openDeleteDialog = useGeneralSettingsStore(state => state.openDeleteDialog);
  const closeDeleteDialog = useGeneralSettingsStore(state => state.closeDeleteDialog);

  const { data, loading, refetch } = useSystemSettingsQuery();

  const [deleteSetting, { loading: deleting }] = useMutation(deleteSystemSettingMutationDocument);

  const rows = useMemo<readonly SystemSettingRow[]>(() => {
    const settings = data?.systemSettings ?? [];
    return settings
      .map((setting, index) => toSystemSettingRow(setting, index))
      .filter((row): row is SystemSettingRow => row != null)
      .sort((left, right) => left.key.localeCompare(right.key));
  }, [data?.systemSettings]);

  const onSaved = async (): Promise<void> => {
    closeForm();
    notifications.show(labels.saveSuccess, { severity: "success" });
    await refetch();
  };

  const onConfirmDelete = async (): Promise<void> => {
    if (!deleteRow?.key) {
      return;
    }

    try {
      await deleteSetting({ variables: { key: deleteRow.key } });
      notifications.show(labels.deleteSuccess, { severity: "success" });
      closeDeleteDialog();
      await refetch();
    } catch (error) {
      notifications.show(labels.deleteError, { severity: "error" });
      logger.error("Failed to delete system setting", { error, key: deleteRow.key });
    }
  };

  return {
    rows,
    loading,
    canManage,
    labels,
    formOpen,
    editRow,
    deleteRow,
    isDeleting: deleting,
    onAdd: openCreateForm,
    onEdit: openEditForm,
    onDelete: openDeleteDialog,
    onFormClose: closeForm,
    onDeleteClose: closeDeleteDialog,
    onSaved,
    onConfirmDelete,
  };
}
