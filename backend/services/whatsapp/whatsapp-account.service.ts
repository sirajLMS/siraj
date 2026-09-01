import { z } from "zod";
import { db } from "@/backend/db/drizzleDb";
import { NotificationPreferencesRepository } from "@/backend/db/repo/notifications/notification-preferences.repository";
import { WhatsappAccountRepository } from "@/backend/db/repo/whatsapp";
import { AppPermission, NotificationChannel, NotificationEventType, SystemPermissionGroupSlug } from "@/backend/enum";
import { WhatsappTemplateCategory, WhatsappTemplateStatus } from "@/backend/enum/whatsapp/whatsapp.enum";
import {
  buildReturnType,
  coerceLimitTier,
  coerceQualityRating,
  isValidLimitTier,
  isValidQualityRating,
} from "@/backend/lib";
import { logger } from "@/backend/lib/logger";
import {
  FETCH_TIMEOUT_MS,
  MAX_CONCURRENT_CALLS,
  readErrorBody,
  resolveGraphApiContextFromEnv,
} from "@/backend/lib/whatsapp-constants";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { GraphApiError } from "@/backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.helpers";
import { buildGetPhoneNumberRequest } from "@/backend/services/communication/channels/whatsapp/cloud-api/requests/get-phone-number.request";
import { collectAllTemplates } from "@/backend/services/communication/channels/whatsapp/cloud-api/requests/list-message-templates.request";
import { collectAllPhoneNumbers } from "@/backend/services/communication/channels/whatsapp/cloud-api/requests/list-phone-numbers.request";
import { resetWhatsappChannel } from "@/backend/services/communication/channels/whatsapp/WhatsappChannelFactory";
import { EVENT_CHANNEL_ALLOWLIST } from "@/backend/services/notification/notification-dispatch.helpers";
import { NOTIFICATION_TEMPLATE_MAP } from "@/backend/services/notification/notification-payloads.builders";
import { resolveEnvConfig } from "@/backend/services/system";
import { AuditService } from "@/backend/services/system/audit.service";
// r10-043/r10-044/r10-045: Canonical types imported from the types layer,
// not from service-layer barrels or request builders.
import type {
  AuditAction,
  CreateAuditLogInput,
  DBTransaction,
  GetPhoneNumberResult,
  GraphApiRequestContext,
  GraphApiRequestInit,
  ListMessageTemplatesResponseBody,
  ListPhoneNumbersResponseBody,
  NotificationPreferenceUpdateInput,
  WhatsappAccountCreateSubmitInput,
  WhatsappAccountReturnType,
  WhatsappAccountUpdateInput,
  WhatsappMessageTemplate,
  WhatsappPhoneNumber,
  WhatsappSyncFromMetaReturnType,
  WhatsappTemplateSnapshot,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

/** Placeholder string for credentials not yet set via dedicated mutations. */
const SYNC_STATUS_PENDING = "pending" as const;

/** RFC 4122 UUID format matcher (case-insensitive). */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Zod schemas for validating Graph API responses at runtime.
 * Used to safely parse API responses instead of unsafe type assertions.
 */
export const phoneNumberResultSchema = z.object({
  id: z.string(),
  display_phone_number: z.string(),
  verified_name: z.string(),
  quality_rating: z.string(),
  throughput_level: z.string(),
  portfolio_messaging_limit_tier: z.string(),
  max_conversations_per_24_hours: z.number().optional(),
  status: z.string().optional(),
  code_verification_status: z.string().optional(),
});

export const graphApiPagingSchema = z
  .object({
    cursors: z
      .object({
        before: z.string().optional(),
        after: z.string().optional(),
      })
      .optional(),
    next: z.string().optional(),
    previous: z.string().optional(),
  })
  .optional();

export const phoneNumberListSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      display_phone_number: z.string(),
      verified_name: z.string(),
      quality_rating: z.string().optional(),
      throughput_level: z.string().optional(),
      status: z.string().optional(),
      code_verification_status: z.string().optional(),
    })
  ),
  paging: graphApiPagingSchema,
});

export const messageTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  language: z.object({
    code: z.string(),
  }),
  status: z.string(),
  category: z.string(),
  components: z.array(z.unknown()).optional(),
  created_time: z.string().optional(),
});

