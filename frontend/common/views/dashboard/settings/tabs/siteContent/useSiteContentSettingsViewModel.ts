"use client";

import { useMutation } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import { useMemo } from "react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  deleteSiteContentMutationDocument,
  updateSiteContentPublishStateMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/settings/site-content-settings.documents";
import { useSiteContentEntriesQuery } from "@/frontend/common/hooks/settings";
import { useSiteContentSettingsStore } from "@/frontend/common/stores/siteContentSettingsStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import type {
  SiteContentRow,
  SiteContentSettingsViewModel,
  UseSiteContentSettingsViewModelProps,
} from "@/frontend/common/views/dashboard/settings/types/siteContentSettings.types";
import { useAppTranslation } from "@/shared/locale";

function toSiteContentRow(
  entry: {
    readonly id: string | null;
    readonly slug: string | null;
    readonly title: string | null;
    readonly body: string | null;
    readonly contentType: string | null;
    readonly isPublished: boolean | null;
  },
  index: number
): SiteContentRow | null {
  if (!entry.slug || !entry.title) {
    return null;
  }

  return {
    id: entry.id ?? `${entry.slug}-${index}`,
    slug: entry.slug,
    title: entry.title,
    body: entry.body ?? "",
    contentType: entry.contentType ?? "page",
    isPublished: entry.isPublished ?? false,
  };
}

export function useSiteContentSettingsViewModel(
  _props: Readonly<UseSiteContentSettingsViewModelProps>
): SiteContentSettingsViewModel {
  const labels = useAppTranslation().dashboardTranslations.settings.siteContent;
  const notifications = useNotifications();
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

  const [deleteSiteContent, { loading: deleting }] = useMutation(deleteSiteContentMutationDocument);
  const [updatePublishState] = useMutation(updateSiteContentPublishStateMutationDocument);

  const rows = useMemo<readonly SiteContentRow[]>(() => {
    const entries = data?.siteContentEntries ?? [];
    return entries
      .map((entry, index) => toSiteContentRow(entry, index))
      .filter((row): row is SiteContentRow => row != null)
      .sort((left, right) => left.slug.localeCompare(right.slug));
  }, [data?.siteContentEntries]);

  const onSaved = async (): Promise<void> => {
    closeForm();
    notifications.show(labels.saveSuccess, { severity: "success" });
    await refetch();
  };

  const onConfirmDelete = async (): Promise<void> => {
    if (!deleteRow?.id) {
      return;
    }

    try {
      await deleteSiteContent({ variables: { id: deleteRow.id } });
      notifications.show(labels.deleteSuccess, { severity: "success" });
      closeDeleteDialog();
      await refetch();
    } catch (error) {
      notifications.show(labels.deleteError, { severity: "error" });
      logger.error("Failed to delete site content", { error, id: deleteRow.id });
    }
  };

  const onTogglePublish = async (row: SiteContentRow, isPublished: boolean): Promise<void> => {
    setTogglingPublishId(row.id);
    try {
      await updatePublishState({ variables: { id: row.id, isPublished } });
      notifications.show(isPublished ? labels.publishSuccess : labels.unpublishSuccess, { severity: "success" });
      await refetch();
    } catch (error) {
      notifications.show(labels.publishError, { severity: "error" });
      logger.error("Failed to update site content publish state", { error, id: row.id, isPublished });
    } finally {
      setTogglingPublishId(null);
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
