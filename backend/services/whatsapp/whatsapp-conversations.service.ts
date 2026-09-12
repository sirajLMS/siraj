import { db } from "@/backend/db/drizzleDb";
import { acquireAdvisoryLock } from "@/backend/db/repo/shared";
import {
  WhatsappAccountRepository,
  WhatsappConversationRepository,
  WhatsappMessageRepository,
  WhatsappTestRecipientRepository,
} from "@/backend/db/repo/whatsapp";
import { AppPermission } from "@/backend/enum";
import {
  WhatsappConversationSendMode,
  WhatsappTestRecipientStatus,
} from "@/backend/enum/whatsapp/whatsapp-conversations.enum";
import { WhatsappMessageDirection } from "@/backend/enum/whatsapp/whatsapp-inbox.enum";
import { DomainError, ForbiddenError, NotFoundError, ValidationError } from "@/backend/lib";
import { logger } from "@/backend/lib/logger";
import {
  FETCH_TIMEOUT_MS,
  readErrorBody,
  resolveGraphApiVersion,
  WHATSAPP_CREDENTIAL_PLACEHOLDER,
} from "@/backend/lib/whatsapp-constants";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import {
  extractMetaErrorCode,
  GraphApiError,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.helpers";
import {
  buildSendTemplateMessageRequest,
  buildSendTextMessageRequest,
  buildTemplateSnapshot,
  collectAllTemplates,
  messageTemplateListSchema,
  parseSendTemplateResponse,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/requests";
import { AuditService } from "@/backend/services/system/audit.service";
import { WhatsappInboxService } from "@/backend/services/whatsapp/whatsapp-inbox.service";
import type {
  AuditAction,
  CreateAuditLogInput,
  DBTransaction,
  GraphApiRequestContext,
  GraphApiRequestInit,
  ListMessageTemplatesResponseBody,
  SendTemplateMessageResponseBody,
  SendTemplateMessageResult,
  UserPermissionContext,
  WhatsappAccountSelectType,
  WhatsappConversationMessagesInput,
  WhatsappConversationMessagesPaginatedResult,
  WhatsappConversationReturnType,
  WhatsappConversationSendInput,
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

/** Meta caps a test number's recipient allow-list at 5 entries. */
const MAX_TEST_NUMBER_RECIPIENTS = 5;
/** Meta's "recipient not in allowed list" error code, returned by test numbers. */
const META_ERROR_RECIPIENT_NOT_IN_ALLOWED_LIST = 131030;
/** Meta's re-engagement error code: the 24h customer-service window closed before the send. */
const META_ERROR_RE_ENGAGEMENT_REQUIRED = 131047;
/** Meta's out-of-window variant on the send API: the 24h customer-service window closed before the send. */
const META_ERROR_OUTSIDE_SERVICE_WINDOW = 132047;
/** Meta's error code for a template send whose parameter component count differs from the template definition. */
const META_ERROR_TEMPLATE_PARAMS_MISMATCH = 132000;
/** Approved Meta sample template used for the recipient verify test-send. */
const VERIFY_TEMPLATE_NAME = "hello_world";
const VERIFY_TEMPLATE_LANGUAGE = "en_US";
/** Default template language for composer sends when the caller omits one. */
const DEFAULT_TEMPLATE_LANGUAGE = "en_US";

type ConversationActorInput = { readonly actorUserId: string };

export type AddWhatsappRecipientInput = ConversationActorInput & {
  readonly accountId: string;
  readonly phoneNumber: string;
  readonly note?: string | null;
};

export type RemoveWhatsappRecipientInput = ConversationActorInput & {
  readonly recipientId: string;
};

export type VerifyWhatsappRecipientInput = ConversationActorInput & {
  readonly recipientId: string;
};

export type SendWhatsappConversationMessageInput = ConversationActorInput & WhatsappConversationSendInput;

async function assertCanViewConversations(context: UserPermissionContext, tErrors: ErrorsLabels): Promise<void> {
  const ok = await PermissionsService.hasPermission(context, AppPermission.WHATSAPP_CONVERSATIONS_VIEW);
  if (!ok) {
    throw new ForbiddenError(tErrors.insufficientPermissions);
  }
}

async function assertCanManageConversations(context: UserPermissionContext, tErrors: ErrorsLabels): Promise<void> {
  const ok = await PermissionsService.hasPermission(context, AppPermission.WHATSAPP_CONVERSATIONS_MANAGE);
  if (!ok) {
    throw new ForbiddenError(tErrors.insufficientPermissions);
  }
}

/** Normalize a client-supplied phone number to Meta's digits-only wire form. */
function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, "");
}

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
 * Audit helper mirroring the whatsapp account service pattern. Recipient
 * registry rows are scoped to their account, so they audit under the
 * `WHATSAPP_ACCOUNT` entity with the recipient captured in `metadata`.
 */
async function auditChange(
  actorUserId: string,
  action: AuditAction,
  entityId: string,
  options: {
    description?: string;
    previousState?: Record<string, unknown> | null;
    newState?: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | null;
  },
  tx?: DBTransaction
): Promise<void> {
  const input: CreateAuditLogInput = {
    actorUserId,
    actorType: "USER",
    entityType: "WHATSAPP_ACCOUNT",
    entityId,
    action,
    description: options.description ?? null,
    previousState: options.previousState ?? null,
    newState: options.newState ?? null,
    metadata: options.metadata ?? null,
  };
  try {
    await AuditService.createManyAuditLogs([input], tx);
  } catch (error) {
    logger.error(
      `whatsapp-conversations-service: audit write failed for action=${action} entityId=${entityId} actorUserId=${actorUserId}: ${error instanceof Error ? error.message : String(error)}`,
      { action, entityId, actorUserId, error }
    );
  }
}

/** Type guard for objects with a string `code` property (e.g. Postgres driver errors). */
function hasErrorCode(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as Record<string, unknown>).code === "string"
  );
}