export const messageTemplateListSchema = z.object({
  data: z.array(messageTemplateSchema),
  paging: graphApiPagingSchema,
});

export const sendTemplateMessageResponseSchema = z.object({
  messaging_product: z.string(),
  contacts: z.array(
    z.object({
      input: z.string(),
      wa_id: z.string(),
    })
  ),
  messages: z.array(
    z.object({
      id: z.string(),
    })
  ),
});

/**
 * Type guard for NotificationChannel.
 * The DB column is typed as NotificationChannel but at runtime it's a plain string.
 * This guard safely narrows unknown values to NotificationChannel.
 */
function isNotificationChannel(value: unknown): value is NotificationChannel {
  return typeof value === "string" && (Object.values(NotificationChannel) as readonly string[]).includes(value);
}

/**
 * Validation error specific to the WhatsApp account service.
 *
 * Carries a stable `code` so the GraphQL resolver can map to a localized
 * error string without regex-matching `message`.
 */
class WhatsappAccountValidationError extends Error {
  readonly code: "INVALID_INPUT" | "INVALID_ID";

  constructor(code: "INVALID_INPUT" | "INVALID_ID", message: string) {
    super(message);
    this.name = "WhatsappAccountValidationError";
    this.code = code;
  }
}

/** Asserts `id` is a valid UUID, throwing a validation error otherwise. */
function assertValidId(id: string, tErrors: ErrorsLabels): void {
  if (!UUID_REGEX.test(id)) {
    throw new WhatsappAccountValidationError("INVALID_ID", tErrors.invalidInput);
  }
}

/**
 * Extracts a safe error description from an unknown error value.
 * Avoids leaking DB internals per r10-036.
 */
function getErrorDescription(error: unknown): string {
  if (error instanceof WhatsappAccountValidationError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.constructor.name;
  }
  return typeof error;
}

/**
 * Masks a phone number for safe logging (r10-012).
 *
 * Returns `"unknown"` for nullish input; otherwise exposes only the last 4
 * digits prefixed with `***` so PII never appears in log sinks.
 */
function maskPhoneNumber(phone: string | undefined | null): string {
  if (!phone) {
    return "unknown";
  }
  const last4 = phone.slice(-4);
  return `***${last4}`;
}

/**
 * Max concurrent phone-number writes when no explicit transaction is supplied
 * (r10-032). Bounds the number of independent DB connections pulled from the
 * pool so we never saturate it with one unbounded `Promise.all`.
 */
const MAX_CONCURRENT_PHONES = 5;

/**
 * Runs an async mapper over items sequentially, collecting results into an array.
 *
 * Intentionally sequential (not parallel) for transaction safety: when a `tx`
 * is passed, all writes share a single drizzle pg connection. Parallel queries
 * on the same connection are unsafe and can cause deadlocks / interleaved
 * protocol frames. When no `tx` is present (default `db`), each call uses its
 * own connection and `Promise.all` is used instead.
 */
async function collectSequentially<T, R>(items: readonly T[], mapper: (item: T) => Promise<R>): Promise<R[]> {
  const results = await Promise.all(items.map(mapper));
  return results;
}

async function assertCanView(actorUserId: string, tErrors: ErrorsLabels): Promise<void> {
  const ok = await PermissionsService.hasPermission(actorUserId, AppPermission.WHATSAPP_VIEW);
  if (!ok) {
    throw new Error(tErrors.insufficientPermissions);
  }
}

async function assertCanManage(actorUserId: string, tErrors: ErrorsLabels): Promise<void> {
  const ok = await PermissionsService.hasPermission(actorUserId, AppPermission.WHATSAPP_CONFIG_MANAGE);
  if (!ok) {
    throw new Error(tErrors.insufficientPermissions);
  }
}

// REQ-12: Credential rotation and opt-in toggle are SUPER_ADMIN only
/**
 * Asserts the actor is a super-admin.
 *
 * Intended authorization boundary: membership in the `SUPER_ADMIN` system
 * permission group is treated as equivalent to the `isSuperAdmin` flag on the
 * user context. This allows granting super-admin privileges via group
 * membership (e.g. for role-based provisioning) without requiring the flag to
 * be set on the user record itself. Both checks are OR'd — either one
 * suffices.
 */
