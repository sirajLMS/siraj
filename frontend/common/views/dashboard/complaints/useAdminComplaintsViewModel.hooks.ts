import { useMutation } from "@apollo/client/react";
import {
  deleteComplaintMutationDocument,
  respondToComplaintMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useAdminComplaintsStore } from "@/frontend/common/stores/adminComplaintsStore";
import { logger } from "@/frontend/common/utils/logger";

interface UseAdminComplaintsActionsParams {
  readonly draftResponses: Readonly<Record<string, string>>;
  readonly deleteComplaintId: string | null;
  readonly refetch: () => Promise<unknown>;
}

/** Owns every admin complaints mutation and store action exposed on the view model. */
export function useAdminComplaintsActions({
  draftResponses,
  deleteComplaintId,
  refetch,
}: Readonly<UseAdminComplaintsActionsParams>) {
  const setSearchQuery = useAdminComplaintsStore(state => state.setSearchQuery);
  const setActiveTab = useAdminComplaintsStore(state => state.setActiveTab);
  const setDraftResponse = useAdminComplaintsStore(state => state.setDraftResponse);
  const setPage = useAdminComplaintsStore(state => state.setPage);
  const openDeleteDialog = useAdminComplaintsStore(state => state.openDeleteDialog);
  const closeDeleteDialog = useAdminComplaintsStore(state => state.closeDeleteDialog);
  const resetResponding = useAdminComplaintsStore(state => state.resetResponding);

  const [respondToComplaintMutation] = useMutation(respondToComplaintMutationDocument);
  const [deleteComplaintMutation] = useMutation(deleteComplaintMutationDocument);

  const handleAnswer = async (id: string, _options: { readonly sendEmail: boolean }) => {
    const draft = draftResponses[id];
    if (!draft) return;

    try {
      await respondToComplaintMutation({
        variables: { input: { complaintId: id, body: draft } },
      });
      setDraftResponse(id, "");
      resetResponding();
      await refetch();
    } catch (e) {
      logger.error("Failed to respond to complaint", { error: e });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteComplaintId) return;

    try {
      await deleteComplaintMutation({ variables: { complaintId: deleteComplaintId } });
      closeDeleteDialog();
      await refetch();
    } catch (e) {
      logger.error("Failed to delete complaint", { error: e });
    }
  };

  const handleRefetch = () => {
    void refetch();
  };

  return {
    onSearchChange: setSearchQuery,
    onTabChange: setActiveTab,
    onDraftChange: setDraftResponse,
    onAnswer: handleAnswer,
    onDelete: openDeleteDialog,
    onPageChange: setPage,
    onDeleteDialogClose: closeDeleteDialog,
    onDeleteDialogConfirm: handleDeleteConfirm,
    onRefetch: handleRefetch,
  };
}
