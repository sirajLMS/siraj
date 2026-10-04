"use client";

import { useMutation } from "@apollo/client/react";
import { useMemo } from "react";
import { WhatsappConversationSendMode } from "@/frontend/common/graphql/generated/gql/graphql";
import { sendWhatsappConversationMessageMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import type { WhatsappConversationRow } from "@/frontend/common/views/dashboard/whatsapp/conversations/types/whatsappConversationsView.types";
import { E164_SHAPE } from "@/frontend/common/views/dashboard/whatsapp/conversations/useWhatsappConversationsViewModel.constants";
import { mapSendError } from "@/frontend/common/views/dashboard/whatsapp/conversations/useWhatsappConversationsViewModel.errors";
import { digitsOnly } from "@/frontend/common/views/dashboard/whatsapp/conversations/useWhatsappConversationsViewModel.helpers";
import type {
  ComposerState,
  ConversationsFiltersState,
} from "@/frontend/common/views/dashboard/whatsapp/conversations/useWhatsappConversationsViewModel.state";
import type { ErrorsLabels } from "@/shared/locale/types/errors";

interface ConversationsSendStackParams {
  readonly errorLabels: ErrorsLabels;
  readonly canManage: boolean;
  readonly composer: ComposerState;
  readonly isTestAccount: boolean;
  readonly selectedAccount: { readonly id: string; readonly isActive: boolean } | null;
  readonly selectedConversation: WhatsappConversationRow | null;
}

/** Send-side derived state: target resolution and the blocking reason. */
export function useConversationsSendStack({
  errorLabels,
  canManage,
  composer,
  isTestAccount,
  selectedAccount,
  selectedConversation,
}: Readonly<ConversationsSendStackParams>) {
  const composerMode = composer.mode;

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

  return { composerMode, targetTo, sendBlockReason, sendDisabled };
}

interface ConversationsSendActionParams {
  readonly errorLabels: ErrorsLabels;
  readonly composer: ComposerState;
  readonly filters: ConversationsFiltersState;
  readonly selectedAccount: { readonly id: string } | null;
  readonly selectedConversation: WhatsappConversationRow | null;
  readonly conversationsRefetch: () => Promise<unknown>;
  readonly threadRefetch: () => Promise<unknown>;
  readonly composerMode: WhatsappConversationSendMode;
  readonly targetTo: string;
  readonly sendDisabled: boolean;
}

/** Fires the send mutation and re-anchors the workspace onto a new thread. */
export function useConversationsSendAction({
  errorLabels,
  composer,
  filters,
  selectedAccount,
  selectedConversation,
  conversationsRefetch,
  threadRefetch,
  composerMode,
  targetTo,
  sendDisabled,
}: Readonly<ConversationsSendActionParams>) {
  const [sendMessage, sendState] = useMutation(sendWhatsappConversationMessageMutationDocument, {
    errorPolicy: "none",
  });

  const onSend = async () => {
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
      await Promise.all([conversationsRefetch(), selectedConversation ? threadRefetch() : Promise.resolve()]);
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
  };

  return { sending: sendState.loading, onSend };
}
