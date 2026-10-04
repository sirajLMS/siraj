export interface AdminSuggestionMutationTargets {
  readonly markReviewed: (opts: { variables: { suggestionId: string } }) => Promise<unknown>;
  readonly respondToSuggestion: (opts: {
    variables: { input: { suggestionId: string; adminResponse: string } };
  }) => Promise<unknown>;
  readonly markDuplicate: (opts: {
    variables: { input: { suggestionId: string; duplicateOfId: string } };
  }) => Promise<unknown>;
  readonly deleteSuggestion: (opts: { variables: { suggestionId: string } }) => Promise<unknown>;
}

export function createAdminSuggestionActionHandlers(params: {
  readonly mutations: AdminSuggestionMutationTargets;
  readonly openRespondDialog: (id: string) => void;
  readonly openDuplicateDialog: (id: string) => void;
  readonly openDeleteDialog: (id: string) => void;
  readonly setIsResponding: (value: boolean) => void;
  readonly setIsMarkingDuplicate: (value: boolean) => void;
  readonly setIsDeleting: (value: boolean) => void;
  readonly deletingId: string;
}) {
  const {
    mutations,
    openRespondDialog,
    openDuplicateDialog,
    openDeleteDialog,
    setIsResponding,
    setIsMarkingDuplicate,
    setIsDeleting,
    deletingId,
  } = params;

  const handleMarkReviewed = (id: string) => {
    void mutations.markReviewed({ variables: { suggestionId: id } });
  };

  const handleRespond = (id: string) => {
    openRespondDialog(id);
  };

  const handleRespondConfirm = (suggestionId: string, adminResponse: string) => {
    setIsResponding(true);
    void mutations.respondToSuggestion({
      variables: { input: { suggestionId, adminResponse } },
    });
  };

  const handleMarkDuplicate = (id: string) => {
    openDuplicateDialog(id);
  };

  const handleMarkDuplicateConfirm = (suggestionId: string, duplicateOfId: string) => {
    setIsMarkingDuplicate(true);
    void mutations.markDuplicate({
      variables: { input: { suggestionId, duplicateOfId } },
    });
  };

  const handleDelete = (id: string) => {
    openDeleteDialog(id);
  };

  const handleDeleteConfirm = () => {
    if (!deletingId) return;
    setIsDeleting(true);
    void mutations.deleteSuggestion({ variables: { suggestionId: deletingId } });
  };

  return {
    onMarkReviewed: handleMarkReviewed,
    onRespond: handleRespond,
    onRespondConfirm: handleRespondConfirm,
    onMarkDuplicate: handleMarkDuplicate,
    onMarkDuplicateConfirm: handleMarkDuplicateConfirm,
    onDelete: handleDelete,
    onDeleteConfirm: handleDeleteConfirm,
  };
}
