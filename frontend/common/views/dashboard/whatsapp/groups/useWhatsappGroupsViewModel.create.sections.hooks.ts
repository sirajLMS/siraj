"use client";

import { useMutation } from "@apollo/client/react";
import { useCallback, useState } from "react";
import { WhatsappGroupJoinApprovalMode } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  createWhatsappGroupMutationDocument,
  syncWhatsappGroupsMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import {
  DESCRIPTION_MAX_LENGTH,
  SUBJECT_MAX_LENGTH,
} from "@/frontend/common/views/dashboard/whatsapp/groups/useWhatsappGroupsViewModel.constants";
import {
  mapError,
  withVar,
} from "@/frontend/common/views/dashboard/whatsapp/groups/useWhatsappGroupsViewModel.helpers";
import type {
  NoticeState,
  WorkspaceFilters,
  WorkspaceQueries,
} from "@/frontend/common/views/dashboard/whatsapp/groups/useWhatsappGroupsViewModel.hooks";
import type { WhatsappGroupsLabels } from "@/shared/locale/types/whatsappGroups";

function useCreateDialogState() {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [approvalMode, setApprovalModeState] = useState<WhatsappGroupJoinApprovalMode>(
    WhatsappGroupJoinApprovalMode.AutoApprove
  );
  const [error, setError] = useState<string | null>(null);

  const openDialog = useCallback(() => {
    setSubject("");
    setDescription("");
    setApprovalModeState(WhatsappGroupJoinApprovalMode.AutoApprove);
    setError(null);
    setOpen(true);
  }, []);
  const closeDialog = useCallback(() => setOpen(false), []);

  return {
    open,
    subject,
    setSubject,
    description,
    setDescription,
    approvalMode,
    setApprovalMode: setApprovalModeState,
    error,
    setError,
    openDialog,
    closeDialog,
  };
}

interface CreateGroupSectionDeps {
  readonly queries: WorkspaceQueries;
  readonly filters: WorkspaceFilters;
  readonly labels: WhatsappGroupsLabels;
  readonly showNotice: NoticeState["showNotice"];
}

function useCreateGroupSection({ queries, filters, labels }: CreateGroupSectionDeps) {
  const { groupsQuery } = queries;
  const createDialog = useCreateDialogState();
  const accountId = filters.accountId;
  const [createGroup, createState] = useMutation(createWhatsappGroupMutationDocument, { errorPolicy: "none" });

  const executeCreate = useCallback(async () => {
    const subject = createDialog.subject.trim();
    if (!accountId || subject === "" || subject.length > SUBJECT_MAX_LENGTH) {
      return;
    }
    const description = createDialog.description.trim();
    createDialog.setError(null);
    try {
      await createGroup({
        variables: {
          input: {
            accountId,
            subject,
            description: description === "" ? null : description.slice(0, DESCRIPTION_MAX_LENGTH),
            joinApprovalMode: createDialog.approvalMode,
          },
        },
      });
      createDialog.closeDialog();
      await groupsQuery.refetch();
    } catch (error) {
      createDialog.setError(mapError(error, labels.errorGeneric, "WhatsApp group create failed"));
    }
  }, [accountId, createDialog, createGroup, groupsQuery, labels.errorGeneric]);

  const onSubmitCreate = useCallback(() => {
    void executeCreate();
  }, [executeCreate]);

  return {
    slice: {
      createOpen: createDialog.open,
      onOpenCreate: createDialog.openDialog,
      onCloseCreate: createDialog.closeDialog,
      createSubject: createDialog.subject,
      onCreateSubjectChange: createDialog.setSubject,
      createDescription: createDialog.description,
      onCreateDescriptionChange: createDialog.setDescription,
      createApprovalMode: createDialog.approvalMode,
      onCreateApprovalModeChange: createDialog.setApprovalMode,
      createSubmitDisabled:
        createDialog.subject.trim() === "" || createDialog.subject.trim().length > SUBJECT_MAX_LENGTH,
      creating: createState.loading,
      createError: createDialog.error,
      onSubmitCreate,
    },
  };
}

interface SyncSectionDeps {
  readonly queries: WorkspaceQueries;
  readonly filters: WorkspaceFilters;
  readonly labels: WhatsappGroupsLabels;
  readonly showNotice: NoticeState["showNotice"];
}

function useSyncSection({ queries, filters, labels, showNotice }: SyncSectionDeps) {
  const { groupsQuery } = queries;
  const [syncGroups, syncState] = useMutation(syncWhatsappGroupsMutationDocument, { errorPolicy: "none" });

  const executeSync = useCallback(async () => {
    try {
      const result = await syncGroups({ variables: { accountId: filters.accountId ?? null } });
      const count = result.data?.syncWhatsappGroups ?? 0;
      showNotice(withVar(labels.syncCompleted, "count", String(count)), "success");
      await groupsQuery.refetch();
    } catch (error) {
      showNotice(mapError(error, labels.errorGeneric, "WhatsApp groups sync failed"), "error");
    }
  }, [filters.accountId, syncGroups, groupsQuery, labels.syncCompleted, labels.errorGeneric, showNotice]);

  const onSyncGroups = useCallback(() => {
    void executeSync();
  }, [executeSync]);

  return {
    slice: {
      syncing: syncState.loading,
      onSyncGroups,
    },
  };
}

export { useCreateGroupSection, useSyncSection };
