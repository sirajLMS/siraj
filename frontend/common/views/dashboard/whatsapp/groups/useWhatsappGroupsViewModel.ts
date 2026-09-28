"use client";

import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getDateTimeFormatter } from "@/frontend/common/components/intl/dateFormat";
import {
  AppPermission,
  type WhatsappAccountsQuery,
  WhatsappGroupJoinApprovalMode,
  type WhatsappGroupsQuery,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  approveWhatsappGroupJoinRequestsMutationDocument,
  createWhatsappGroupMutationDocument,
  deleteWhatsappGroupMutationDocument,
  getWhatsappGroupInviteLinkMutationDocument,
  pinWhatsappGroupMessageMutationDocument,
  rejectWhatsappGroupJoinRequestsMutationDocument,
  removeWhatsappGroupParticipantsMutationDocument,
  resetWhatsappGroupInviteLinkMutationDocument,
  sendWhatsappGroupMessageMutationDocument,
  syncWhatsappGroupsMutationDocument,
  unpinWhatsappGroupMessageMutationDocument,
  whatsappAccountsQueryDocument,
  whatsappGroupJoinRequestsQueryDocument,
  whatsappGroupMessagesQueryDocument,
  whatsappGroupQueryDocument,
  whatsappGroupsQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import type {
  WhatsappGroupJoinRequestRow,
  WhatsappGroupMessageRow,
  WhatsappGroupRow,
  WhatsappGroupsAccountOption,
  WhatsappGroupsViewModel,
} from "@/frontend/common/views/dashboard/whatsapp/groups/types/whatsappGroupsView.types";
import { Translation, useAppTranslation } from "@/shared/locale";
import { useAppLocale } from "@/shared/locale/localeContext";

const TIMESTAMP_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
};

const PAGE_SIZE = 20;
const MESSAGES_PAGE_SIZE = 50;
const WA_ID_SHAPE = /^\d{6,32}$/;
const SUBJECT_MAX_LENGTH = 128;
const DESCRIPTION_MAX_LENGTH = 2048;
const PIN_EXPIRATION_DAYS = 7;

/**
 * 0-based page translated to GraphQL `first`/`skip` — the same contract the
 * shared list pagination uses everywhere; all fields present because MockLink
 * matches variables exactly in tests.
 */
function buildPaginationArgs(page: number, pageSize: number) {
  return { first: pageSize, skip: page * pageSize, after: null, before: null, last: null, page: null, maxCount: null };
}

/** Replaces a single `{variable}` placeholder in a translated template. */
function withVar(template: string, variable: string, value: string): string {
  return template.replaceAll(`{${variable}}`, value);
}

type WhatsappAccountRow = NonNullable<WhatsappAccountsQuery["whatsappAccounts"]>[number];

function resolveAccountLabel(account: WhatsappAccountRow, locale: string): string {
  if (account.displayPhoneNumber) {
    return account.displayPhoneNumber;
  }
  const localized = account.displayName?.[locale === "ar" ? "ar" : "en"];
  return localized ?? account.displayName?.en ?? account.wabaId ?? "";
}

function buildAccountOptions(rows: WhatsappAccountsQuery["whatsappAccounts"], locale: string) {
  const options: WhatsappGroupsAccountOption[] = [];
  for (const row of rows ?? []) {
    if (row.id) {
      options.push({
        id: row.id,
        label: resolveAccountLabel(row, locale),
        isActive: row.isActive ?? false,
      });
    }
  }
  return options;
}

function isGroupRow(row: { id: string | null }): row is WhatsappGroupRow {
  return row.id !== null;
}

function isMessageRow(row: { id: string | null }): row is WhatsappGroupMessageRow {
  return row.id !== null;
}

function isJoinRequestRow(row: { id: string | null }): row is WhatsappGroupJoinRequestRow {
  return row.id !== null;
}

/**
 * Service-level domain errors reach the client with an already-localized
 * message on the GraphQL error; codes select the dedicated translated string
 * first, then the localized server message, then the generic fallback.
 */
