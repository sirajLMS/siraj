"use client";

import { useMutation } from "@apollo/client/react";
import { useCallback, useState } from "react";
import { removeWhatsappGroupParticipantsMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { WA_ID_SHAPE } from "@/frontend/common/views/dashboard/whatsapp/groups/useWhatsappGroupsViewModel.constants";
import { mapError } from "@/frontend/common/views/dashboard/whatsapp/groups/useWhatsappGroupsViewModel.helpers";
import type {
  NoticeState,
  WorkspaceFilters,
  WorkspaceQueries,
} from "@/frontend/common/views/dashboard/whatsapp/groups/useWhatsappGroupsViewModel.hooks";
import type { WhatsappGroupsLabels } from "@/shared/locale/types/whatsappGroups";

interface RemoveParticipantSectionDeps {
  readonly queries: WorkspaceQueries;
  readonly filters: WorkspaceFilters;
  readonly labels: WhatsappGroupsLabels;
  readonly showNotice: NoticeState["showNotice"];
}

function useRemoveParticipantSection({ queries, filters, labels, showNotice }: RemoveParticipantSectionDeps) {
  const { groupQuery } = queries;
  const [removeParticipants, removeState] = useMutation(removeWhatsappGroupParticipantsMutationDocument, {
    errorPolicy: "none",
  });
  const [removeParticipantOpen, setRemoveParticipantOpen] = useState(false);
  const [removeParticipantWaId, setRemoveParticipantWaId] = useState("");
  const selectedGroupIdForActions = filters.selectedGroupId ?? "";

  const removeParticipantValid = WA_ID_SHAPE.test(removeParticipantWaId);

  const onAskRemoveParticipant = useCallback(() => {
    setRemoveParticipantWaId("");
    setRemoveParticipantOpen(true);
  }, []);
  const onCloseRemoveParticipant = useCallback(() => setRemoveParticipantOpen(false), []);

  const executeRemoveParticipant = useCallback(async () => {
    if (selectedGroupIdForActions === "" || !removeParticipantValid) {
      return;
    }
    try {
      await removeParticipants({
        variables: { input: { groupId: selectedGroupIdForActions, participants: [removeParticipantWaId] } },
      });
      setRemoveParticipantOpen(false);
      await groupQuery.refetch();
    } catch (error) {
      showNotice(mapError(error, labels.errorGeneric, "WhatsApp participant removal failed"), "error");
    }
  }, [
    selectedGroupIdForActions,
    removeParticipantValid,
    removeParticipantWaId,
    removeParticipants,
    groupQuery,
    labels.errorGeneric,
    showNotice,
  ]);

  const onConfirmRemoveParticipant = useCallback(() => {
    void executeRemoveParticipant();
  }, [executeRemoveParticipant]);

  return {
    slice: {
      removeParticipantWaId,
      onRemoveParticipantWaIdChange: setRemoveParticipantWaId,
      removeParticipantValid,
      removeParticipantOpen,
      removingParticipant: removeState.loading,
      onAskRemoveParticipant,
      onCloseRemoveParticipant,
      onConfirmRemoveParticipant,
    },
  };
}

export { useRemoveParticipantSection };
