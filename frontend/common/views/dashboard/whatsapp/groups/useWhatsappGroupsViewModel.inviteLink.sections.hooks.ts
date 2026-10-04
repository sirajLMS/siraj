"use client";

import { useMutation } from "@apollo/client/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getWhatsappGroupInviteLinkMutationDocument,
  resetWhatsappGroupInviteLinkMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import type { WhatsappGroupRow } from "@/frontend/common/views/dashboard/whatsapp/groups/types/whatsappGroupsView.types";
import { mapError } from "@/frontend/common/views/dashboard/whatsapp/groups/useWhatsappGroupsViewModel.helpers";
import type {
  NoticeState,
  WorkspaceQueries,
} from "@/frontend/common/views/dashboard/whatsapp/groups/useWhatsappGroupsViewModel.hooks";
import type { WhatsappGroupsLabels } from "@/shared/locale/types/whatsappGroups";

interface InviteLinkSectionDeps {
  readonly queries: WorkspaceQueries;
  readonly selectedGroupId: string | null;
  readonly selectedGroup: WhatsappGroupRow | null;
  readonly labels: WhatsappGroupsLabels;
  readonly showNotice: NoticeState["showNotice"];
}

function useInviteLinkSection({ queries, selectedGroupId, selectedGroup, labels, showNotice }: InviteLinkSectionDeps) {
  const { groupQuery } = queries;
  const [copied, setCopied] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetInviteLink, resetState] = useMutation(resetWhatsappGroupInviteLinkMutationDocument, {
    errorPolicy: "none",
  });
  const selectedGroupIdForActions = selectedGroupId ?? "";

  const onCopyInviteLink = useCallback(() => {
    const link = selectedGroup?.inviteLink ?? null;
    if (link === null || link === "") {
      showNotice(labels.inviteLinkEmpty, "error");
      return;
    }
    void navigator.clipboard
      .writeText(link)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
        return null;
      })
      .catch(() => {
        showNotice(labels.errorGeneric, "error");
      });
  }, [selectedGroup, labels.inviteLinkEmpty, labels.errorGeneric, showNotice]);

  const onAskResetInviteLink = useCallback(() => setResetOpen(true), []);
  const onCloseReset = useCallback(() => setResetOpen(false), []);

  const executeReset = useCallback(async () => {
    if (selectedGroupIdForActions === "") {
      return;
    }
    try {
      const result = await resetInviteLink({ variables: { groupId: selectedGroupIdForActions } });
      const link = result.data?.resetWhatsappGroupInviteLink ?? null;
      if (link !== null && selectedGroup) {
        showNotice(labels.copied, "success");
      }
      await groupQuery.refetch();
    } catch (error) {
      showNotice(mapError(error, labels.errorGeneric, "WhatsApp invite link reset failed"), "error");
    } finally {
      setResetOpen(false);
    }
  }, [
    selectedGroupIdForActions,
    resetInviteLink,
    selectedGroup,
    groupQuery,
    labels.copied,
    labels.errorGeneric,
    showNotice,
  ]);

  const onConfirmResetInviteLink = useCallback(() => {
    void executeReset();
  }, [executeReset]);

  return {
    slice: {
      inviteLink: selectedGroup?.inviteLink ?? null,
      copied,
      onCopyInviteLink,
      resetOpen,
      resetting: resetState.loading,
      onAskResetInviteLink,
      onCloseReset,
      onConfirmResetInviteLink,
    },
  };
}

interface InviteLinkFetchSectionDeps {
  readonly queries: WorkspaceQueries;
  readonly selectedGroupId: string | null;
  readonly selectedGroup: WhatsappGroupRow | null;
  readonly canManage: boolean;
  readonly labels: WhatsappGroupsLabels;
  readonly showNotice: NoticeState["showNotice"];
}

/**
 * A cached invite link is advisory — when the group row carries none, the
 * current link is fetched from Meta through the invite-link mutation. The
 * timeout defers the fetch out of the render pass so no cascading render
 * is triggered synchronously.
 */
function useInviteLinkFetchSection({
  queries,
  selectedGroupId,
  selectedGroup,
  canManage,
  labels,
  showNotice,
}: InviteLinkFetchSectionDeps) {
  const { groupQuery } = queries;
  const [getInviteLink, inviteLinkState] = useMutation(getWhatsappGroupInviteLinkMutationDocument, {
    errorPolicy: "none",
  });
  const selectedGroupIdForActions = selectedGroupId ?? "";

  const executeInviteLinkFetch = useCallback(async () => {
    if (selectedGroupIdForActions === "") {
      return;
    }
    try {
      await getInviteLink({ variables: { groupId: selectedGroupIdForActions } });
      await groupQuery.refetch();
    } catch (error) {
      showNotice(mapError(error, labels.errorGeneric, "WhatsApp invite link fetch failed"), "error");
    }
  }, [selectedGroupIdForActions, getInviteLink, groupQuery, labels.errorGeneric, showNotice]);

  const inviteLinkMissing = selectedGroup !== null && selectedGroup.inviteLink === null && canManage;
  const inviteLinkFetchPendingRef = useRef(false);
  useEffect(() => {
    if (!inviteLinkMissing || inviteLinkState.loading) {
      inviteLinkFetchPendingRef.current = false;
      return;
    }
    if (inviteLinkFetchPendingRef.current) {
      return;
    }
    inviteLinkFetchPendingRef.current = true;
    window.setTimeout(() => {
      void executeInviteLinkFetch().finally(() => {
        inviteLinkFetchPendingRef.current = false;
      });
    }, 0);
  }, [inviteLinkMissing, inviteLinkState.loading, executeInviteLinkFetch]);
}

export { useInviteLinkFetchSection, useInviteLinkSection };