function localizedMessage(error: unknown): string | null {
  if (!CombinedGraphQLErrors.is(error)) {
    return null;
  }
  const message = error.errors[0]?.message;
  return typeof message === "string" && message !== "" ? message : null;
}

function mapError(error: unknown, fallback: string, logContext: string): string {
  const serverMessage = localizedMessage(error);
  if (serverMessage !== null) {
    return serverMessage;
  }
  logger.warn(logContext, { message: error instanceof Error ? error.message : String(error) });
  return fallback;
}

/**
 * Page folded into the list-query variables: clamped against the most recent
 * server-reported total so a shrinking totalCount never keeps the query on a
 * page that no longer exists. Unclamped until the first payload lands.
 */
function resolveListQueryPage(requestedPage: number, serverTotalCount: number | null): number {
  if (serverTotalCount === null) {
    return requestedPage;
  }
  return Math.min(requestedPage, Math.max(0, Math.ceil(serverTotalCount / PAGE_SIZE) - 1));
}

/**
 * Keeps the list page anchored to the server-reported total: records each
 * payload's totalCount and re-anchors the page filter to the last existing
 * page when the total shrinks below it.
 */
function useSyncListPage(
  data: WhatsappGroupsQuery | undefined,
  requestedPage: number,
  setPage: (page: number) => void,
  noteTotalCount: (totalCount: number) => void
) {
  useEffect(() => {
    const totalCount = data?.whatsappGroups?.totalCount;
    if (totalCount === undefined) {
      return;
    }
    noteTotalCount(totalCount);
    const lastPage = Math.max(0, Math.ceil(totalCount / PAGE_SIZE) - 1);
    if (requestedPage > lastPage) {
      setPage(lastPage);
    }
  }, [data, requestedPage, setPage, noteTotalCount]);
}

/**
 * Workspace queries: the paginated groups list refreshes with the network
 * (cache-and-network) so syncs land immediately; the single group, its
 * message thread, and its pending join requests skip until a group opens.
 */
function useWorkspaceQueries(accountId: string | null, page: number, selectedGroupId: string | null) {
  const accountsQuery = useQuery(whatsappAccountsQueryDocument);
  const groupsQuery = useQuery(whatsappGroupsQueryDocument, {
    variables: { accountId, search: null, pagination: buildPaginationArgs(page, PAGE_SIZE) },
    fetchPolicy: "cache-and-network",
  });
  const groupQuery = useQuery(whatsappGroupQueryDocument, {
    variables: { groupId: selectedGroupId ?? "" },
    skip: selectedGroupId === null,
    fetchPolicy: "cache-and-network",
  });
  const messagesQuery = useQuery(whatsappGroupMessagesQueryDocument, {
    variables: { groupId: selectedGroupId ?? "", pagination: buildPaginationArgs(0, MESSAGES_PAGE_SIZE) },
    skip: selectedGroupId === null,
    fetchPolicy: "cache-and-network",
  });
  const joinRequestsQuery = useQuery(whatsappGroupJoinRequestsQueryDocument, {
    variables: { groupId: selectedGroupId ?? "" },
    skip: selectedGroupId === null,
    fetchPolicy: "cache-and-network",
  });
  return { accountsQuery, groupsQuery, groupQuery, messagesQuery, joinRequestsQuery };
}

function useWorkspaceFilters() {
  const [accountId, setAccountIdState] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const onAccountChange = useCallback((nextAccountId: string) => {
    setAccountIdState(nextAccountId);
    setSearch("");
    setPage(0);
    setSelectedGroupId(null);
  }, []);
  const onSearchChange = useCallback((value: string) => setSearch(value), []);
  const onSelectGroup = useCallback((groupId: string) => setSelectedGroupId(groupId), []);
  const onCloseGroup = useCallback(() => setSelectedGroupId(null), []);

  return {
    accountId,
    setAccountId: setAccountIdState,
    search,
    page,
    setPage,
    selectedGroupId,
    onSelectGroup,
    onCloseGroup,
    onAccountChange,
    onSearchChange,
  };
}

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

