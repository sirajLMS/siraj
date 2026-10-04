import { useMutation } from "@apollo/client/react";
import { useCallback } from "react";
import { deleteLearningResourceMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { logger } from "@/frontend/common/utils/logger";
import type { LearningResourceRow } from "@/frontend/common/views/dashboard/resources/types/resourcesTypes";

export interface DeleteHandlers {
  readonly onDeleteRequest: (id: string) => void;
  readonly onDeleteCancel: () => void;
  readonly onDeleteConfirm: () => Promise<void>;
  readonly deleting: boolean;
}

function useDeleteMutation() {
  return useMutation(deleteLearningResourceMutationDocument);
}

function useDeleteCallbacks(params: {
  readonly pendingDeleteId: string | null;
  readonly closeDeleteDialog: () => void;
  readonly setDeleting: (value: boolean) => void;
  readonly deleteMutation: ReturnType<typeof useDeleteMutation>[0];
}): { onDeleteConfirm: () => Promise<void> } {
  const { pendingDeleteId, closeDeleteDialog, setDeleting, deleteMutation } = params;
  return {
    onDeleteConfirm: useCallback(async () => {
      if (!pendingDeleteId) return;

      setDeleting(true);

      try {
        await deleteMutation({ variables: { id: pendingDeleteId } });
        closeDeleteDialog();
      } catch (error) {
        logger.error("Delete failed:", { error });
      } finally {
        setDeleting(false);
      }
    }, [pendingDeleteId, deleteMutation, closeDeleteDialog, setDeleting]),
  };
}

function useDeleteRequest(
  resources: readonly LearningResourceRow[],
  openDeleteDialog: (id: string, title: string) => void
): (id: string) => void {
  return useCallback(
    (id: string) => {
      const resource = resources.find(r => r.id === id);
      if (resource) {
        openDeleteDialog(id, resource.title);
      }
    },
    [resources, openDeleteDialog]
  );
}

export function useDeleteHandlers(params: {
  readonly resources: readonly LearningResourceRow[];
  readonly pendingDeleteId: string | null;
  readonly openDeleteDialog: (id: string, title: string) => void;
  readonly closeDeleteDialog: () => void;
  readonly setDeleting: (value: boolean) => void;
}): DeleteHandlers {
  const { resources, pendingDeleteId, openDeleteDialog, closeDeleteDialog, setDeleting } = params;
  const [deleteMutation, { loading: deleting }] = useDeleteMutation();

  const onDeleteRequest = useDeleteRequest(resources, openDeleteDialog);
  const onDeleteCancel = useCallback(() => {
    closeDeleteDialog();
  }, [closeDeleteDialog]);
  const { onDeleteConfirm } = useDeleteCallbacks({
    pendingDeleteId,
    closeDeleteDialog,
    setDeleting,
    deleteMutation,
  });

  return { onDeleteRequest, onDeleteCancel, onDeleteConfirm, deleting };
}
