/**
 * Composer-send helpers for the WhatsApp conversations service: thread
 * resolution, the Graph API send with Meta error-code translation, and the
 * outbound message persistence transaction body.
 */

import { WhatsappConversationRepository, WhatsappMessageRepository } from "@/backend/db/repo/whatsapp";
import { WhatsappConversationSendMode } from "@/backend/enum/whatsapp/whatsapp-conversations.enum";
import { WhatsappMessageDirection } from "@/backend/enum/whatsapp/whatsapp-inbox.enum";
import { DomainError, NotFoundError } from "@/backend/lib";
import {
  extractMetaErrorCode,
  GraphApiError,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.helpers";
import {
  buildSendTemplateMessageRequest,
  buildSendTextMessageRequest,
  parseSendTemplateResponse,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/requests";
import {
  auditChange,
  digitsOnly,
  type SendWhatsappConversationMessageInput,
} from "@/backend/services/whatsapp/whatsapp-conversations.helpers";
import { accountGraphContext, executeSendRequest } from "@/backend/services/whatsapp/whatsapp-graph.helpers";
import type {
  DBTransaction,
  SendTemplateMessageResult,
  WhatsappAccountSelectType,
  WhatsappConversationReturnType,
  WhatsappConversationSendInput,
  WhatsappConversationSendResult,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

/** Meta's "recipient not in allowed list" error code, returned by test numbers. */
const META_ERROR_RECIPIENT_NOT_IN_ALLOWED_LIST = 131030;
/** Meta's re-engagement error code: the 24h customer-service window closed before the send. */
const META_ERROR_RE_ENGAGEMENT_REQUIRED = 131047;
/** Meta's out-of-window variant on the send API: the 24h customer-service window closed before the send. */
const META_ERROR_OUTSIDE_SERVICE_WINDOW = 132047;
/** Meta's error code for a template send whose parameter component count differs from the template definition. */
const META_ERROR_TEMPLATE_PARAMS_MISMATCH = 132000;
/** Default template language for composer sends when the caller omits one. */
const DEFAULT_TEMPLATE_LANGUAGE = "en_US";

/** Display marker for a template send, shared by the bubble body and the conversation preview. */
function templateDisplayText(templateName: string): string {
  return `[template] ${templateName}`;
}

/**
 * Persisted content for a composer send. The inbox read path (thread panes,
 * conversation previews) reads the inner typed-object shape produced by
 * webhook ingest — a textual message is `{ body }` — so composer rows follow
 * the same contract rather than carrying the Meta request envelope.
 */
function composerMessageContent(
  mode: WhatsappConversationSendMode,
  body: string,
  templateName: string
): Record<string, unknown> {
  if (mode === WhatsappConversationSendMode.TEXT) {
    return { body };
  }
  return { body: templateDisplayText(templateName), name: templateName };
}

/**
 * Resolve the send's thread, tight-coupling conversation ownership to the
 * sending account. A caller-supplied `conversationId` must also name a
 * conversation whose peer `waId` matches the send target — otherwise a
 * template (window-exempt) send could be booked into an unrelated thread.
 */
export async function resolveSendConversation(
  accountId: string,
  input: WhatsappConversationSendInput,
  to: string,
  tErrors: ErrorsLabels,
  tx?: DBTransaction
): Promise<WhatsappConversationReturnType | null> {
  if (!input.conversationId) {
    return WhatsappConversationRepository.findByIdentity(accountId, { waId: to }, tx);
  }
  const conversation = await WhatsappConversationRepository.findById(input.conversationId, tx);
  if (conversation?.accountId !== accountId || digitsOnly(conversation.waId ?? "") !== to) {
    throw new NotFoundError("WHATSAPP_CONVERSATION", tErrors.notFound);
  }
  return conversation;
}

/**
 * Build + execute the Graph API send with the account's per-account
 * credentials, translating every failure: Meta's 131030 maps to the
 * recipient-allow-list error, 131047 and 132047 map to the
 * outside-service-window error, 132000 maps to the template-params-mismatch
 * error, and every other failure — other Graph API rejections, request-builder
 * validation errors, network/timeout failures — maps to the generic
 * send-failed error. Already-localized domain errors (e.g. the
 * missing-credentials config error) propagate unchanged.
 */
export async function dispatchSend(
  account: WhatsappAccountSelectType,
  input: WhatsappConversationSendInput,
  to: string,
  body: string,
  templateName: string,
  tErrors: ErrorsLabels
): Promise<SendTemplateMessageResult> {
  try {
    const ctx = await accountGraphContext(account, tErrors);
    const request =
      input.mode === WhatsappConversationSendMode.TEXT
        ? buildSendTextMessageRequest(ctx, { phoneNumberId: account.phoneNumberId, to, body })
        : buildSendTemplateMessageRequest(ctx, {
            phoneNumberId: account.phoneNumberId,
            to,
            templateName,
            languageCode: input.templateLanguage ?? DEFAULT_TEMPLATE_LANGUAGE,
          });
    return parseSendTemplateResponse(await executeSendRequest(request));
  } catch (error) {
    if (error instanceof DomainError) {
      throw error;
    }
    const metaCode = error instanceof GraphApiError ? extractMetaErrorCode(error.errorBody) : undefined;
    if (metaCode === META_ERROR_RECIPIENT_NOT_IN_ALLOWED_LIST) {
      throw new DomainError("WHATSAPP_RECIPIENT_NOT_ALLOWED", tErrors.whatsappRecipientNotAllowedFromMeta, {
        cause: error,
      });
    }
    if (metaCode === META_ERROR_OUTSIDE_SERVICE_WINDOW || metaCode === META_ERROR_RE_ENGAGEMENT_REQUIRED) {
      throw new DomainError("WHATSAPP_OUTSIDE_SERVICE_WINDOW", tErrors.whatsappOutsideServiceWindow, {
        cause: error,
      });
    }
    if (metaCode === META_ERROR_TEMPLATE_PARAMS_MISMATCH) {
      throw new DomainError("WHATSAPP_TEMPLATE_PARAMS_MISMATCH", tErrors.whatsappTemplateParamsMismatch, {
        cause: error,
      });
    }
    throw new DomainError("WHATSAPP_CONVERSATION_SEND_FAILED", tErrors.whatsappConversationSendFailed, {
      cause: error,
    });
  }
}

/**
 * Transaction body for an outbound composer send: upserts the thread (when the
 * send did not resolve one), persists the message idempotently by wamid, rolls
 * the conversation preview forward, and audits the send.
 */
export async function persistOutboundMessage(
  t: DBTransaction,
  deps: {
    conversation: WhatsappConversationReturnType | null;
    account: WhatsappAccountSelectType;
    input: SendWhatsappConversationMessageInput;
    body: string;
    templateName: string;
    result: SendTemplateMessageResult;
    sentAt: Date;
    to: string;
  }
): Promise<WhatsappConversationSendResult> {
  const { conversation, account, input, body, templateName, result, sentAt, to } = deps;
  const thread =
    conversation ??
    (await WhatsappConversationRepository.upsertByIdentity(
      { accountId: account.id, waId: result.recipientWaId || to },
      t
    ));
  const message = await WhatsappMessageRepository.upsertByWamid(
    {
      conversationId: thread.id,
      accountId: account.id,
      wamid: result.providerMessageId,
      direction: WhatsappMessageDirection.API_OUTBOUND,
      type: input.mode === WhatsappConversationSendMode.TEXT ? "text" : "template",
      content: composerMessageContent(input.mode, body, templateName),
      status: "sent",
      mediaPlaceholder: false,
      mediaId: null,
      mediaMime: null,
      mediaSha256: null,
      phase: null,
      chunkOrder: null,
      sentAt,
      editedAt: null,
      revokedAt: null,
    },
    t
  );
  await WhatsappConversationRepository.touchLastMessage(
    thread.id,
    {
      at: sentAt,
      preview: (input.mode === WhatsappConversationSendMode.TEXT ? body : templateDisplayText(templateName)).slice(
        0,
        140
      ),
    },
    t
  );
  await auditChange(
    input.actorUserId,
    "CREATE",
    account.id,
    {
      description: "whatsapp-conversation message sent",
      newState: { to, mode: input.mode },
      metadata: { messageId: message.id, wamid: result.providerMessageId, conversationId: thread.id },
    },
    t
  );
  return { message };
}