/** Postgres unique-constraint violation (SQLSTATE 23505), possibly wrapped by the driver. */
function isUniqueViolation(error: unknown): boolean {
  if (hasErrorCode(error) && error.code === "23505") {
    return true;
  }
  const cause = typeof error === "object" && error !== null ? (error as { cause?: unknown }).cause : null;
  return hasErrorCode(cause) && cause.code === "23505";
}

/**
 * Load the account row with its decrypted credential columns. The
 * `encryptedText` column driver decrypts at read time, so
 * `encryptedAccessToken` here is the plaintext Meta token.
 */
async function requireAccount(
  accountId: string,
  tErrors: ErrorsLabels,
  tx?: DBTransaction
): Promise<WhatsappAccountSelectType> {
  const account = await WhatsappAccountRepository.findCredentialsById(accountId, tx);
  if (!account) {
    throw new NotFoundError("WHATSAPP_ACCOUNT", tErrors.whatsappAccountNotFound(accountId));
  }
  return account;
}

/**
 * Per-account Graph API context, matching the per-account branch of the
 * account-sync credential resolution (DB-managed token over the env-global
 * bootstrap token). The unpersisted-token placeholder counts as "missing":
 * rows created without credentials must not dispatch a live Graph call.
 */
async function accountGraphContext(
  account: WhatsappAccountSelectType,
  tErrors: ErrorsLabels
): Promise<GraphApiRequestContext> {
  if (!account.encryptedAccessToken || account.encryptedAccessToken === WHATSAPP_CREDENTIAL_PLACEHOLDER) {
    throw new DomainError("WHATSAPP_CONFIG", tErrors.whatsappAccessTokenNotConfigured);
  }
  return { accessToken: account.encryptedAccessToken, apiVersion: await resolveGraphApiVersion() };
}

/**
 * Lifecycle-independent Graph API execute step: the account/config services
 * keep their own fetch wrappers with different error contracts, so this one
 * only throws `GraphApiError` on non-2xx and returns the parsed JSON body.
 */
