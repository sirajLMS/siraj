"use client";

import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  AppPermission,
  type WhatsappAccountsQuery,
  WhatsappConversationSendMode,
  type WhatsappConversationsListQuery,
  WhatsappMessageDirection,
  WhatsappTemplateStatus,
  WhatsappTestRecipientStatus,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  addWhatsappTestRecipientMutationDocument,
  removeWhatsappTestRecipientMutationDocument,
  sendWhatsappConversationMessageMutationDocument,
  verifyWhatsappTestRecipientMutationDocument,
  whatsappAccountsQueryDocument,
  whatsappAccountTemplatesQueryDocument,
  whatsappConversationsListQueryDocument,
  whatsappConversationThreadQueryDocument,
  whatsappTestRecipientsQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import type {
  WhatsappConversationRow,
  WhatsappConversationsAccountOption,
  WhatsappConversationsLabelsBySection,
  WhatsappConversationsViewModel,
  WhatsappMessageRow,
  WhatsappRecipientViewRow,
  WhatsappTemplateOption,
  WhatsappTestRecipientRow,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/types/whatsappConversationsView.types";
import { Translation, useAppTranslation } from "@/shared/locale";
import { useAppLocale } from "@/shared/locale/localeContext";
import type { ErrorsLabels } from "@/shared/locale/types/errors";

const PAGE_SIZE = 20;
const THREAD_PAGE_SIZE = 50;
const POLL_INTERVAL_MS = 30_000;
const SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;
const RECIPIENT_LIMIT = 5;
const E164_SHAPE = /^\+\d{8,15}$/;

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

/** Normalizes an E.164 value to Meta's digits-only wire form. */
function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** True when the tab is hidden; polling pauses and Apollo resumes it on return. */
function useDocumentHidden(): boolean {
  return useSyncExternalStore(
    onStoreChange => {
      document.addEventListener("visibilitychange", onStoreChange);
      return () => document.removeEventListener("visibilitychange", onStoreChange);
    },
    () => document.hidden,
    () => false
  );
}

/**
 * Render-safe "now" for service-window math — a mount-time snapshot is the
 * lint-sanctioned pattern (Date.now() during render trips the purity rule).
 * The 30s poll keeps the underlying latest-inbound timestamp fresh; Meta
 * remains the authoritative gate and rejects an actually-closed window with
 * WHATSAPP_OUTSIDE_SERVICE_WINDOW, which is mapped below.
 */
function useRenderTimeSnapshot(): number {
  const [snapshot] = useState(() => Date.now());
  return snapshot;
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
  const options: WhatsappConversationsAccountOption[] = [];
  for (const row of rows ?? []) {
    if (row.id) {
      options.push({
        id: row.id,
        label: resolveAccountLabel(row, locale),
        isActive: row.isActive ?? false,
        isTestNumber: row.isTestNumber ?? false,
      });
    }
  }
  return options;
}

function isConversationRow(row: { id: string | null }): row is WhatsappConversationRow {
  return row.id !== null;
}

function isMessageRow(row: { id: string | null }): row is WhatsappMessageRow {
  return row.id !== null;
}

function isRecipientRow(row: { id: string | null }): row is WhatsappTestRecipientRow {
  return row.id !== null;
}

/**
 * Service-level domain errors reach the client with an already-localized
 * message on the GraphQL error; codes select the dedicated translated string
 * first, then the localized server message, then the generic fallback.
 */
function graphqlErrorCode(error: unknown): string | null {
  if (!CombinedGraphQLErrors.is(error)) {
    return null;
  }
  const code: unknown = error.errors[0]?.extensions?.code;
  return typeof code === "string" ? code : null;
}

function localizedServerMessage(error: unknown): string | null {
  if (!CombinedGraphQLErrors.is(error)) {
    return null;
  }
  const message = error.errors[0]?.message;
  return typeof message === "string" && message !== "" ? message : null;
}

function mapDomainError(
  error: unknown,
  table: Record<string, (labels: ErrorsLabels) => string>,
  labels: ErrorsLabels,
  fallback: string,
  logContext: string
): string {
  const code = graphqlErrorCode(error);
  if (code !== null) {
    const resolve = table[code];
    if (resolve) {
      return resolve(labels);
    }
  }
  const serverMessage = localizedServerMessage(error);
  if (serverMessage !== null) {
    return serverMessage;
  }
  logger.warn(logContext, { message: error instanceof Error ? error.message : String(error) });
  return fallback;
}

/** Translated copy for send failures keyed by DomainError extensions.code. */
function mapSendError(error: unknown, labels: ErrorsLabels): string {
  return mapDomainError(
    error,
    {
      WHATSAPP_RECIPIENT_NOT_ALLOWED: l => l.whatsappRecipientNotAllowed,
      WHATSAPP_OUTSIDE_SERVICE_WINDOW: l => l.whatsappOutsideServiceWindow,
      WHATSAPP_TEMPLATE_REQUIRED: l => l.whatsappTemplateRequired,
      WHATSAPP_MESSAGE_REQUIRED: l => l.whatsappMessageRequired,
      WHATSAPP_TEMPLATES_FETCH_FAILED: l => l.whatsappTemplatesFetchFailed,
      WHATSAPP_TEMPLATE_PARAMS_MISMATCH: l => l.whatsappTemplateParamsMismatch,
    },
    labels,
    labels.whatsappConversationSendFailed,
    "WhatsApp conversation send failed"
  );
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
  data: WhatsappConversationsListQuery | undefined,
  requestedPage: number,
  setPage: (page: number) => void,
  noteTotalCount: (totalCount: number) => void
) {
  useEffect(() => {
    const totalCount = data?.whatsappConversationThreads?.totalCount;
    if (totalCount === null || totalCount === undefined) {
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
 * Polling interval for the list/thread: paused while the tab is hidden.
 * Thread fetching skips until a conversation is open.
 */
function useWorkspaceQueries(accountId: string | null, page: number, selectedConversationId: string | null) {
  const hidden = useDocumentHidden();
  const pollInterval = hidden ? 0 : POLL_INTERVAL_MS;
  const accountsQuery = useQuery(whatsappAccountsQueryDocument);
  const conversationsQuery = useQuery(whatsappConversationsListQueryDocument, {
    variables: { accountId, pagination: buildPaginationArgs(page, PAGE_SIZE) },
    pollInterval,
    fetchPolicy: "cache-and-network",
  });
  const threadQuery = useQuery(whatsappConversationThreadQueryDocument, {
    variables: { id: selectedConversationId ?? "", pagination: buildPaginationArgs(0, THREAD_PAGE_SIZE) },
    skip: selectedConversationId === null,
    pollInterval,
    fetchPolicy: "cache-and-network",
  });
  return { accountsQuery, conversationsQuery, threadQuery };
}

function useSelectionFilters() {
  const [accountId, setAccountIdState] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [initiating, setInitiating] = useState(false);

  const onAccountChange = useCallback((nextAccountId: string) => {
    setAccountIdState(nextAccountId);
    setSearch("");
    setPage(0);
    setSelectedConversationId(null);
    setInitiating(false);
  }, []);
  const onSearchChange = useCallback((value: string) => setSearch(value), []);
  const onSelectConversation = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId);
    setInitiating(false);
  }, []);
  const onCloseThread = useCallback(() => setSelectedConversationId(null), []);

  return {
    accountId,
    setAccountId: setAccountIdState,
    search,
    page,
    setPage,
    selectedConversationId,
    setSelectedConversationId,
    initiating,
    setInitiating,
    onAccountChange,
    onSearchChange,
    onSelectConversation,
    onCloseThread,
  };
}

function useComposerState() {
  const [mode, setModeState] = useState<WhatsappConversationSendMode>(WhatsappConversationSendMode.Text);
  const [textBody, setTextBody] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templateLanguage, setTemplateLanguage] = useState("");
  const [recipientSelection, setRecipientSelection] = useState("");
  const [customRecipient, setCustomRecipient] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);

  const resetComposer = useCallback(() => {
    setModeState(WhatsappConversationSendMode.Text);
    setTextBody("");
    setTemplateName("");
    setTemplateLanguage("");
    setRecipientSelection("");
    setCustomRecipient("");
    setSendError(null);
  }, []);

  return {
    mode,
    onModeChange: setModeState,
    textBody,
    setTextBody,
    templateName,
    setTemplateName,
    templateLanguage,
    setTemplateLanguage,
    recipientSelection,
    setRecipientSelection,
    customRecipient,
    setCustomRecipient,
    sendError,
    setSendError,
    resetComposer,
  };
}

