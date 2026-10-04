import { db } from "@/backend/db/drizzleDb";
import { WhatsappConversationRepository, WhatsappTestRecipientRepository } from "@/backend/db/repo/whatsapp";
import {
  WhatsappConversationSendMode,
  WhatsappTestRecipientStatus,
} from "@/backend/enum/whatsapp/whatsapp-conversations.enum";
import { DomainError, NotFoundError, ValidationError } from "@/backend/lib";
import {
  extractMetaErrorCode,
  GraphApiError,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.helpers";
import {
  buildSendTemplateMessageRequest,
  buildTemplateSnapshot,
  collectAllTemplates,
  parseSendTemplateResponse,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/requests";
import {
  type AddWhatsappRecipientInput,
  assertCanManageConversations,
  assertCanViewConversations,
  auditChange,
  digitsOnly,
  executeTemplateListRequest,
  insertRecipientWithCap,
  type RemoveWhatsappRecipientInput,
  recordRecipientVerdict,
  requireAccount,
  type SendWhatsappConversationMessageInput,
  VERIFY_TEMPLATE_LANGUAGE,
  VERIFY_TEMPLATE_NAME,
  type VerifyWhatsappRecipientInput,
} from "@/backend/services/whatsapp/whatsapp-conversations.helpers";
import {
  dispatchSend,
  persistOutboundMessage,
  resolveSendConversation,
} from "@/backend/services/whatsapp/whatsapp-conversations-send.helpers";
import { accountGraphContext, executeSendRequest } from "@/backend/services/whatsapp/whatsapp-graph.helpers";
import { WhatsappInboxService } from "@/backend/services/whatsapp/whatsapp-inbox.service";
import type {
  DBTransaction,
  UserPermissionContext,
  WhatsappConversationMessagesInput,
  WhatsappConversationMessagesPaginatedResult,
  WhatsappConversationSendResult,
  WhatsappConversationsListInput,
  WhatsappConversationsPaginatedResult,
  WhatsappConversationThreadResult,
  WhatsappMessageTemplate,
  WhatsappTemplateSnapshot,
  WhatsappTestRecipientReturnType,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

/**
 * Orchestrator for the `/whatsapp` conversations workspace: recipients
 * registry (test-number allow-list bookkeeping), verified test sends, the
 * composer `sendMessage` path, and the template picker read. Meta remains the
 * authority on the 24h customer-service window (its rejection codes map to
 * domain errors) — the local `lastInboundMessageAt` state is advisory only.
 * Conversation reads delegate to `WhatsappInboxService`. Every entry point
 * takes the caller's `UserPermissionContext` (already on the GraphQL context)
 * so permission checks never re-fetch the context.
 */
export namespace WhatsappConversationsService {
  /**
   * Conversation list for the workspace. Gated on the conversations view
   * permission; the inbox delegate applies its own inbox view gate on top as
   * defense-in-depth (both grants are currently identical, so callers see a
   * single view requirement).
   */
  export async function listConversations(
    context: UserPermissionContext,
    tErrors: ErrorsLabels,
    input: WhatsappConversationsListInput,
    tx?: DBTransaction
  ): Promise<WhatsappConversationsPaginatedResult> {
    await assertCanViewConversations(context, tErrors);
    return WhatsappInboxService.listConversations(context, tErrors, input, tx);
  }

  /**
   * Message page for one conversation in the workspace. Gated on the
   * conversations view permission; the inbox delegate applies its own inbox
   * view gate on top as defense-in-depth.
   */
  export async function listConversationMessages(
    context: UserPermissionContext,
    tErrors: ErrorsLabels,
    input: WhatsappConversationMessagesInput,
    tx?: DBTransaction
  ): Promise<WhatsappConversationMessagesPaginatedResult> {
    await assertCanViewConversations(context, tErrors);
    return WhatsappInboxService.listConversationMessages(context, tErrors, input, tx);
  }

  /**
   * Thread detail for the workspace: the conversation row plus its paginated
   * messages envelope. The conversation row loads first so an unknown id
   * short-circuits before the message query runs; the inbox delegate then
   * re-validates the conversation id and applies its own inbox view gate on
   * top of the conversations view gate. This is a plain-row read, so the
   * join-populated `accountPurpose` stays unset on the returned conversation
   * (unlike the inbox list rows, which resolve it from the accounts join).
   */
  export async function getConversationThread(
    context: UserPermissionContext,
    tErrors: ErrorsLabels,
    input: WhatsappConversationMessagesInput,
    tx?: DBTransaction
  ): Promise<WhatsappConversationThreadResult> {
    await assertCanViewConversations(context, tErrors);
    const conversation = await WhatsappConversationRepository.findById(input.conversationId, tx);
    if (!conversation) {
      throw new NotFoundError("WHATSAPP_CONVERSATION", tErrors.notFound);
    }
    const messages = await WhatsappInboxService.listConversationMessages(context, tErrors, input, tx);
    return { conversation, messages };
  }

  /** Registry rows for one account (view-permission gated). */
  export async function listRecipients(
    context: UserPermissionContext,
    tErrors: ErrorsLabels,
    input: { accountId: string },
    tx?: DBTransaction
  ): Promise<WhatsappTestRecipientReturnType[]> {
    await assertCanViewConversations(context, tErrors);
    return WhatsappTestRecipientRepository.listByAccountId(input.accountId, tx);
  }

  /**
   * Message templates for one account, listed live from Meta with the
   * account's own credentials (view-permission gated). Mirrors the
   * sync-from-Meta snapshot mapping — the composer picker reads the same
   * shape without waiting for a background sync. Any Graph API or transport
   * failure maps to the templates-fetch error.
   */
  export async function listAccountTemplates(
    context: UserPermissionContext,
    tErrors: ErrorsLabels,
    input: { accountId: string },
    tx?: DBTransaction
  ): Promise<WhatsappTemplateSnapshot[]> {
    await assertCanViewConversations(context, tErrors);
    const account = await requireAccount(input.accountId, tErrors, tx);
    const ctx = await accountGraphContext(account, tErrors);
    let templates: readonly WhatsappMessageTemplate[];
    try {
      templates = await collectAllTemplates(ctx, { wabaId: account.wabaId }, executeTemplateListRequest);
    } catch (error) {
      throw new DomainError("WHATSAPP_TEMPLATES_FETCH_FAILED", tErrors.whatsappTemplatesFetchFailed, {
        cause: error,
      });
    }
    return buildTemplateSnapshot(templates);
  }

  /**
   * Register a recipient in the per-account registry. Test numbers are capped
   * at Meta's 5-recipient limit; the `(accountId, phoneNumber)` unique
   * constraint is translated into a domain conflict.
   *
   * The cap check and the insert run inside one transaction serialized by an
   * account-scoped advisory lock, so concurrent adds cannot both observe "4
   * recipients" and both insert past the cap. When the caller already owns a
   * transaction, no advisory lock is taken: that caller may hold other locks,
   * and waiting on this one could invert the standalone lock order.
   */
  export async function addRecipient(
    context: UserPermissionContext,
    tErrors: ErrorsLabels,
    input: AddWhatsappRecipientInput,
    tx?: DBTransaction
  ): Promise<WhatsappTestRecipientReturnType> {
    await assertCanManageConversations(context, tErrors);
    const account = await requireAccount(input.accountId, tErrors, tx);
    const phoneNumber = digitsOnly(input.phoneNumber);
    if (!phoneNumber) {
      throw new ValidationError(tErrors.invalidInput);
    }
    const deps = { account, callerTx: tx, input, phoneNumber, tErrors };
    return tx ? await insertRecipientWithCap(tx, deps) : await db.transaction(t => insertRecipientWithCap(t, deps));
  }

  /** Hard-delete a registry row by id (manage-permission gated). */
  export async function removeRecipient(
    context: UserPermissionContext,
    tErrors: ErrorsLabels,
    input: RemoveWhatsappRecipientInput,
    tx?: DBTransaction
  ): Promise<void> {
    await assertCanManageConversations(context, tErrors);
    const deleted = await WhatsappTestRecipientRepository.deleteById(input.recipientId, tx);
    if (!deleted) {
      throw new NotFoundError("WHATSAPP_TEST_RECIPIENT", tErrors.notFound);
    }
    await auditChange(
      input.actorUserId,
      "DELETE",
      deleted.accountId,
      {
        description: "whatsapp-test-recipient removed",
        previousState: { phoneNumber: deleted.phoneNumber },
        metadata: { registry: "whatsapp_test_recipients", recipientId: deleted.id },
      },
      tx
    );
  }

  /**
   * Prove Meta will accept sends to a registry recipient: dispatch the
   * `hello_world` test template with the owning account's credentials and
   * record the verdict. A Graph API failure flips the row back to PENDING
   * with the Meta error code instead of throwing.
   *
   * The Meta HTTP call completes before any transaction opens — no database
   * transaction is ever held across the (up to timeout-bounded) external
   * call; the verdict row update plus its audit write commit atomically.
   */
  export async function verifyRecipient(
    context: UserPermissionContext,
    tErrors: ErrorsLabels,
    input: VerifyWhatsappRecipientInput,
    tx?: DBTransaction
  ): Promise<WhatsappTestRecipientReturnType> {
    await assertCanManageConversations(context, tErrors);
    const recipient = await WhatsappTestRecipientRepository.findById(input.recipientId, tx);
    if (!recipient) {
      throw new NotFoundError("WHATSAPP_TEST_RECIPIENT", tErrors.notFound);
    }
    const account = await requireAccount(recipient.accountId, tErrors, tx);
    const request = buildSendTemplateMessageRequest(await accountGraphContext(account, tErrors), {
      phoneNumberId: account.phoneNumberId,
      to: recipient.phoneNumber,
      templateName: VERIFY_TEMPLATE_NAME,
      languageCode: VERIFY_TEMPLATE_LANGUAGE,
    });
    const checkedAt = new Date();
    let verified: { readonly allowed: boolean; readonly errorCode: string | null };
    try {
      parseSendTemplateResponse(await executeSendRequest(request));
      verified = { allowed: true, errorCode: null };
    } catch (error) {
      if (!(error instanceof GraphApiError)) {
        throw error;
      }
      const metaCode = extractMetaErrorCode(error.errorBody);
      verified = { allowed: false, errorCode: metaCode === undefined ? null : String(metaCode) };
    }
    const deps = { recipient, verified, checkedAt, actorUserId: input.actorUserId, tErrors };
    return tx ? await recordRecipientVerdict(tx, deps) : await db.transaction(t => recordRecipientVerdict(t, deps));
  }

  /**
   * Send a composer message from an account row:
   * 1. manage-permission gate, account resolution, digits-only normalization;
   * 2. payload validation per mode (TEMPLATE requires a name, TEXT a body);
   * 3. test-number hard block — the recipient must be ALLOWED in the registry;
   * 4. the 24h customer-service window is NOT gated locally: the local
   *    `lastInboundMessageAt` state can lag Meta's truth (inbound webhooks do
   *    not reach local dev), so Meta is the authority and its rejections are
   *    mapped onto domain errors;
   * 5. Graph API send with the account's own credentials; Meta's 131030 maps
   *    to the recipient-allow-list error, 131047/132047 to the
   *    outside-service-window error, 132000 to the template-params-mismatch
   *    error, everything else (other Graph API failures, builder validation
   *    failures, network/timeout) to send-failed;
   * 6. persist the message as API_OUTBOUND (idempotent via wamid), roll the
   *    conversation forward (never the inbound marker), audit the send.
   *
   * The Meta HTTP call (step 5) completes before any transaction opens — no
   * transaction is held across the external call; the message upsert, the
   * conversation upsert/roll-forward, and the audit write then commit inside
   * one transaction, so a mid-write failure can never leave a Meta-accepted
   * send half-persisted.
   */
  export async function sendMessage(
    context: UserPermissionContext,
    tErrors: ErrorsLabels,
    input: SendWhatsappConversationMessageInput,
    tx?: DBTransaction
  ): Promise<WhatsappConversationSendResult> {
    await assertCanManageConversations(context, tErrors);
    const account = await requireAccount(input.accountId, tErrors, tx);
    const to = digitsOnly(input.to);
    if (!to) {
      throw new ValidationError(tErrors.invalidInput);
    }
    const body = (input.body ?? "").trim();
    const templateName = (input.templateName ?? "").trim();
    if (input.mode === WhatsappConversationSendMode.TEXT && !body) {
      throw new ValidationError(tErrors.whatsappMessageRequired);
    }
    if (input.mode === WhatsappConversationSendMode.TEMPLATE && !templateName) {
      throw new ValidationError(tErrors.whatsappTemplateRequired);
    }
    if (account.isTestNumber) {
      const recipient = await WhatsappTestRecipientRepository.findByAccountAndPhone(account.id, to, tx);
      if (recipient?.status !== WhatsappTestRecipientStatus.ALLOWED) {
        throw new DomainError("WHATSAPP_RECIPIENT_NOT_ALLOWED", tErrors.whatsappRecipientNotAllowed);
      }
    }
    const conversation = await resolveSendConversation(account.id, input, to, tErrors, tx);
    // The Meta HTTP call is complete before any transaction opens below.
    const result = await dispatchSend(account, input, to, body, templateName, tErrors);
    const sentAt = new Date();
    const deps = { conversation, account, input, body, templateName, result, sentAt, to };
    return tx ? await persistOutboundMessage(tx, deps) : await db.transaction(t => persistOutboundMessage(t, deps));
  }
}
