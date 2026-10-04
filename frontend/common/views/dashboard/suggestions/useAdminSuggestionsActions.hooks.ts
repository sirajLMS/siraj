"use client";

import { useAdminSuggestionsStore } from "@/frontend/common/stores/adminSuggestionsStore";
import { createAdminSuggestionActionHandlers } from "@/frontend/common/views/dashboard/suggestions/adminSuggestionsHandlers.helpers";
import type { SuggestionsAdminLabels } from "@/frontend/common/views/dashboard/suggestions/types/suggestionsView.types";
import { useAdminSuggestionsMutations } from "@/frontend/common/views/dashboard/suggestions/useAdminSuggestionsMutations.hooks";

interface AdminSuggestionsActionsDeps {
  readonly notifySuccess: (msg: string) => void;
  readonly notifyError: (msg: string) => void;
  readonly labels: SuggestionsAdminLabels;
  readonly refetch: () => Promise<unknown>;
}

export function useAdminSuggestionsActions(deps: AdminSuggestionsActionsDeps) {
  const { notifySuccess, notifyError, labels, refetch } = deps;

  const deletingId = useAdminSuggestionsStore(state => state.deletingId);
  const isDeleting = useAdminSuggestionsStore(state => state.isDeleting);
  const deleteDialogOpen = useAdminSuggestionsStore(state => state.deleteDialogOpen);
  const openDeleteDialog = useAdminSuggestionsStore(state => state.openDeleteDialog);
  const closeDeleteDialog = useAdminSuggestionsStore(state => state.closeDeleteDialog);
  const setIsDeleting = useAdminSuggestionsStore(state => state.setIsDeleting);

  const respondDialogOpen = useAdminSuggestionsStore(state => state.respondDialogOpen);
  const isResponding = useAdminSuggestionsStore(state => state.isResponding);
  const openRespondDialog = useAdminSuggestionsStore(state => state.openRespondDialog);
  const closeRespondDialog = useAdminSuggestionsStore(state => state.closeRespondDialog);
  const setIsResponding = useAdminSuggestionsStore(state => state.setIsResponding);

  const duplicateDialogOpen = useAdminSuggestionsStore(state => state.duplicateDialogOpen);
  const markingDuplicateId = useAdminSuggestionsStore(state => state.markingDuplicateId);
  const isMarkingDuplicate = useAdminSuggestionsStore(state => state.isMarkingDuplicate);
  const openDuplicateDialog = useAdminSuggestionsStore(state => state.openDuplicateDialog);
  const closeDuplicateDialog = useAdminSuggestionsStore(state => state.closeDuplicateDialog);
  const setIsMarkingDuplicate = useAdminSuggestionsStore(state => state.setIsMarkingDuplicate);

  const mutations = useAdminSuggestionsMutations({
    notifySuccess,
    notifyError,
    notificationLabels: labels.notifications,
    closeRespondDialog,
    closeDuplicateDialog,
    closeDeleteDialog,
    setIsResponding,
    setIsMarkingDuplicate,
    setIsDeleting,
    refetch,
  });

  const handlers = createAdminSuggestionActionHandlers({
    mutations,
    openRespondDialog,
    openDuplicateDialog,
    openDeleteDialog,
    setIsResponding,
    setIsMarkingDuplicate,
    setIsDeleting,
    deletingId,
  });

  return {
    respondDialogOpen,
    isResponding,
    duplicateDialogOpen,
    markingDuplicateId,
    isMarkingDuplicate,
    deleteDialogOpen,
    deletingId,
    isDeleting,
    dialogLabels: labels.dialogs,
    closeDeleteDialog,
    closeRespondDialog,
    closeDuplicateDialog,
    ...handlers,
  };
}