function useRecipientDialogs() {
  const [addOpen, setAddOpen] = useState(false);
  const [addPhone, setAddPhone] = useState("");
  const [addNote, setAddNote] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<WhatsappRecipientViewRow | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const openAdd = useCallback(() => {
    setAddPhone("");
    setAddNote("");
    setAddError(null);
    setAddOpen(true);
  }, []);
  const closeAdd = useCallback(() => setAddOpen(false), []);

  return {
    addOpen,
    addPhone,
    setAddPhone,
    addNote,
    setAddNote,
    addError,
    setAddError,
    removeTarget,
    setRemoveTarget,
    notice,
    setNotice,
    verifyingId,
    setVerifyingId,
    openAdd,
    closeAdd,
  };
}

function buildRecipientViewRow(
  row: WhatsappTestRecipientRow,
  labels: Record<
    "recipientStatusAllowed" | "recipientStatusPending" | "recipientLastChecked" | "recipientErrorCode",
    string
  >,
  formatTimestamp: (iso: string | null) => string
): WhatsappRecipientViewRow {
  const status = row.status ?? WhatsappTestRecipientStatus.Pending;
  const allowed = status === WhatsappTestRecipientStatus.Allowed;
  return {
    id: row.id,
    phoneNumber: row.phoneNumber ?? "",
    note: row.note ?? null,
    status,
    statusLabel: allowed ? labels.recipientStatusAllowed : labels.recipientStatusPending,
    statusBadgeStatus: allowed ? "completed" : "pending",
    lastCheckedText: row.lastCheckedAt
      ? withVar(labels.recipientLastChecked, "date", formatTimestamp(row.lastCheckedAt))
      : null,
    errorText: row.lastErrorCode ? withVar(labels.recipientErrorCode, "code", row.lastErrorCode) : null,
  };
}

