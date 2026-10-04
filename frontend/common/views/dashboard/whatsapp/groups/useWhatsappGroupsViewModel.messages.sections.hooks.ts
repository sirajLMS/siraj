"use client";

import { useMutation } from "@apollo/client/react";
import { useCallback, useMemo, useState } from "react";
import {
  pinWhatsappGroupMessageMutationDocument,
  sendWhatsappGroupMessageMutationDocument,
  unpinWhatsappGroupMessageMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { PIN_EXPIRATION_DAYS } from "@/frontend/common/views/dashboard/whatsapp/groups/useWhatsappGroupsViewModel.constants";
import {
  isMessageRow,
  mapError,
} from "@/frontend/common/views/dashboard/whatsapp/groups/useWhatsappGroupsViewModel.helpers";
import type {
  NoticeState,
  WorkspaceFilters,
  WorkspaceQueries,
} from "@/frontend/common/views/dashboard/whatsapp/groups/useWhatsappGroupsViewModel.hooks";
import type { WhatsappGroupsLabels } from "@/shared/locale/types/whatsappGroups";

interface MessagePinActionsDeps {
  readonly selectedGroupIdForActions: string;
  readonly messagesQuery: WorkspaceQueries["messagesQuery"];
  readonly labels: WhatsappGroupsLabels;
  readonly showNotice: NoticeState["showNotice"];
}

function useMessagePinActions({ selectedGroupIdForActions, messagesQuery, labels, showNotice }: MessagePinActionsDeps) {
  const [pinningMessageId, setPinningMessageId] = useState<string | null>(null);
  const [pinMessage] = useMutation(pinWhatsappGroupMessageMutationDocument, { errorPolicy: "none" });
  const [unpinMessage] = useMutation(unpinWhatsappGroupMessageMutationDocument, { errorPolicy: "none" });

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

  return { pinningMessageId, onPinMessage, onUnpinMessage };
}

interface GroupMessagesSectionDeps {
  readonly queries: WorkspaceQueries;
  readonly filters: WorkspaceFilters;
  readonly canManage: boolean;
  readonly labels: WhatsappGroupsLabels;
  readonly showNotice: NoticeState["showNotice"];
}

function useGroupMessagesSection({ queries, filters, canManage, labels, showNotice }: GroupMessagesSectionDeps) {
  const { messagesQuery } = queries;
  const [messageDraft, setMessageDraft] = useState("");
  const [messageError, setMessageError] = useState<string | null>(null);
  const [sendGroupMessage, sendState] = useMutation(sendWhatsappGroupMessageMutationDocument, {
    errorPolicy: "none",
  });
  const selectedGroupIdForActions = filters.selectedGroupId ?? "";

  const groupMessages = useMemo(
    () => (messagesQuery.data?.whatsappGroupMessages?.rows ?? []).filter(isMessageRow),
    [messagesQuery.data]
  );

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

  const pin = useMessagePinActions({ selectedGroupIdForActions, messagesQuery, labels, showNotice });

  return {
    slice: {
      groupMessages,
      messagesLoading: messagesQuery.loading,
      messagesError: messagesQuery.error !== undefined,
      messageDraft,
      onMessageDraftChange,
      sendDisabled,
      sending: sendState.loading,
      messageError,
      onSendMessage,
      onPinMessage: pin.onPinMessage,
      onUnpinMessage: pin.onUnpinMessage,
      pinningMessageId: pin.pinningMessageId,
    },
  };
}

export { useGroupMessagesSection };
