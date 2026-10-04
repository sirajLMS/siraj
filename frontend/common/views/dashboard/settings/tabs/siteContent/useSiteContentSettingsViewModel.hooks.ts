"use client";

import { useMutation } from "@apollo/client/react";
import { useNotifications } from "@toolpad/core/useNotifications";
import {
  deleteSiteContentMutationDocument,
  updateSiteContentPublishStateMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/settings/site-content-settings.documents";
import { logger } from "@/frontend/common/utils/logger";
import type { SiteContentRow } from "@/frontend/common/views/dashboard/settings/types/siteContentSettings.types";
import type { SettingsSiteContentTabLabels } from "@/shared/locale/types/dashboard/settings/siteContent";

interface UseSiteContentRowActionsProps {
  readonly labels: SettingsSiteContentTabLabels;
  readonly deleteRow: SiteContentRow | null;
  readonly closeForm: () => void;
  readonly closeDeleteDialog: () => void;
  readonly setTogglingPublishId: (id: string | null) => void;
  readonly refetch: () => Promise<unknown>;
}

export function useSiteContentRowActions({
  labels,
  deleteRow,
  closeForm,
  closeDeleteDialog,
  setTogglingPublishId,
  refetch,
}: Readonly<UseSiteContentRowActionsProps>) {
  const notifications = useNotifications();

  const [deleteSiteContent, { loading: isDeleting }] = useMutation(deleteSiteContentMutationDocument);
  const [updatePublishState] = useMutation(updateSiteContentPublishStateMutationDocument);

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
    isDeleting,
    onSaved,
    onConfirmDelete,
    onTogglePublish,
  };
}