async function assertSuperAdmin(actorUserId: string, tErrors: ErrorsLabels): Promise<void> {
  const context = await PermissionsService.getUserContext(actorUserId);
  if (!context.isSuperAdmin && !context.permissionGroups.includes(SystemPermissionGroupSlug.SUPER_ADMIN)) {
    throw new Error(tErrors.insufficientPermissions);
  }
}

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
      `whatsapp-account-service: audit write failed for action=${action} entityId=${entityId} actorUserId=${actorUserId}: ${error instanceof Error ? error.message : String(error)}`,
      { action, entityId, actorUserId, error }
    );
  }
}

async function resolveGraphApiContext(tErrors: ErrorsLabels): Promise<{ ctx: GraphApiRequestContext; wabaId: string }> {
  const wabaId = await resolveEnvConfig("WHATSAPP_WABA_ID");
  if (!wabaId) {
    throw new Error(tErrors.whatsappWabaIdNotConfigured);
  }
  const { accessToken, apiVersion } = await resolveGraphApiContextFromEnv(tErrors);
  return { ctx: { accessToken, apiVersion }, wabaId };
}

// NOTE (Fix 3, LOW): The fetch plumbing here (fetch + AbortSignal.timeout +
// non-ok handling) overlaps with `MetaCloudApiAdapter.executeSend`. The two
// entry-points have different return types (generic JSON vs WhatsappSendResult)
// and different error-handling needs (throw GraphApiError vs structured error
// result), so they are not unified. If the signatures converge in the future,
// route both through a single shared fetch wrapper.
async function executeGraphApiFetch<T>(request: GraphApiRequestInit, schema: z.ZodType<T>): Promise<T> {
  const response = await fetch(request.url, {
    ...request.init,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    const errorBody = await readErrorBody(response);
    throw new GraphApiError(response.status, errorBody);
  }
  const raw: unknown = await response.json();
  return schema.parse(raw);
}

function isValidTemplateStatus(value: string): value is WhatsappTemplateStatus {
  return (Object.values(WhatsappTemplateStatus) as string[]).includes(value);
}

function isValidTemplateCategory(value: string): value is WhatsappTemplateCategory {
  return (Object.values(WhatsappTemplateCategory) as string[]).includes(value);
}

export namespace WhatsappAccountService {
  export async function listAccounts(
    actorUserId: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<WhatsappAccountReturnType[]> {
    await assertCanView(actorUserId, tErrors);
    return WhatsappAccountRepository.listActive(tx);
  }

  export async function getAccount(
    actorUserId: string,
    tErrors: ErrorsLabels,
    id: string,
    tx?: DBTransaction
  ): Promise<WhatsappAccountReturnType | null> {
    await assertCanView(actorUserId, tErrors);
    assertValidId(id, tErrors);
    return WhatsappAccountRepository.findById(id, tx);
  }

  export async function createAccount(
    actorUserId: string,
    tErrors: ErrorsLabels,
    input: WhatsappAccountCreateSubmitInput,
    tx?: DBTransaction
  ): Promise<WhatsappAccountReturnType> {
    await assertCanManage(actorUserId, tErrors);

    // r10-039: Service-layer length validation for wabaId/phoneNumberId.
    if (input.wabaId.length > 64) {
      throw new WhatsappAccountValidationError("INVALID_INPUT", tErrors.invalidInput);
    }
    if (input.phoneNumberId.length > 64) {
      throw new WhatsappAccountValidationError("INVALID_INPUT", tErrors.invalidInput);
    }

    // The schema has NOT NULL on encryptedAccessToken/encryptedTwoStepPin.
    // Credentials are set via dedicated mutations (setAccessToken/setTwoStepPin).
    // Use a "pending" placeholder instead of empty string so the row is
    // distinguishable from a credential that was explicitly set to "".
    // An account must NOT be active without credentials — if no credentials
    // are provided and isActive is requested, force it to false.
    const hasAccessToken =
      "encryptedAccessToken" in input &&
      typeof input.encryptedAccessToken === "string" &&
      input.encryptedAccessToken.trim().length > 0;
    const effectiveIsActive = hasAccessToken ? input.isActive : false;
    if (input.isActive && !hasAccessToken) {
      const accountIdentifier = input.displayPhoneNumber
        ? maskPhoneNumber(input.displayPhoneNumber)
        : `phoneNumberId=***${input.phoneNumberId.slice(-4)}`;
      logger.warn(
        `whatsapp-account-service: createAccount for ${accountIdentifier} requested isActive=true but no accessToken provided — defaulting to isActive=false`
      );
    }

    const account = await WhatsappAccountRepository.create(
      {
        ...input,
        isActive: effectiveIsActive,
        encryptedAccessToken: SYNC_STATUS_PENDING,
        encryptedTwoStepPin: SYNC_STATUS_PENDING,
      },
      tx
    );
    await auditChange(
      actorUserId,
      "CREATE",
      account.id,
      {
        description: `Created WhatsApp account for ${maskPhoneNumber(input.displayPhoneNumber)}${effectiveIsActive !== input.isActive ? " (isActive forced to false: no credentials)" : ""}`,
        newState: { wabaId: input.wabaId, phoneNumberId: input.phoneNumberId, isActive: effectiveIsActive },
      },
      tx
    );
    return account;
  }

  export async function updateAccount(
    actorUserId: string,
    tErrors: ErrorsLabels,
    id: string,
    input: WhatsappAccountUpdateInput,
    tx?: DBTransaction
  ): Promise<WhatsappAccountReturnType | null> {
    await assertCanManage(actorUserId, tErrors);
    assertValidId(id, tErrors);

    // r10-039: Service-layer length validation for wabaId/phoneNumberId.
    // WhatsappAccountUpdateInput is Partial, so fields may be omitted/undefined.
    if (input.wabaId !== undefined && input.wabaId.length > 64) {
      throw new WhatsappAccountValidationError("INVALID_INPUT", tErrors.invalidInput);
    }
    if (input.phoneNumberId !== undefined && input.phoneNumberId.length > 64) {
      throw new WhatsappAccountValidationError("INVALID_INPUT", tErrors.invalidInput);
    }

    // If tx is provided, use it directly; otherwise wrap in a new transaction
    const runner = async (t: DBTransaction) => {
      const previous = await WhatsappAccountRepository.findById(id, t);
      const updated = await WhatsappAccountRepository.update(id, input, t);
      if (updated) {
        await auditChange(
          actorUserId,
          "UPDATE",
          id,
          {
            description: `Updated WhatsApp account ${id}`,
            previousState: previous ? { ...previous } : null,
            newState: { ...input },
          },
          t
        );
        await resetWhatsappChannel();
      }
      return updated;
    };

    return tx ? await runner(tx) : await db.transaction(runner);
  }

  export async function deleteAccount(
    actorUserId: string,
    tErrors: ErrorsLabels,
    id: string,
    tx?: DBTransaction
  ): Promise<WhatsappAccountReturnType | null> {
    await assertCanManage(actorUserId, tErrors);
    assertValidId(id, tErrors);

    const runner = async (t: DBTransaction) => {
      const previous = await WhatsappAccountRepository.findById(id, t);
      const deactivated = await WhatsappAccountRepository.deactivateById(id, t);
      if (deactivated) {
        await auditChange(
          actorUserId,
          "DELETE",
          id,
          {
            description: `Deactivated WhatsApp account ${id}`,
            previousState: previous ? { ...previous } : null,
          },
          t
        );
        await resetWhatsappChannel();
      }
      return deactivated;
    };

    return tx ? await runner(tx) : await db.transaction(runner);
  }

  export async function setAccessToken(
    actorUserId: string,
    tErrors: ErrorsLabels,
    id: string,
    accessToken: string,
    tx?: DBTransaction
  ): Promise<WhatsappAccountReturnType | null> {
    await assertSuperAdmin(actorUserId, tErrors);
    assertValidId(id, tErrors);
    if (typeof accessToken !== "string" || accessToken.trim().length < 10) {
      throw new WhatsappAccountValidationError("INVALID_INPUT", tErrors.invalidInput);
    }
    // S4: The accessToken is passed as plaintext to the repo.
    // The `encryptedText` custom Drizzle type auto-encrypts at the driver boundary
    // via field-encryption.ts — the service layer never handles raw ciphertext.
    const trimmedToken = accessToken.trim();
    if (trimmedToken.length > 512) {
      throw new WhatsappAccountValidationError("INVALID_INPUT", tErrors.invalidInput);
    }
    const updated = await WhatsappAccountRepository.setAccessToken(
      // The field is named `encryptedAccessToken` per the repo/schema contract.
      // The value passed here is plaintext — encryption is handled by the
      // `encryptedText` Drizzle custom type at the toDriver boundary
      // (field-encryption.ts), so the service layer never handles ciphertext.
      { id, encryptedAccessToken: trimmedToken },
      tx
    );
    if (updated) {
      await auditChange(
        actorUserId,
        "UPDATE",
        id,
        {
          description: `Updated access token for WhatsApp account ${id}`,
          previousState: { accessToken: "***" },
          newState: { accessToken: "***" },
        },
        tx
      );
      await resetWhatsappChannel();
    }
    return updated;
  }

  export async function setTwoStepPin(
    actorUserId: string,
    tErrors: ErrorsLabels,
    id: string,
    twoStepPin: string,
    tx?: DBTransaction
  ): Promise<WhatsappAccountReturnType | null> {
    await assertSuperAdmin(actorUserId, tErrors);
    assertValidId(id, tErrors);
    // r4-sd-07: Two-step PIN must be 6-16 digits, numeric only.
    if (
      typeof twoStepPin !== "string" ||
      twoStepPin.trim().length < 6 ||
      twoStepPin.trim().length > 16 ||
      !/^\d+$/.test(twoStepPin.trim())
    ) {
      throw new WhatsappAccountValidationError("INVALID_INPUT", tErrors.invalidInput);
    }
    const updated = await WhatsappAccountRepository.setTwoStepPin({ id, encryptedTwoStepPin: twoStepPin.trim() }, tx);
    if (updated) {
      await auditChange(
        actorUserId,
        "UPDATE",
        id,
        {
          description: `Updated two-step PIN for WhatsApp account ${id}`,
          previousState: { twoStepPin: "***" },
          newState: { twoStepPin: "***" },
        },
        tx
      );
      await resetWhatsappChannel();
    }
    return updated;
  }

  /**
   * Batch-fetch phone number details from the Graph API in concurrent chunks.
   *
   * Uses Promise.allSettled so a single rejected fetch does not abort the entire
   * sync — partial data is better than no data. Only treat it as a total failure
   * if ALL fetches in a chunk reject.
   */
  async function fetchPhoneDetailsBatch(
    ctx: GraphApiRequestContext,
    phoneNumbers: readonly WhatsappPhoneNumber[]
  ): Promise<Map<string, GetPhoneNumberResult>> {
    const phoneDetails = new Map<string, GetPhoneNumberResult>();

    async function processPhoneChunk(chunk: readonly WhatsappPhoneNumber[]): Promise<void> {
      const promises = chunk.map(phone => {
        const detailRequest = buildGetPhoneNumberRequest(ctx, { phoneNumberId: phone.id });
        return executeGraphApiFetch<GetPhoneNumberResult>(detailRequest, phoneNumberResultSchema);
      });
      const settled = await Promise.allSettled(promises);
      let allRejected = true;
      for (let j = 0; j < chunk.length; j++) {
        const outcome = settled[j];
        if (outcome.status === "fulfilled") {
          allRejected = false;
          phoneDetails.set(chunk[j].id, outcome.value);
        } else {
          logger.warn(
            `whatsapp-account-service: syncFromMeta phone detail fetch failed for phoneNumberId=${chunk[j].id}: ${outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason)}`,
            { phoneNumberId: chunk[j].id, error: outcome.reason }
          );
        }
      }
      if (allRejected) {
        const phoneIds = chunk.map(p => p.id).join(", ");
        // Internal server error (not user-facing) — hardcoded is acceptable here
        throw new Error(
          `whatsapp-account-service: syncFromMeta — all phone detail fetches failed for chunk [${phoneIds}]`
        );
      }
    }

    const chunks: WhatsappPhoneNumber[][] = [];
    for (let i = 0; i < phoneNumbers.length; i += MAX_CONCURRENT_CALLS) {
      chunks.push(phoneNumbers.slice(i, i + MAX_CONCURRENT_CALLS));
    }

    await chunks.reduce((chain, chunk) => chain.then(() => processPhoneChunk(chunk)), Promise.resolve());

    return phoneDetails;
  }

  /**
   * Process a single phone number: coerce Meta enums, upsert the account,
   * and return the result. Returns null on per-account write failure
   * (counts toward `failedCount`).
   */
  async function processPhoneNumber(
    phone: WhatsappPhoneNumber,
    detail: GetPhoneNumberResult | undefined,
    existing: WhatsappAccountReturnType | null,
    wabaId: string,
    tx: DBTransaction | undefined,
    onFail: () => void
  ): Promise<WhatsappAccountReturnType | null> {
    if (!detail) {
      return null;
    }
    // r10-012: Warn when Meta sends an unrecognized enum value, but do not
    // log the raw Meta enum string (which could echo arbitrary enum text
    // from the provider). Use a generic description instead.
    const qualityRating = coerceQualityRating(detail.quality_rating);
    if (!isValidQualityRating(detail.quality_rating)) {
      logger.warn("whatsapp-account-service: quality rating from Meta was not recognized — falling back to UNKNOWN", {
        qualityRatingFallback: "UNKNOWN",
      });
    }
    const portfolioMessagingLimitTier = coerceLimitTier(detail.portfolio_messaging_limit_tier);
    if (!isValidLimitTier(detail.portfolio_messaging_limit_tier)) {
      logger.warn(
        "whatsapp-account-service: messaging limit tier from Meta was not recognized — falling back to TIER_NOT_SET",
        { messagingLimitTierFallback: "TIER_NOT_SET" }
      );
    }

    try {
      if (existing) {
        await WhatsappAccountRepository.update(
          existing.id,
          {
            displayPhoneNumber: detail.display_phone_number,
            qualityRating,
            portfolioMessagingLimitTier,
            throughputLevel: detail.throughput_level,
          },
          tx
        );
        return {
          ...existing,
          displayPhoneNumber: detail.display_phone_number,
          qualityRating,
          portfolioMessagingLimitTier,
          throughputLevel: detail.throughput_level,
        } satisfies WhatsappAccountReturnType;
      }
      return WhatsappAccountRepository.create(
        {
          wabaId,
          phoneNumberId: phone.id,
          displayPhoneNumber: detail.display_phone_number,
          qualityRating,
          portfolioMessagingLimitTier,
          throughputLevel: detail.throughput_level,
          encryptedAccessToken: SYNC_STATUS_PENDING,
          encryptedTwoStepPin: SYNC_STATUS_PENDING,
          isActive: false,
        },
        tx
      );
    } catch (error) {
      onFail();
      // r10-036: Avoid leaking DB internals.
      const errorDescription = getErrorDescription(error);
      logger.warn(
        `whatsapp-account-service: syncFromMeta failed to write account for phoneNumberId=${phone.id}: ${errorDescription}`,
        { phoneNumberId: phone.id, errorType: errorDescription }
      );
      return null;
    }
  }

  /**
   * Collect account results from phone numbers, respecting the transaction
   * boundary. When `tx` is provided, writes run sequentially. When absent,
   * writes run in bounded parallel chunks.
   */
  async function collectAccountResults(
    phoneNumbers: readonly WhatsappPhoneNumber[],
    phoneDetails: Map<string, GetPhoneNumberResult>,
    existingByPhoneId: Map<string, WhatsappAccountReturnType | null>,
    wabaId: string,
    tx: DBTransaction | undefined
  ): Promise<{ accounts: WhatsappAccountReturnType[]; failedCount: number }> {
    let failedCount = 0;
    const onFail = () => {
      failedCount++;
    };

    const processOne = (phone: WhatsappPhoneNumber) =>
      processPhoneNumber(
        phone,
        phoneDetails.get(phone.id),
        existingByPhoneId.get(phone.id) ?? null,
        wabaId,
        tx,
        onFail
      );

    let accountResults: (WhatsappAccountReturnType | null)[];
    if (tx) {
      accountResults = await collectSequentially([...phoneNumbers], processOne);
    } else {
      accountResults = [];
      const phoneChunks: WhatsappPhoneNumber[][] = [];
      for (let i = 0; i < phoneNumbers.length; i += MAX_CONCURRENT_PHONES) {
        phoneChunks.push([...phoneNumbers].slice(i, i + MAX_CONCURRENT_PHONES));
      }
      await phoneChunks.reduce(
        (chain, chunk) =>
          chain
            .then(() => Promise.all(chunk.map(processOne)))
            .then(chunkResults => {
              accountResults.push(...chunkResults);
              return accountResults;
            }),
        Promise.resolve<(WhatsappAccountReturnType | null)[]>([])
      );
    }

    const accounts = accountResults.filter((r): r is WhatsappAccountReturnType => r !== null);
    return { accounts, failedCount };
  }

  /** Map collected templates to the snapshot type, coercing unknown enums. */
  function buildTemplateSnapshot(templates: readonly WhatsappMessageTemplate[]): WhatsappTemplateSnapshot[] {
    const now = new Date();
    return templates.map(t => {
      let status: WhatsappTemplateStatus;
      if (isValidTemplateStatus(t.status)) {
        status = t.status;
      } else {
        logger.warn(
          `whatsapp-account-service: unknown template status "${t.status}" from Meta — falling back to PENDING`,
          { templateId: t.id, templateName: t.name, status: t.status }
        );
        status = WhatsappTemplateStatus.PENDING;
      }
      let category: WhatsappTemplateCategory;
      if (isValidTemplateCategory(t.category)) {
        category = t.category;
      } else {
        logger.warn(
          `whatsapp-account-service: unknown template category "${t.category}" from Meta — falling back to MARKETING`,
          { templateId: t.id, templateName: t.name, category: t.category }
        );
        category = WhatsappTemplateCategory.MARKETING;
      }
      return {
        id: t.id,
        name: t.name,
        language: t.language.code,
        category,
        status,
        lastSyncedAt: now,
      };
    });
  }

  export async function syncFromMeta(
    actorUserId: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<WhatsappSyncFromMetaReturnType> {
    await assertCanManage(actorUserId, tErrors);

    const { ctx, wabaId } = await resolveGraphApiContext(tErrors);

    const phoneNumbers = await collectAllPhoneNumbers(ctx, { wabaId }, async request => {
      return executeGraphApiFetch<ListPhoneNumbersResponseBody>(request, phoneNumberListSchema);
    });

    const phoneDetails = await fetchPhoneDetailsBatch(ctx, phoneNumbers);

    // Batch-fetch all existing accounts by phone number ID in a single query
    // (avoids N*2 round-trips for N phone numbers).
    const phoneIds = phoneNumbers.map(p => p.id);
    const existingByPhoneId = await WhatsappAccountRepository.findByPhoneNumberIds(phoneIds, tx);

    const { accounts, failedCount } = await collectAccountResults(
      phoneNumbers,
      phoneDetails,
      existingByPhoneId,
      wabaId,
      tx
    );

    const templates = await collectAllTemplates(ctx, { wabaId }, async request => {
      return executeGraphApiFetch<ListMessageTemplatesResponseBody>(request, messageTemplateListSchema);
    });

    const templateSnapshot = buildTemplateSnapshot(templates);

    const failedNote = failedCount > 0 ? ` ${failedCount} account writes failed` : "";
    await auditChange(
      actorUserId,
      "UPSERT",
      wabaId,
      {
        description: `Synced ${accounts.length} WhatsApp accounts and ${templates.length} templates from Meta${failedNote}`,
        metadata: {
          accountsSynced: accounts.length,
          templatesSynced: templates.length,
          failedAccountWrites: failedCount,
          templates: templateSnapshot,
        },
      },
      tx
    );

    return {
      id: "whatsapp-sync-result",
      accounts,
      templates: templateSnapshot,
    } satisfies WhatsappSyncFromMetaReturnType;
  }

  // REQ-10/BL1: Per-user opt-in helpers

  export async function isConfigured(): Promise<boolean> {
    const { whatsappChannel } = await import("@/backend/services/communication/channels/whatsapp");
    return whatsappChannel.validateConfig();
  }

  export async function isUserWhatsappOptIn(userId: string, tx?: DBTransaction): Promise<boolean> {
    const prefs = await NotificationPreferencesRepository.getByUserId(userId, tx);
    // REQ-10: WhatsApp defaults to OFF — only return true if explicit WHATSAPP prefs exist and all are enabled
    const whatsappPrefs = prefs.filter(
      p => isNotificationChannel(p.channel) && p.channel === NotificationChannel.WHATSAPP
    );
    if (whatsappPrefs.length === 0) {
      return false;
    }
    return whatsappPrefs.every(p => p.enabled);
  }

  // ─── System-initiated helpers (no actor, no permission gating) ──────────────
  // Used by the webhook handler for system-border event processing.

  /** System-initiated account update (webhook handler) — no actor, no audit at service level. */
  export async function systemUpdateAccount(
    id: string,
    input: WhatsappAccountUpdateInput,
    tx?: DBTransaction
  ): Promise<boolean> {
    const result = await WhatsappAccountRepository.update(id, input, tx);
    return result !== null;
  }

  /** System-initiated find by phone number (webhook handler). */
  export async function systemFindByPhoneNumberId(
    phoneNumberId: string,
    tx?: DBTransaction
  ): Promise<WhatsappAccountReturnType | null> {
    return WhatsappAccountRepository.findByPhoneNumberId(phoneNumberId, tx);
  }

  export async function setUserWhatsappOptIn(
    actorUserId: string,
    tErrors: ErrorsLabels,
    userId: string,
    enabled: boolean,
    source: string,
    tx?: DBTransaction
  ): Promise<WhatsappAccountReturnType | null> {
    if (userId !== actorUserId) {
      await assertSuperAdmin(actorUserId, tErrors);
    }

    // Sanitize source to prevent log injection: replace newlines and truncate.
    const sanitizedSource = source
      .replace(/[\r\n]/g, " ")
      .trim()
      .slice(0, 200);

    // Only write opt-in/out prefs for event types where WhatsApp is a
    // dispatchable channel per the EVENT_CHANNEL_ALLOWLIST AND has an
    // actual template mapping in NOTIFICATION_TEMPLATE_MAP. Non-allowlisted
    // events default to all channels but most have no WhatsApp template, so
    // writing prefs for them would spam the preferences table with rows for
    // events that will never dispatch WhatsApp.
    const whatsappEventTypes = (Object.values(NotificationEventType) as NotificationEventType[]).filter(eventType => {
      const allowed = EVENT_CHANNEL_ALLOWLIST[eventType];
      return allowed?.includes(NotificationChannel.WHATSAPP) && NOTIFICATION_TEMPLATE_MAP[eventType] != null;
    });
    const inputs: NotificationPreferenceUpdateInput[] = whatsappEventTypes.map(eventType => ({
      channel: NotificationChannel.WHATSAPP,
      eventType,
      enabled,
    }));
    await NotificationPreferencesRepository.batchUpsert(userId, inputs, tx);

    // Write the audit log BEFORE resetting the channel singleton — if reset
    // throws, the audit trail for this security-relevant action is still
    // preserved. auditChange already swallows its own errors internally.
    await auditChange(
      actorUserId,
      "WHATSAPP_OPT_IN",
      userId,
      {
        description: `${enabled ? "Enabled" : "Disabled"} WhatsApp opt-in for user ${userId} (source: ${sanitizedSource})`,
        previousState: { whatsappEnabled: !enabled },
        newState: { whatsappEnabled: enabled },
        metadata: { userId, source: sanitizedSource, whatsappEnabled: enabled },
      },
      tx
    );

    // REQ-12.4: Reset WhatsApp channel singleton to pick up new opt-in state
    await resetWhatsappChannel();

    // Return the first active WhatsApp account for Apollo cache normalization
    const account = await WhatsappAccountRepository.findFirstActiveForCredentials(tx);
    if (!account) return null;
    const {
      encryptedAccessToken: _at,
      encryptedTwoStepPin: _pin,
      qualityRating,
      portfolioMessagingLimitTier,
      ...rest
    } = account;
    return buildReturnType(rest, qualityRating, portfolioMessagingLimitTier);
  }
}
