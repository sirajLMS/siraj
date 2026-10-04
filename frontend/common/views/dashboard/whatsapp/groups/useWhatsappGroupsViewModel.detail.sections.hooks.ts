"use client";

import { useMutation } from "@apollo/client/react";
import { useCallback, useState } from "react";
import { WhatsappGroupJoinApprovalMode } from "@/frontend/common/graphql/generated/gql/graphql";
import { deleteWhatsappGroupMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { mapError } from "@/frontend/common/views/dashboard/whatsapp/groups/useWhatsappGroupsViewModel.helpers";
import {
  type NoticeState,
  useSelectedGroup,
  type WorkspaceFilters,
  type WorkspaceQueries,
} from "@/frontend/common/views/dashboard/whatsapp/groups/useWhatsappGroupsViewModel.hooks";
import {
  useInviteLinkFetchSection,
  useInviteLinkSection,
} from "@/frontend/common/views/dashboard/whatsapp/groups/useWhatsappGroupsViewModel.inviteLink.sections.hooks";
import type { WhatsappGroupsLabels } from "@/shared/locale/types/whatsappGroups";

interface GroupDetailSectionDeps {
  readonly queries: WorkspaceQueries;
  readonly filters: WorkspaceFilters;
  readonly labels: WhatsappGroupsLabels;
  readonly canManage: boolean;
  readonly showNotice: NoticeState["showNotice"];
}

function useGroupDetailSection({ queries, filters, labels, canManage, showNotice }: GroupDetailSectionDeps) {
  const { groupQuery } = queries;
  const selectedGroup = useSelectedGroup(queries.groupsQuery, groupQuery, filters.selectedGroupId);
  const inviteLink = useInviteLinkSection({
    queries,
    selectedGroupId: filters.selectedGroupId,
    selectedGroup,
    labels,
    showNotice,
  });
  useInviteLinkFetchSection({
    queries,
    selectedGroupId: filters.selectedGroupId,
    selectedGroup,
    canManage,
    labels,
    showNotice,
  });

  const [deleteGroup, deleteState] = useMutation(deleteWhatsappGroupMutationDocument, { errorPolicy: "none" });
  const [deleteOpen, setDeleteOpenState] = useState(false);
  const selectedGroupIdForActions = filters.selectedGroupId ?? "";

  const onAskDeleteGroup = useCallback(() => setDeleteOpenState(true), []);
  const onCloseDelete = useCallback(() => setDeleteOpenState(false), []);

  const executeDelete = useCallback(async () => {
    if (selectedGroupIdForActions === "") {
      return;
    }
    try {
      await deleteGroup({ variables: { groupId: selectedGroupIdForActions } });
      setDeleteOpenState(false);
      filters.onCloseGroup();
      await queries.groupsQuery.refetch();
    } catch (error) {
      showNotice(mapError(error, labels.errorGeneric, "WhatsApp group delete failed"), "error");
    }
  }, [selectedGroupIdForActions, deleteGroup, filters, queries, labels.errorGeneric, showNotice]);

  const onConfirmDeleteGroup = useCallback(() => {
    void executeDelete();
  }, [executeDelete]);

  const onRefreshGroup = useCallback(() => {
    void groupQuery.refetch();
  }, [groupQuery]);

  const selectedGroupApprovalModeLabel =
    selectedGroup?.joinApprovalMode === WhatsappGroupJoinApprovalMode.ApprovalRequired
      ? labels.approvalModeRequired
      : labels.approvalModeAuto;

  return {
    slice: {
      selectedGroupId: filters.selectedGroupId,
      onSelectGroup: filters.onSelectGroup,
      onCloseGroup: filters.onCloseGroup,
      selectedGroup,
      selectedGroupLoading: groupQuery.loading,
      selectedGroupError: groupQuery.error !== undefined,
      selectedGroupApprovalModeLabel,
      onRefreshGroup,
      ...inviteLink.slice,
      deleteOpen,
      deleting: deleteState.loading,
      onAskDeleteGroup,
      onCloseDelete,
      onConfirmDeleteGroup,
    },
  };
}

export { useGroupDetailSection };