function formatWindowRemaining(remainingMs: number, locale: string): string {
  const totalMinutes = Math.max(1, Math.ceil(remainingMs / 60_000));
  const formatter = new Intl.RelativeTimeFormat(locale === "ar" ? "ar" : "en", { numeric: "always" });
  if (totalMinutes >= 60) {
    return formatter.format(Math.ceil(totalMinutes / 60), "hour");
  }
  return formatter.format(totalMinutes, "minute");
}

export function useWhatsappConversationsViewModel(): WhatsappConversationsViewModel {
  const labels = useAppTranslation(Translation.WhatsappConversations);
  const inboxLabels = useAppTranslation(Translation.WhatsappInbox);
  const errorLabels = useAppTranslation(Translation.Errors);
  const locale = useAppLocale();
  const hasPermission = useUserStore(state => state.hasPermission);
  const canManage = hasPermission(AppPermission.WhatsappConversationsManage);

  const filters = useSelectionFilters();
  const composer = useComposerState();
  const dialogs = useRecipientDialogs();
  const [serverTotalCount, setServerTotalCount] = useState<number | null>(null);

  const resetComposer = composer.resetComposer;
  const clearNotice = dialogs.setNotice;
  /** Composer + registry notice reset performed whenever the number changes. */
  const resetForAccountSwitch = useCallback(() => {
    resetComposer();
    clearNotice(null);
  }, [resetComposer, clearNotice]);

  const baseOnAccountChange = filters.onAccountChange;
  const onAccountChange = useCallback(
    (nextAccountId: string) => {
      baseOnAccountChange(nextAccountId);
      resetForAccountSwitch();
    },
    [baseOnAccountChange, resetForAccountSwitch]
  );
  const { accountsQuery, conversationsQuery, threadQuery } = useWorkspaceQueries(
    filters.accountId,
    resolveListQueryPage(filters.page, serverTotalCount),
    filters.selectedConversationId
  );

  const accounts = useMemo(
    () => buildAccountOptions(accountsQuery.data?.whatsappAccounts ?? null, locale),
    [accountsQuery.data, locale]
  );

  const selectedAccount = useMemo(
    () => accounts.find(option => option.id === filters.accountId) ?? null,
    [accounts, filters.accountId]
  );

  // Default to the first connected number once accounts resolve; re-anchor if
  // the selected number disappears from the list (sync/deactivation).
  const selectAccount = filters.setAccountId;
  useEffect(() => {
    const first = accounts[0];
    if (first && (filters.accountId === null || !accounts.some(o => o.id === filters.accountId))) {
      if (filters.accountId !== null) {
        resetForAccountSwitch();
      }
      selectAccount(first.id);
    }
  }, [accounts, filters.accountId, selectAccount, resetForAccountSwitch]);

  const selectedConversationId = filters.selectedConversationId;
  const pageRows = useMemo(
    () => (conversationsQuery.data?.whatsappConversationThreads?.rows ?? []).filter(isConversationRow),
    [conversationsQuery.data]
  );
  const conversations = useMemo(() => {
    const needle = filters.search.trim().toLowerCase();
    if (!needle) {
      return pageRows;
    }
    return pageRows.filter(row =>
      [row.displayName, row.username, row.waId, row.lastMessagePreview].some(field =>
        field ? field.toLowerCase().includes(needle) : false
      )
    );
  }, [pageRows, filters.search]);

  const totalCount = conversationsQuery.data?.whatsappConversationThreads?.totalCount ?? 0;
  const lastPage = Math.max(0, Math.ceil(totalCount / PAGE_SIZE) - 1);
  const conversationsPage = Math.min(filters.page, lastPage);
  useSyncListPage(conversationsQuery.data, filters.page, filters.setPage, setServerTotalCount);

  const selectedConversation = useMemo(
    () => pageRows.find(row => row.id === selectedConversationId) ?? null,
    [pageRows, selectedConversationId]
  );

  const threadMessages = useMemo(
    () => (threadQuery.data?.whatsappConversationThread?.messages?.rows ?? []).filter(isMessageRow),
    [threadQuery.data]
  );

  const formatTimestamp = useCallback(
    (iso: string | null) => {
      if (!iso) {
        return "";
      }
      return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(iso));
    },
    [locale]
  );

  const latestInboundMs = useMemo(() => {
    let latest: number | null = null;
    for (const message of threadMessages) {
      if (message.direction === WhatsappMessageDirection.Inbound && message.sentAt) {
        const time = new Date(message.sentAt).getTime();
        if (Number.isFinite(time) && (latest === null || time > latest)) {
          latest = time;
        }
      }
    }
    return latest;
  }, [threadMessages]);

  const nowMs = useRenderTimeSnapshot();

  const windowRemainingMs = latestInboundMs !== null ? latestInboundMs + SERVICE_WINDOW_MS - nowMs : 0;
  const windowOpen = selectedConversation !== null && windowRemainingMs > 0;

  const windowStatusHint = useMemo(() => {
    if (!selectedConversation) {
      return "";
    }
    if (windowOpen) {
      return withVar(labels.windowOpenHint, "duration", formatWindowRemaining(windowRemainingMs, locale));
    }
    return labels.windowClosedHint;
  }, [selectedConversation, windowOpen, windowRemainingMs, labels, locale]);

  const threadLastActivityText = selectedConversation?.lastMessageAt
    ? withVar(labels.lastMessageAt, "date", formatTimestamp(selectedConversation.lastMessageAt))
    : "";

  const isTestAccount = selectedAccount?.isTestNumber ?? false;

  const recipientsQuery = useQuery(whatsappTestRecipientsQueryDocument, {
    variables: { accountId: selectedAccount?.id ?? "" },
    skip: !isTestAccount || !selectedAccount,
    fetchPolicy: "cache-and-network",
  });

  const recipientRows = useMemo(
    () =>
      (recipientsQuery.data?.whatsappTestRecipients ?? [])
        .filter(isRecipientRow)
        .map(row => buildRecipientViewRow(row, labels, formatTimestamp)),
    [recipientsQuery.data, labels, formatTimestamp]
  );
  const registryTargetPhones = useMemo(() => recipientRows.map(row => row.phoneNumber), [recipientRows]);
  const showRecipientPicker = selectedConversation === null;

  const templatesQuery = useQuery(whatsappAccountTemplatesQueryDocument, {
    variables: { accountId: selectedAccount?.id ?? "" },
    skip: !selectedAccount,
    fetchPolicy: "cache-and-network",
  });

  const templateOptions = useMemo<WhatsappTemplateOption[]>(
    () =>
      (templatesQuery.data?.whatsappAccountTemplates ?? [])
        .filter(row => row.status === WhatsappTemplateStatus.Approved)
        .map(row => ({
          key: `${row.name ?? ""}|${row.language ?? ""}`,
          name: row.name ?? "",
          language: row.language ?? "",
          category: row.category ?? null,
          bodyText: row.bodyText ?? "",
          paramsCount: row.bodyParamsCount ?? 0,
        })),
    [templatesQuery.data]
  );

  const onTemplateSelect = useCallback(
    (option: WhatsappTemplateOption | null) => {
      composer.setTemplateName(option?.name ?? "");
      composer.setTemplateLanguage(option?.language ?? "");
    },
    [composer]
  );

  const onRetryTemplates = useCallback(() => {
    void templatesQuery.refetch();
  }, [templatesQuery]);

  // Initiation defaults to template mode (a brand-new thread has no open 24h
  // window), but the text toggle stays switchable: the window state is
  // advisory only and Meta is the authoritative gate.
  const composerMode = composer.mode;
  const onComposerModeChange = composer.onModeChange;
  const onStartNewConversation = useCallback(() => {
    filters.onCloseThread();
    filters.setInitiating(true);
    composer.resetComposer();
    composer.onModeChange(WhatsappConversationSendMode.Template);
  }, [filters, composer]);

  const targetTo = useMemo(() => {
    if (selectedConversation) {
      return selectedConversation.waId ?? "";
    }
    if (isTestAccount) {
      return composer.recipientSelection;
    }
    // The phone input emits E.164; anything off-shape is not sendable.
    return E164_SHAPE.test(composer.customRecipient) ? digitsOnly(composer.customRecipient) : "";
  }, [selectedConversation, isTestAccount, composer.recipientSelection, composer.customRecipient]);

  const sendBlockReason = useMemo(() => {
    if (!canManage || !selectedAccount) {
      return null;
    }
    if (!selectedAccount.isActive) {
      return errorLabels.whatsappAccountOffboarded;
    }
    // Window state stays advisory: Meta is the authoritative gate and reports
    // WHATSAPP_OUTSIDE_SERVICE_WINDOW on send; only empty payloads block here.
    if (composerMode === WhatsappConversationSendMode.Text) {
      return composer.textBody.trim() === "" ? errorLabels.whatsappMessageRequired : null;
    }
    return composer.templateName.trim() === "" ? errorLabels.whatsappTemplateRequired : null;
  }, [canManage, selectedAccount, composerMode, composer.textBody, composer.templateName, errorLabels]);

  const sendDisabled = !canManage || !selectedAccount || targetTo === "" || sendBlockReason !== null;

  const [sendMessage, sendState] = useMutation(sendWhatsappConversationMessageMutationDocument, {
    errorPolicy: "none",
  });
  const [addRecipient, addState] = useMutation(addWhatsappTestRecipientMutationDocument, { errorPolicy: "none" });
  const [removeRecipient, removeState] = useMutation(removeWhatsappTestRecipientMutationDocument, {
    errorPolicy: "none",
  });
  const [verifyRecipient] = useMutation(verifyWhatsappTestRecipientMutationDocument, { errorPolicy: "none" });

  const labelsBySection: WhatsappConversationsLabelsBySection = useMemo(
    () => ({
      shell: labels,
      list: labels,
      thread: labels,
      composer: labels,
      banner: labels,
      recipients: labels,
    }),
    [labels]
  );

  const executeSend = useCallback(async () => {
    if (!selectedAccount || sendDisabled) {
      return;
    }
    const isTextMode = composerMode === WhatsappConversationSendMode.Text;
    const initiating = selectedConversation === null;
    const templateLanguage = composer.templateLanguage.trim();
    composer.setSendError(null);
    try {
      const result = await sendMessage({
        variables: {
          input: {
            accountId: selectedAccount.id,
            conversationId: selectedConversation?.id ?? null,
            to: targetTo,
            mode: composerMode,
            templateName: isTextMode ? null : composer.templateName.trim(),
            templateLanguage: templateLanguage === "" ? null : templateLanguage,
            body: isTextMode ? composer.textBody.trim() : null,
          },
        },
      });
      composer.setTextBody("");
      await Promise.all([
        conversationsQuery.refetch(),
        selectedConversation ? threadQuery.refetch() : Promise.resolve(),
      ]);
      // The service upserts the thread for a brand-new target; the returned
      // message carries its conversation id, so the workspace can select it.
      const newConversationId = initiating
        ? (result.data?.sendWhatsappConversationMessage?.message?.conversationId ?? null)
        : null;
      if (newConversationId) {
        filters.onSelectConversation(newConversationId);
      }
    } catch (error) {
      composer.setSendError(mapSendError(error, errorLabels));
    }
  }, [
    selectedAccount,
    sendDisabled,
    composer,
    composerMode,
    selectedConversation,
    targetTo,
    sendMessage,
    conversationsQuery,
    threadQuery,
    filters,
    errorLabels,
  ]);

  const onSend = useCallback(() => {
    void executeSend();
  }, [executeSend]);

  const executeAddRecipient = useCallback(async () => {
    if (!selectedAccount) {
      return;
    }
    dialogs.setAddError(null);
    try {
      await addRecipient({
        variables: {
          input: {
            accountId: selectedAccount.id,
            phoneNumber: digitsOnly(dialogs.addPhone),
            note: dialogs.addNote.trim() === "" ? null : dialogs.addNote.trim(),
          },
        },
      });
      dialogs.closeAdd();
      await recipientsQuery.refetch();
    } catch (error) {
      dialogs.setAddError(
        mapDomainError(
          error,
          {
            WHATSAPP_RECIPIENT_LIMIT_REACHED: l => l.whatsappRecipientLimitReached,
            WHATSAPP_RECIPIENT_CONFLICT: l => l.whatsappRecipientConflict,
          },
          errorLabels,
          labels.recipientAddFailed,
          "WhatsApp test recipient add failed"
        )
      );
    }
  }, [selectedAccount, dialogs, addRecipient, recipientsQuery, errorLabels, labels]);

  const onSubmitAddRecipient = useCallback(() => {
    void executeAddRecipient();
  }, [executeAddRecipient]);

  const executeRemoveRecipient = useCallback(async () => {
    const target = dialogs.removeTarget;
    if (!target) {
      return;
    }
    try {
      await removeRecipient({ variables: { recipientId: target.id } });
      dialogs.setRemoveTarget(null);
      await recipientsQuery.refetch();
    } catch (error) {
      dialogs.setNotice(mapSendError(error, errorLabels));
    }
  }, [dialogs, removeRecipient, recipientsQuery, errorLabels]);

  const onConfirmRemoveRecipient = useCallback(() => {
    void executeRemoveRecipient();
  }, [executeRemoveRecipient]);

  const executeVerifyRecipient = useCallback(
    async (recipientId: string) => {
      dialogs.setVerifyingId(recipientId);
      dialogs.setNotice(null);
      try {
        await verifyRecipient({ variables: { recipientId } });
        await recipientsQuery.refetch();
      } catch (error) {
        dialogs.setNotice(mapSendError(error, errorLabels));
      } finally {
        dialogs.setVerifyingId(null);
      }
    },
    [dialogs, verifyRecipient, recipientsQuery, errorLabels]
  );

  const onVerifyRecipient = useCallback(
    (recipientId: string) => {
      void executeVerifyRecipient(recipientId);
    },
    [executeVerifyRecipient]
  );

  const addRecipientPhoneValid = E164_SHAPE.test(dialogs.addPhone);

  const onAskRemoveRecipient = useCallback(
    (recipientId: string) => {
      const target = recipientRows.find(row => row.id === recipientId) ?? null;
      dialogs.setRemoveTarget(target);
    },
    [recipientRows, dialogs]
  );

  const onCloseRemoveRecipient = useCallback(() => dialogs.setRemoveTarget(null), [dialogs]);

  const removeRecipientConfirmText = dialogs.removeTarget
    ? withVar(labels.removeRecipientConfirm, "phone", dialogs.removeTarget.phoneNumber)
    : "";

  const accountLabel = useCallback(
    (accountId: string | null) => accounts.find(option => option.id === accountId)?.label ?? null,
    [accounts]
  );
  const accountIsTestNumber = useCallback(
    (accountId: string | null) => accounts.find(option => option.id === accountId)?.isTestNumber ?? false,
    [accounts]
  );

  const onRetryConversations = useCallback(() => {
    void conversationsQuery.refetch();
  }, [conversationsQuery]);

  return {
    labelsBySection,
    inboxLabels,
    canManage,
    accounts,
    accountsLoading: accountsQuery.loading,
    accountId: filters.accountId,
    selectedAccount,
    onAccountChange,
    search: filters.search,
    onSearchChange: filters.onSearchChange,
    conversations,
    conversationsLoading: conversationsQuery.loading,
    conversationsError: conversationsQuery.error !== undefined,
    conversationsPage,
    conversationsPageSize: PAGE_SIZE,
    conversationsTotalCount: totalCount,
    onConversationsPageChange: filters.setPage,
    onRetryConversations,
    selectedConversation,
    onSelectConversation: filters.onSelectConversation,
    onCloseThread: filters.onCloseThread,
    isInitiating: filters.initiating,
    onStartNewConversation,
    threadMessages,
    threadLoading: threadQuery.loading,
    threadError: threadQuery.error !== undefined,
    threadLastActivityText,
    composerMode,
    onComposerModeChange,
    textBody: composer.textBody,
    onTextBodyChange: composer.setTextBody,
    templateName: composer.templateName,
    onTemplateNameChange: composer.setTemplateName,
    templateLanguage: composer.templateLanguage,
    onTemplateLanguageChange: composer.setTemplateLanguage,
    templateOptions,
    templatesLoading: templatesQuery.loading,
    templatesError: templatesQuery.error !== undefined,
    onRetryTemplates,
    onTemplateSelect,
    templateParamsUnsupportedText: labels.templatePickerParamsUnsupported,
    showRecipientPicker,
    registryTargetOnly: isTestAccount,
    registryTargetPhones,
    recipientSelection: composer.recipientSelection,
    onRecipientSelectionChange: composer.setRecipientSelection,
    customRecipient: composer.customRecipient,
    onCustomRecipientChange: composer.setCustomRecipient,
    windowOpen,
    windowStatusHint,
    sendBlockReason,
    sendDisabled,
    sendError: composer.sendError,
    sending: sendState.loading,
    onSend,
    isTestAccount,
    recipientRows,
    recipientsLoading: isTestAccount && recipientsQuery.loading,
    recipientLimitReached: recipientRows.length >= RECIPIENT_LIMIT,
    recipientsNotice: dialogs.notice,
    addRecipientOpen: dialogs.addOpen,
    addRecipientPhone: dialogs.addPhone,
    addRecipientPhoneValid,
    addRecipientNote: dialogs.addNote,
    addRecipientError: dialogs.addError,
    registryBusy: addState.loading || removeState.loading,
    removeDialogRecipient: dialogs.removeTarget,
    removeRecipientConfirmText,
    verifyingRecipientId: dialogs.verifyingId,
    onOpenAddRecipient: dialogs.openAdd,
    onCloseAddRecipient: dialogs.closeAdd,
    onAddRecipientPhoneChange: dialogs.setAddPhone,
    onAddRecipientNoteChange: dialogs.setAddNote,
    onSubmitAddRecipient,
    onAskRemoveRecipient,
    onCloseRemoveRecipient,
    onConfirmRemoveRecipient,
    onVerifyRecipient,
    formatTimestamp,
    accountLabel,
    accountIsTestNumber,
  };
}
