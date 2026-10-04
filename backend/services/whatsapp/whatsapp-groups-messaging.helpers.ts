/**
 * Messaging operation bodies for the WhatsApp groups service
 * (`whatsapp-groups.service.ts`): group sends and message pin/unpin. Each
 * exported function here implements one `WhatsappGroupsService` entry point,
 * including its permission gate.
 */

import { db } from "@/backend/db/drizzleDb";
import { WhatsappGroupMessageRepository } from "@/backend/db/repo/whatsapp";
import { WhatsappMessageDirection } from "@/backend/enum/whatsapp/whatsapp-inbox.enum";
import { ValidationError } from "@/backend/lib";
import {
  buildPinGroupMessageRequest,
  buildSendGroupMessageRequest,
  parsePinGroupMessageResponse,
  parseSendGroupMessageResponse,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/requests";
import { accountGraphContext, executeGraphApiCall } from "@/backend/services/whatsapp/whatsapp-graph.helpers";
import {
  assertCanManageGroups,
  type GroupGraphScope,
  ONE_DAY_MS,
  requireAccount,
  requireGroup,
  requirePinExpirationDays,
  runGroupGraphCall,
  translateGroupGraphError,
} from "@/backend/services/whatsapp/whatsapp-groups.helpers";
import type {
  DBTransaction,
  GroupMessageSendResult,
  SendGroupMessageInput,
  SendTemplateMessageResponseBody,
  UnpinWhatsappGroupMessageInput,
  UserPermissionContext,
  WhatsappGroupPinInput,
  WhatsappGroupSendInput,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

/**
 * Send a message to a group from the owning account: resolve mode from the
 * payload (template name → template send, otherwise free text), dispatch via
 * Meta, then persist the message as API_OUTBOUND (idempotent via wamid).
 */
export async function sendGroupMessage(
  context: UserPermissionContext,
  tErrors: ErrorsLabels,
  input: WhatsappGroupSendInput,
  tx?: DBTransaction
): Promise<GroupMessageSendResult> {
  await assertCanManageGroups(context, tErrors);
  const group = await requireGroup(input.groupId, tErrors, tx);
  const account = await requireAccount(group.accountId, tErrors, tx);
  const isTemplate = input.templateName !== undefined && input.templateName.length > 0;
  const body = (input.text?.body ?? "").trim();
  const templateLanguageCode = isTemplate ? (input.templateLanguageCode ?? "") : "";
  if (isTemplate && !templateLanguageCode) {
    throw new ValidationError(tErrors.whatsappTemplateRequired);
  }
  if (!isTemplate && !body) {
    throw new ValidationError(tErrors.whatsappMessageRequired);
  }
  const sendInput: SendGroupMessageInput = isTemplate
    ? {
        groupId: group.groupJid,
        type: "template",
        template: {
          name: input.templateName,
          languageCode: templateLanguageCode,
          ...(input.templateComponents ? { components: input.templateComponents } : {}),
          ...(input.templateGroupIdParameter ? { groupIdParameter: input.templateGroupIdParameter } : {}),
        },
      }
    : {
        groupId: group.groupJid,
        type: "text",
        text: {
          body,
          ...(input.text?.previewUrl !== undefined ? { previewUrl: input.text.previewUrl } : {}),
        },
      };
  let providerMessageId: string;
  try {
    providerMessageId = parseSendGroupMessageResponse(
      await executeGraphApiCall<SendTemplateMessageResponseBody>(
        buildSendGroupMessageRequest(await accountGraphContext(account, tErrors), {
          ...sendInput,
          phoneNumberId: account.phoneNumberId,
        })
      )
    ).providerMessageId;
  } catch (error) {
    throw translateGroupGraphError(error, tErrors);
  }
  const sentAt = new Date();
  const persistSend = async (t: DBTransaction): Promise<GroupMessageSendResult> => {
    await WhatsappGroupMessageRepository.upsertByWamid(
      {
        groupId: group.id,
        accountId: account.id,
        wamid: providerMessageId,
        direction: WhatsappMessageDirection.API_OUTBOUND,
        type: isTemplate ? "template" : "text",
        content: isTemplate ? { body: `[template] ${input.templateName}`, name: input.templateName } : { body },
        status: "sent",
        sentAt,
      },
      t
    );
    return { providerMessageId, groupId: group.id };
  };
  return tx ? await persistSend(tx) : await db.transaction(persistSend);
}

/** Pin a message inside a group on Meta and stamp the local pin state. */
export async function pinGroupMessage(
  context: UserPermissionContext,
  tErrors: ErrorsLabels,
  input: WhatsappGroupPinInput,
  tx?: DBTransaction
): Promise<{ messageId: string }> {
  await assertCanManageGroups(context, tErrors);
  const buildRequest = (scope: GroupGraphScope) =>
    buildPinGroupMessageRequest(scope.ctx, {
      groupId: scope.groupJid,
      messageId: input.messageId,
      operation: "pin",
      expirationDays: requirePinExpirationDays(input, tErrors),
      phoneNumberId: scope.account.phoneNumberId,
    });
  await runGroupGraphCall(input.groupId, tErrors, buildRequest, parsePinGroupMessageResponse, {
    validate: () => requirePinExpirationDays(input, tErrors),
    tx,
  });
  const expirationDays = requirePinExpirationDays(input, tErrors);
  const pinnedAt = new Date();
  await WhatsappGroupMessageRepository.markPinned(
    input.messageId,
    pinnedAt,
    new Date(pinnedAt.getTime() + expirationDays * ONE_DAY_MS),
    tx
  );
  return { messageId: input.messageId };
}

/** Unpin a message inside a group on Meta and clear the local pin state. */
export async function unpinGroupMessage(
  context: UserPermissionContext,
  tErrors: ErrorsLabels,
  input: UnpinWhatsappGroupMessageInput,
  tx?: DBTransaction
): Promise<{ messageId: string }> {
  await assertCanManageGroups(context, tErrors);
  const buildRequest = (scope: GroupGraphScope) =>
    buildPinGroupMessageRequest(scope.ctx, {
      groupId: scope.groupJid,
      messageId: input.messageId,
      operation: "unpin",
      phoneNumberId: scope.account.phoneNumberId,
    });
  await runGroupGraphCall(input.groupId, tErrors, buildRequest, parsePinGroupMessageResponse, { tx });
  await WhatsappGroupMessageRepository.markPinned(input.messageId, null, null, tx);
  return { messageId: input.messageId };
}