async function executeGraphApiCall<TBody>(request: { url: string; init: RequestInit }): Promise<TBody> {
  const response = await fetch(request.url, {
    ...request.init,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    const errorBody = await readErrorBody(response);
    throw new GraphApiError(response.status, errorBody);
  }
  const body: TBody = await response.json();
  return body;
}

/** Execute a composer/verify send and return the raw send response body. */
async function executeSendRequest(request: {
  url: string;
  init: RequestInit;
}): Promise<SendTemplateMessageResponseBody> {
  return executeGraphApiCall<SendTemplateMessageResponseBody>(request);
}

/** Execute a template-list page fetch, validating the wire shape before it reaches callers. */
async function executeTemplateListRequest(request: GraphApiRequestInit): Promise<ListMessageTemplatesResponseBody> {
  const raw = await executeGraphApiCall<unknown>(request);
  return messageTemplateListSchema.parse(raw);
}

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
    const insertRecipient = async (t: DBTransaction): Promise<WhatsappTestRecipientReturnType> => {
      if (tx == null) {
        await acquireAdvisoryLock(t, `whatsapp-recipient-cap:${account.id}`);
      }
      if (account.isTestNumber) {
        const count = await WhatsappTestRecipientRepository.countByAccountId(account.id, t);
        if (count >= MAX_TEST_NUMBER_RECIPIENTS) {
          throw new DomainError("WHATSAPP_RECIPIENT_LIMIT_REACHED", tErrors.whatsappRecipientLimitReached);
        }
      }
      let created: WhatsappTestRecipientReturnType;
      try {
        created = await WhatsappTestRecipientRepository.create(
          {
            accountId: account.id,
            phoneNumber,
            note: input.note ?? null,
            createdByUserId: input.actorUserId,
          },
          t
        );
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new DomainError("WHATSAPP_RECIPIENT_CONFLICT", tErrors.whatsappRecipientConflict, { cause: error });
        }
        throw error;
      }
      await auditChange(
        input.actorUserId,
        "CREATE",
        account.id,
        {
          description: "whatsapp-test-recipient registered",
          newState: { phoneNumber: created.phoneNumber },
          metadata: { registry: "whatsapp_test_recipients", recipientId: created.id },
        },
        t
      );
      return created;
    };
    return tx ? await insertRecipient(tx) : await db.transaction(insertRecipient);
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
    const recordVerdict = async (t: DBTransaction): Promise<WhatsappTestRecipientReturnType> => {
      const recorded = await WhatsappTestRecipientRepository.recordVerify(
        recipient.id,
        { allowed: verified.allowed, errorCode: verified.errorCode, checkedAt },
        t
      );
      if (!recorded) {
        throw new NotFoundError("WHATSAPP_TEST_RECIPIENT", tErrors.notFound);
      }
      await auditChange(
        input.actorUserId,
        "UPDATE",
        recipient.accountId,
        {
          description: `whatsapp-test-recipient verify ${verified.allowed ? "allowed" : "rejected"}`,
          newState: { status: recorded.status, lastErrorCode: recorded.lastErrorCode },
          metadata: { registry: "whatsapp_test_recipients", recipientId: recipient.id },
        },
        t
      );
      return recorded;
    };
    return tx ? await recordVerdict(tx) : await db.transaction(recordVerdict);
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
    const persistSend = async (t: DBTransaction): Promise<WhatsappConversationSendResult> => {
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
    };
    return tx ? await persistSend(tx) : await db.transaction(persistSend);
  }
}

/**
 * Resolve the send's thread, tight-coupling conversation ownership to the
 * sending account. A caller-supplied `conversationId` must also name a
 * conversation whose peer `waId` matches the send target — otherwise a
 * template (window-exempt) send could be booked into an unrelated thread.
 */
async function resolveSendConversation(
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
async function dispatchSend(
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