/** Resolves the display text of a persisted group message body, `null` for media-only rows. */
export function resolveMessageText(content: unknown): string | null {
  if (typeof content === "string") {
    return content === "" ? null : content;
  }
  // Persisted rows carry the Meta typed-content envelope (e.g. `{ body, … }`).
  if (typeof content !== "object" || content === null || !("body" in content)) {
    return null;
  }
  const body: unknown = content.body;
  return typeof body === "string" && body !== "" ? body : null;
}

export function useWhatsappGroupsViewModel(): WhatsappGroupsViewModel {
  const labels = useAppTranslation(Translation.WhatsappGroups);
  const commonLabels = useAppTranslation(Translation.Common);
  const locale = useAppLocale();
  const hasPermission = useUserStore(state => state.hasPermission);
  const canManage = hasPermission(AppPermission.WhatsappGroupsManage);

  const filters = useWorkspaceFilters();
  const createDialog = useCreateDialogState();
  const [serverTotalCount, setServerTotalCount] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ text: string; severity: "success" | "error" } | null>(null);
  const [copied, setCopied] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [removeParticipantOpen, setRemoveParticipantOpen] = useState(false);
  const [removeParticipantWaId, setRemoveParticipantWaId] = useState("");
  const [messageDraft, setMessageDraft] = useState("");
  const [messageError, setMessageError] = useState<string | null>(null);
  const [pinningMessageId, setPinningMessageId] = useState<string | null>(null);
  const [joinRequestBusyId, setJoinRequestBusyId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpenState] = useState(false);

  const { accountsQuery, groupsQuery, groupQuery, messagesQuery, joinRequestsQuery } = useWorkspaceQueries(
    filters.accountId,
    resolveListQueryPage(filters.page, serverTotalCount),
    filters.selectedGroupId
  );

  const accounts = useMemo(
    () => buildAccountOptions(accountsQuery.data?.whatsappAccounts ?? null, locale),
    [accountsQuery.data, locale]
  );

  // Default to the first connected number once accounts resolve; re-anchor if
  // the selected number disappears from the list (sync/deactivation).
  const selectAccount = filters.setAccountId;
  const accountId = filters.accountId;
  useEffect(() => {
    const first = accounts[0];
    if (first && (accountId === null || !accounts.some(option => option.id === accountId))) {
      selectAccount(first.id);
    }
  }, [accounts, accountId, selectAccount]);

  const accountLabel = useCallback(
    (id: string | null) => accounts.find(option => option.id === id)?.label ?? null,
    [accounts]
  );

  const pageRows = useMemo(() => (groupsQuery.data?.whatsappGroups?.rows ?? []).filter(isGroupRow), [groupsQuery.data]);
  const groups = useMemo(() => {
    const needle = filters.search.trim().toLowerCase();
    if (!needle) {
      return pageRows;
    }
    return pageRows.filter(row =>
      [row.subject, row.description, row.groupJid].some(field => (field ? field.toLowerCase().includes(needle) : false))
    );
  }, [pageRows, filters.search]);

  const totalCount = groupsQuery.data?.whatsappGroups?.totalCount ?? 0;
  const lastPage = Math.max(0, Math.ceil(totalCount / PAGE_SIZE) - 1);
  const groupsPage = Math.min(filters.page, lastPage);
  useSyncListPage(groupsQuery.data, filters.page, filters.setPage, setServerTotalCount);

  const selectedGroupId = filters.selectedGroupId;
  const selectedGroupFromList = useMemo(
    () => pageRows.find(row => row.id === selectedGroupId) ?? null,
    [pageRows, selectedGroupId]
  );
  const selectedGroup = useMemo(() => {
    const detail = groupQuery.data?.whatsappGroup ?? null;
    if (detail !== null) {
      return detail;
    }
    return selectedGroupFromList;
  }, [groupQuery.data, selectedGroupFromList]);

  const groupMessages = useMemo(
    () => (messagesQuery.data?.whatsappGroupMessages?.rows ?? []).filter(isMessageRow),
    [messagesQuery.data]
  );
  const joinRequests = useMemo(
    () => (joinRequestsQuery.data?.whatsappGroupJoinRequests ?? []).filter(isJoinRequestRow),
    [joinRequestsQuery.data]
  );

  const formatTimestamp = useCallback(
    (iso: string | null) => {
      if (!iso) {
        return "";
      }
      return getDateTimeFormatter(locale === "ar" ? "ar" : "en", TIMESTAMP_FORMAT_OPTIONS).format(new Date(iso));
    },
    [locale]
  );

  const dismissNotice = useCallback(() => setNotice(null), []);

  const showNotice = useCallback((text: string, severity: "success" | "error") => {
    setNotice({ text, severity });
  }, []);

  const selectedGroupApprovalModeLabel =
    selectedGroup?.joinApprovalMode === WhatsappGroupJoinApprovalMode.ApprovalRequired
      ? labels.approvalModeRequired
      : labels.approvalModeAuto;

  const [createGroup, createState] = useMutation(createWhatsappGroupMutationDocument, { errorPolicy: "none" });
  const [deleteGroup, deleteState] = useMutation(deleteWhatsappGroupMutationDocument, { errorPolicy: "none" });
  const [syncGroups, syncState] = useMutation(syncWhatsappGroupsMutationDocument, { errorPolicy: "none" });
  const [getInviteLink, inviteLinkState] = useMutation(getWhatsappGroupInviteLinkMutationDocument, {
    errorPolicy: "none",
  });
  const [resetInviteLink, resetState] = useMutation(resetWhatsappGroupInviteLinkMutationDocument, {
    errorPolicy: "none",
  });
  const [approveJoinRequests] = useMutation(approveWhatsappGroupJoinRequestsMutationDocument, {
    errorPolicy: "none",
  });
  const [rejectJoinRequests] = useMutation(rejectWhatsappGroupJoinRequestsMutationDocument, {
    errorPolicy: "none",
  });
  const [removeParticipants, removeState] = useMutation(removeWhatsappGroupParticipantsMutationDocument, {
    errorPolicy: "none",
  });
  const [sendGroupMessage, sendState] = useMutation(sendWhatsappGroupMessageMutationDocument, {
    errorPolicy: "none",
  });
  const [pinMessage] = useMutation(pinWhatsappGroupMessageMutationDocument, { errorPolicy: "none" });
  const [unpinMessage] = useMutation(unpinWhatsappGroupMessageMutationDocument, { errorPolicy: "none" });

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

  const executeSync = useCallback(async () => {
    try {
      const result = await syncGroups({ variables: { accountId: accountId ?? null } });
      const count = result.data?.syncWhatsappGroups ?? 0;
      showNotice(withVar(labels.syncCompleted, "count", String(count)), "success");
      await groupsQuery.refetch();
    } catch (error) {
      showNotice(mapError(error, labels.errorGeneric, "WhatsApp groups sync failed"), "error");
    }
  }, [accountId, syncGroups, groupsQuery, labels.syncCompleted, labels.errorGeneric, showNotice]);

  const onSyncGroups = useCallback(() => {
    void executeSync();
  }, [executeSync]);

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

  // A cached invite link is advisory — when the group row carries none, the
  // current link is fetched from Meta through the invite-link mutation. The
  // timeout defers the fetch out of the render pass so no cascading render
  // is triggered synchronously.
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

  const onApproveJoinRequest = useCallback(
    (requestId: string) => {
      if (selectedGroupIdForActions === "") {
        return;
      }
      setJoinRequestBusyId(requestId);
      void approveJoinRequests({
        variables: { input: { groupId: selectedGroupIdForActions, joinRequestIds: [requestId] } },
      })
        .then(() => {
          showNotice(labels.approved, "success");
          return Promise.all([joinRequestsQuery.refetch(), groupQuery.refetch()]);
        })
        .catch((error: unknown) => {
          showNotice(mapError(error, labels.errorGeneric, "WhatsApp join request approve failed"), "error");
        })
        .finally(() => setJoinRequestBusyId(null));
    },
    [
      selectedGroupIdForActions,
      approveJoinRequests,
      joinRequestsQuery,
      groupQuery,
      labels.approved,
      labels.errorGeneric,
      showNotice,
    ]
  );

  const onRejectJoinRequest = useCallback(
    (requestId: string) => {
      if (selectedGroupIdForActions === "") {
        return;
      }
      setJoinRequestBusyId(requestId);
      void rejectJoinRequests({
        variables: { input: { groupId: selectedGroupIdForActions, joinRequestIds: [requestId] } },
      })
        .then(() => {
          showNotice(labels.rejected, "success");
          return Promise.all([joinRequestsQuery.refetch(), groupQuery.refetch()]);
        })
        .catch((error: unknown) => {
          showNotice(mapError(error, labels.errorGeneric, "WhatsApp join request reject failed"), "error");
        })
        .finally(() => setJoinRequestBusyId(null));
    },
    [
      selectedGroupIdForActions,
      rejectJoinRequests,
      joinRequestsQuery,
      groupQuery,
      labels.rejected,
      labels.errorGeneric,
      showNotice,
    ]
  );

  const onAskRemoveParticipant = useCallback(() => {
    setRemoveParticipantWaId("");
    setRemoveParticipantOpen(true);
  }, []);
  const onCloseRemoveParticipant = useCallback(() => setRemoveParticipantOpen(false), []);
  const removeParticipantValid = WA_ID_SHAPE.test(removeParticipantWaId);

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

  const onMessageDraftChange = useCallback((value: string) => {
    setMessageDraft(value);
    setMessageError(null);
  }, []);

  const sendDisabled = !canManage || messageDraft.trim() === "" || selectedGroupIdForActions === "";

  const executeSend = useCallback(async () => {
    if (sendDisabled) {
      return;
    }
    setMessageError(null);
    try {
      await sendGroupMessage({
        variables: {
          input: {
            groupId: selectedGroupIdForActions,
            body: messageDraft.trim(),
            previewUrl: null,
            templateName: null,
            templateLanguageCode: null,
            templateGroupIdParameter: null,
          },
        },
      });
      setMessageDraft("");
      await messagesQuery.refetch();
    } catch (error) {
      setMessageError(mapError(error, labels.errorGeneric, "WhatsApp group message send failed"));
    }
  }, [sendDisabled, selectedGroupIdForActions, messageDraft, sendGroupMessage, messagesQuery, labels.errorGeneric]);

  const onSendMessage = useCallback(() => {
    void executeSend();
  }, [executeSend]);

  const executePinToggle = useCallback(
    async (messageId: string, pinned: boolean) => {
      if (selectedGroupIdForActions === "") {
        return;
      }
      setPinningMessageId(messageId);
      try {
        if (pinned) {
          await unpinMessage({
            variables: {
              input: { groupId: selectedGroupIdForActions, messageId, operation: "unpin", expirationDays: null },
            },
          });
        } else {
          await pinMessage({
            variables: {
              input: {
                groupId: selectedGroupIdForActions,
                messageId,
                operation: "pin",
                expirationDays: PIN_EXPIRATION_DAYS,
              },
            },
          });
        }
        await messagesQuery.refetch();
      } catch (error) {
        showNotice(mapError(error, labels.errorGeneric, "WhatsApp message pin toggle failed"), "error");
      } finally {
        setPinningMessageId(null);
      }
    },
    [selectedGroupIdForActions, unpinMessage, pinMessage, messagesQuery, labels.errorGeneric, showNotice]
  );

  const onPinMessage = useCallback(
    (messageId: string) => {
      void executePinToggle(messageId, false);
    },
    [executePinToggle]
  );

  const onUnpinMessage = useCallback(
    (messageId: string) => {
      void executePinToggle(messageId, true);
    },
    [executePinToggle]
  );

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
      await groupsQuery.refetch();
    } catch (error) {
      showNotice(mapError(error, labels.errorGeneric, "WhatsApp group delete failed"), "error");
    }
  }, [selectedGroupIdForActions, deleteGroup, filters, groupsQuery, labels.errorGeneric, showNotice]);

  const onConfirmDeleteGroup = useCallback(() => {
    void executeDelete();
  }, [executeDelete]);

  return {
    labelsBySection: {
      shell: labels,
      list: labels,
      create: labels,
      detail: labels,
      messages: labels,
    },
    commonLabels,
    canManage,

    accounts,
    accountsLoading: accountsQuery.loading,
    accountId: filters.accountId,
    accountLabel,

    search: filters.search,
    onSearchChange: filters.onSearchChange,
    groups,
    groupsLoading: groupsQuery.loading,
    groupsError: groupsQuery.error !== undefined,
    groupsPage,
    groupsPageSize: PAGE_SIZE,
    groupsTotalCount: totalCount,
    onGroupsPageChange: filters.setPage,
    onRetryGroups: () => {
      void groupsQuery.refetch();
    },

    selectedGroupId: filters.selectedGroupId,
    onSelectGroup: filters.onSelectGroup,
    onCloseGroup: filters.onCloseGroup,
    selectedGroup,
    selectedGroupLoading: groupQuery.loading,
    selectedGroupError: groupQuery.error !== undefined,
    selectedGroupApprovalModeLabel,
    onRefreshGroup: () => {
      void groupQuery.refetch();
    },

    inviteLink: selectedGroup?.inviteLink ?? null,
    copied,
    onCopyInviteLink,
    resetOpen,
    resetting: resetState.loading,
    onAskResetInviteLink,
    onCloseReset,
    onConfirmResetInviteLink,

    groupMessages,
    messagesLoading: messagesQuery.loading,
    messagesError: messagesQuery.error !== undefined,
    messageDraft,
    onMessageDraftChange,
    sendDisabled,
    sending: sendState.loading,
    messageError,
    onSendMessage,
    onPinMessage,
    onUnpinMessage,
    pinningMessageId,

    joinRequests,
    joinRequestsLoading: joinRequestsQuery.loading,
    joinRequestsError: joinRequestsQuery.error !== undefined,
    joinRequestBusyId,
    onApproveJoinRequest,
    onRejectJoinRequest,

    removeParticipantWaId,
    onRemoveParticipantWaIdChange: setRemoveParticipantWaId,
    removeParticipantValid,
    removeParticipantOpen,
    removingParticipant: removeState.loading,
    onAskRemoveParticipant,
    onCloseRemoveParticipant,
    onConfirmRemoveParticipant,

    createOpen: createDialog.open,
    onOpenCreate: createDialog.openDialog,
    onCloseCreate: createDialog.closeDialog,
    createSubject: createDialog.subject,
    onCreateSubjectChange: createDialog.setSubject,
    createDescription: createDialog.description,
    onCreateDescriptionChange: createDialog.setDescription,
    createApprovalMode: createDialog.approvalMode,
    onCreateApprovalModeChange: createDialog.setApprovalMode,
    createSubmitDisabled: createDialog.subject.trim() === "" || createDialog.subject.trim().length > SUBJECT_MAX_LENGTH,
    creating: createState.loading,
    createError: createDialog.error,
    onSubmitCreate,

    syncing: syncState.loading,
    onSyncGroups,

    deleteOpen,
    deleting: deleteState.loading,
    onAskDeleteGroup,
    onCloseDelete,
    onConfirmDeleteGroup,

    notice: notice?.text ?? null,
    noticeSeverity: notice?.severity ?? "success",
    onDismissNotice: dismissNotice,

    formatTimestamp,
  };
}
