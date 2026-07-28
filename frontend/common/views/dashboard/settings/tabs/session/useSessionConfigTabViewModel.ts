"use client";

import { useMutation } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useMemo } from "react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { deleteSessionConfigMutationDocument } from "@/frontend/common/graphql/sharedDocuments/settings/session-config.documents";
import { useSessionConfigsQuery } from "@/frontend/common/hooks/settings";
import { useSessionConfigSettingsStore } from "@/frontend/common/stores/sessionConfigSettingsStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import type {
  SessionConfigRow,
  SessionConfigTabViewModel,
  UseSessionConfigTabViewModelProps,
} from "@/frontend/common/views/dashboard/settings/types/sessionConfig.types";
import { useAppTranslation } from "@/shared/locale";

function toSessionConfigRow(
  config: {
    readonly id: string | null;
    readonly roleName: string | null;
    readonly ttlSeconds: number | null;
    readonly maxConcurrentSessions: number | null;
  },
  index: number
): SessionConfigRow | null {
  if (!config.roleName || config.ttlSeconds == null || config.maxConcurrentSessions == null) {
    return null;
  }

  return {
    id: config.id ?? `${config.roleName}-${index}`,
    roleName: config.roleName,
    ttlSeconds: config.ttlSeconds,
    maxConcurrentSessions: config.maxConcurrentSessions,
  };
}

export function useSessionConfigTabViewModel(
  _props: Readonly<UseSessionConfigTabViewModelProps>
): SessionConfigTabViewModel {
  const labels = useAppTranslation().dashboardTranslations.settings.session;
  const notifications = useNotifications();
  const hasPermission = useUserStore(state => state.hasPermission);
  const canManage = hasPermission(AppPermission.SettingsEditSession);

  const formOpen = useSessionConfigSettingsStore(state => state.formOpen);
  const editRow = useSessionConfigSettingsStore(state => state.editRow);
  const deleteRow = useSessionConfigSettingsStore(state => state.deleteRow);
  const openCreateForm = useSessionConfigSettingsStore(state => state.openCreateForm);
  const openEditForm = useSessionConfigSettingsStore(state => state.openEditForm);
  const closeForm = useSessionConfigSettingsStore(state => state.closeForm);
  const openDeleteDialog = useSessionConfigSettingsStore(state => state.openDeleteDialog);
  const closeDeleteDialog = useSessionConfigSettingsStore(state => state.closeDeleteDialog);

  const { data, loading, refetch } = useSessionConfigsQuery();

  const [deleteSessionConfig, { loading: deleting }] = useMutation(deleteSessionConfigMutationDocument);

  const rows = useMemo<readonly SessionConfigRow[]>(() => {
    const configs = data?.sessionConfigs ?? [];
    return configs
      .map((config, index) => toSessionConfigRow(config, index))
      .filter((row): row is SessionConfigRow => row != null)
      .sort((left, right) => left.roleName.localeCompare(right.roleName));
  }, [data?.sessionConfigs]);

  const onSaved = async (): Promise<void> => {
    closeForm();
    notifications.show(labels.saveSuccess, { severity: "success" });
    await refetch();
  };

  const onConfirmDelete = async (): Promise<void> => {
    if (!deleteRow?.roleName) {
      return;
    }

    try {
      await deleteSessionConfig({ variables: { roleName: deleteRow.roleName } });
      notifications.show(labels.deleteSuccess, { severity: "success" });
      closeDeleteDialog();
      await refetch();
    } catch (error) {
      notifications.show(labels.deleteError, { severity: "error" });
      logger.error("Failed to delete session config", { error, roleName: deleteRow.roleName });
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
