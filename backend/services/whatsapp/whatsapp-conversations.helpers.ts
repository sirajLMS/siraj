/**
 * Internal helpers for the WhatsApp conversations service
 * (`whatsapp-conversations.service.ts`): permission gates, wire
 * normalization, the audit helper, and the transaction bodies for recipient
 * registry writes.
 */

import { acquireAdvisoryLock } from "@/backend/db/repo/shared";
import { WhatsappAccountRepository, WhatsappTestRecipientRepository } from "@/backend/db/repo/whatsapp";
import { AppPermission } from "@/backend/enum";
import { DomainError, ForbiddenError, NotFoundError } from "@/backend/lib";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { messageTemplateListSchema } from "@/backend/services/communication/channels/whatsapp/cloud-api/requests";
import { auditWhatsappChange, type WhatsappAuditChangeOptions } from "@/backend/services/whatsapp/__shared__";
import { executeGraphApiCall } from "@/backend/services/whatsapp/whatsapp-graph.helpers";
import type {
  AuditAction,
  DBTransaction,
  GraphApiRequestInit,
  ListMessageTemplatesResponseBody,
  UserPermissionContext,
  WhatsappAccountSelectType,
  WhatsappConversationSendInput,
  WhatsappTestRecipientReturnType,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

/** Meta caps a test number's recipient allow-list at 5 entries. */
const MAX_TEST_NUMBER_RECIPIENTS = 5;
/** Approved Meta sample template used for the recipient verify test-send. */
export const VERIFY_TEMPLATE_NAME = "hello_world";
export const VERIFY_TEMPLATE_LANGUAGE = "en_US";

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

export async function assertCanViewConversations(context: UserPermissionContext, tErrors: ErrorsLabels): Promise<void> {
  const ok = await PermissionsService.hasPermission(context, AppPermission.WHATSAPP_CONVERSATIONS_VIEW);
  if (!ok) {
    throw new ForbiddenError(tErrors.insufficientPermissions);
  }
}

export async function assertCanManageConversations(
  context: UserPermissionContext,
  tErrors: ErrorsLabels
): Promise<void> {
  const ok = await PermissionsService.hasPermission(context, AppPermission.WHATSAPP_CONVERSATIONS_MANAGE);
  if (!ok) {
    throw new ForbiddenError(tErrors.insufficientPermissions);
  }
}

/** Normalize a client-supplied phone number to Meta's digits-only wire form. */
export function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, "");
}

/**
 * Audit helper mirroring the whatsapp account service pattern. Recipient
 * registry rows are scoped to their account, so they audit under the
 * `WHATSAPP_ACCOUNT` entity with the recipient captured in `metadata`.
 */
export async function auditChange(
  actorUserId: string,
  action: AuditAction,
  entityId: string,
  options: WhatsappAuditChangeOptions,
  tx?: DBTransaction
): Promise<void> {
  return auditWhatsappChange("whatsapp-conversations-service", actorUserId, action, entityId, options, tx);
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
export async function requireAccount(
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

/** Execute a template-list page fetch, validating the wire shape before it reaches callers. */
export async function executeTemplateListRequest(
  request: GraphApiRequestInit
): Promise<ListMessageTemplatesResponseBody> {
  const raw = await executeGraphApiCall<unknown>(request);
  return messageTemplateListSchema.parse(raw);
}

/**
 * Transaction body for a registry insert: enforces the test-number
 * recipient cap under an account-scoped advisory lock (skipped when the
 * caller already owns a transaction) and translates the unique-constraint
 * violation into a domain conflict.
 */
export async function insertRecipientWithCap(
  t: DBTransaction,
  deps: {
    account: WhatsappAccountSelectType;
    callerTx: DBTransaction | undefined;
    input: AddWhatsappRecipientInput;
    phoneNumber: string;
    tErrors: ErrorsLabels;
  }
): Promise<WhatsappTestRecipientReturnType> {
  const { account, callerTx, input, phoneNumber, tErrors } = deps;
  if (callerTx == null) {
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
}

/**
 * Transaction body for a verify verdict: records the Meta test-send outcome
 * on the recipient row and audits the transition.
 */
export async function recordRecipientVerdict(
  t: DBTransaction,
  deps: {
    recipient: WhatsappTestRecipientReturnType;
    verified: { readonly allowed: boolean; readonly errorCode: string | null };
    checkedAt: Date;
    actorUserId: string;
    tErrors: ErrorsLabels;
  }
): Promise<WhatsappTestRecipientReturnType> {
  const { recipient, verified, checkedAt, actorUserId, tErrors } = deps;
  const recorded = await WhatsappTestRecipientRepository.recordVerify(
    recipient.id,
    { allowed: verified.allowed, errorCode: verified.errorCode, checkedAt },
    t
  );
  if (!recorded) {
    throw new NotFoundError("WHATSAPP_TEST_RECIPIENT", tErrors.notFound);
  }
  await auditChange(
    actorUserId,
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
}
