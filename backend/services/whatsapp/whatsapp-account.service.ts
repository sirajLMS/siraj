import { z } from "zod";
import { db } from "@/backend/db/drizzleDb";
import { NotificationPreferencesRepository } from "@/backend/db/repo/notifications/notification-preferences.repository";
import { WhatsappAccountRepository } from "@/backend/db/repo/whatsapp";
import { AppPermission, NotificationChannel, NotificationEventType, SystemPermissionGroupSlug } from "@/backend/enum";
import { WhatsappTemplateCategory, WhatsappTemplateStatus } from "@/backend/enum/whatsapp/whatsapp.enum";
import { type WhatsappAccountPurpose, WhatsappOnboardingMode } from "@/backend/enum/whatsapp/whatsapp-account.enum";
import {
  buildReturnType,
  ConflictError,
  coerceLimitTier,
  coerceQualityRating,
  ForbiddenError,
  isValidLimitTier,
  isValidQualityRating,
  NotFoundError,
  WhatsappEmbeddedSignupError,
  WhatsappPurposeRequiresActiveError,
} from "@/backend/lib";
import { logger } from "@/backend/lib/logger";
import {
  FETCH_TIMEOUT_MS,
  MAX_CONCURRENT_CALLS,
  readErrorBody,
  resolveGraphApiContextFromEnv,
  resolveGraphApiVersion,
} from "@/backend/lib/whatsapp-constants";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { GraphApiError } from "@/backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.helpers";
import {
  buildExchangeEmbeddedSignupCodeRequest,
  buildGetPhoneNumberPlatformRequest,
  buildSubscribeAppToWabaRequest,
  parseExchangeEmbeddedSignupCodeResponse,
  parseGetPhoneNumberPlatformResponse,
  parseSubscribeAppToWabaResponse,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/requests";
import { buildGetPhoneNumberRequest } from "@/backend/services/communication/channels/whatsapp/cloud-api/requests/get-phone-number.request";
import { collectAllTemplates } from "@/backend/services/communication/channels/whatsapp/cloud-api/requests/list-message-templates.request";
import { collectAllPhoneNumbers } from "@/backend/services/communication/channels/whatsapp/cloud-api/requests/list-phone-numbers.request";
import { resetWhatsappChannel } from "@/backend/services/communication/channels/whatsapp/WhatsappChannelFactory";
import { EVENT_CHANNEL_ALLOWLIST } from "@/backend/services/notification/notification-dispatch.helpers";
import { NOTIFICATION_TEMPLATE_MAP } from "@/backend/services/notification/notification-payloads.builders";
import { isDuplicateError } from "@/backend/services/shared/is-duplicate-error";
import { resolveEnvConfig, resolveEnvConfigMany } from "@/backend/services/system";
import { AuditService } from "@/backend/services/system/audit.service";
import { WhatsappCoexistenceSyncService } from "@/backend/services/whatsapp/whatsapp-coexistence-sync.service";
// r10-043/r10-044/r10-045: Canonical types imported from the types layer,
// not from service-layer barrels or request builders.
import type {
  AuditAction,
  CreateAuditLogInput,
  DBTransaction,
  ExchangeEmbeddedSignupCodeResponseBody,
  GetPhoneNumberPlatformResponseBody,
  GetPhoneNumberResult,
  GraphApiRequestContext,
  GraphApiRequestInit,
  ListMessageTemplatesResponseBody,
  ListPhoneNumbersResponseBody,
  NotificationPreferenceUpdateInput,
  SubscribedAppsResponseBody,
  UserPermissionContext,
  WhatsappAccountCreateSubmitInput,
  WhatsappAccountReturnType,
  WhatsappAccountUpdateInput,
  WhatsappConfigurationStatusType,
  WhatsappEmbeddedSignupSubmitInput,
  WhatsappMessageTemplate,
  WhatsappPhoneNumber,
  WhatsappSyncFromMetaReturnType,
  WhatsappTemplateSnapshot,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

/** Placeholder string for credentials not yet set via dedicated mutations. */
const SYNC_STATUS_PENDING = "pending" as const;

/**
 * Env keys the env-bootstrap path for `syncFromMeta` depends on. These are
 * `.env`-only (never DB-seeded); the resolver is read-only and never persists
 * values to `system_settings`.
 */
const WHATSAPP_ENV_BOOTSTRAP_KEYS = ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_WABA_ID"] as const;

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
  quality_rating: z.string().optional().default("UNKNOWN"),
  throughput_level: z.string().optional().default("STANDARD"),
  portfolio_messaging_limit_tier: z.string().optional().default("TIER_NOT_SET"),
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
  language: z.union([
    z.string().transform(code => ({ code })),
    z.object({
      code: z.string(),
    }),
  ]),
  status: z.string(),
  category: z.string(),
  components: z.array(z.unknown()).optional(),
  created_time: z.string().optional(),
});

export const messageTemplateListSchema = z.object({
  data: z.array(messageTemplateSchema),
  paging: graphApiPagingSchema,
});

/** Runtime shape of the embedded-signup code-exchange response. */
const embeddedSignupTokenResponseSchema = z.object({
  access_token: z.string().optional(),
  token_type: z.string().optional(),
});

/** Runtime shape of the coexistence platform-confirmation read. */
const phoneNumberPlatformResponseSchema = z.object({
  id: z.string().optional(),
  display_phone_number: z.string().optional(),
  is_on_biz_app: z.boolean().optional(),
  platform_type: z.string().optional(),
});

/** Runtime shape of the `subscribed_apps` response. */
const subscribedAppsResponseSchema = z.object({
  success: z.boolean().optional(),
});

/** Meta numeric IDs (wabaId / phoneNumberId) are digit strings, ≤64 chars. */
const META_NUMERIC_ID_REGEX = /^\d{1,64}$/;

/** Meta App Dashboard root — per-app panels hang off `/<appId>/…`. */
const META_APP_DASHBOARD_BASE_URL = "https://developers.facebook.com/apps";

function isValidMetaNumericId(value: string): boolean {
  return META_NUMERIC_ID_REGEX.test(value);
}

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

/**
 * Resolves the Graph API context for `syncFromMeta`.
 *
 * Credentials come from the active GENERAL-purpose account row (DB-managed,
 * per-account) — this is the normal path once any WhatsApp account exists.
 * The env-global `WHATSAPP_ACCESS_TOKEN` path survives ONLY as the bootstrap
 * path for provisioning the very first account: before the first account row
 * exists there is no DB-managed token to read. As soon as an active account
 * exists, the env token is ignored for account sync.
 */
async function resolveGraphApiContext(tErrors: ErrorsLabels): Promise<{ ctx: GraphApiRequestContext; wabaId: string }> {
  const wabaId = await resolveEnvConfig("WHATSAPP_WABA_ID");
  if (!wabaId) {
    throw new Error(tErrors.whatsappWabaIdNotConfigured);
  }
  const apiVersion = await resolveGraphApiVersion();

  const account = await WhatsappAccountRepository.findActiveGeneral();
  // `encryptedText.fromDriver` decrypts at the driver boundary — the column
  // value read here is already the plaintext token.
  if (account?.encryptedAccessToken && !account.encryptedAccessToken.startsWith("demo-") && account.wabaId === wabaId) {
    return { ctx: { accessToken: account.encryptedAccessToken, apiVersion }, wabaId };
  }

  // Bootstrap path — no usable DB-managed account yet, fall back to the
  // env-global access token (provisioning the first account).
  const envContext = await resolveGraphApiContextFromEnv(tErrors);
  return { ctx: { accessToken: envContext.accessToken, apiVersion }, wabaId };
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

// ─── Embedded Signup (coexistence onboarding) helpers ───────────────────────
// Server side of the ES v4 flow: the browser captures a single-use
// authorization `code` + WABA/phone asset IDs; the steps below exchange the
// code, resolve the phone number, confirm coexistence eligibility, attach the
// app to the WABA, then create the account row with `onboardingMode:
// COEXISTENCE`. Every Meta failure surfaces to the client as
// `WhatsappEmbeddedSignupError` (`whatsapp.embeddedSignupFailed`) — internal
// detail is logged, never echoed.

/** Wraps any unknown ES-step failure in the localized domain error. */
function wrapEmbeddedSignupError(error: unknown, fallbackMessage: string, step: string): WhatsappEmbeddedSignupError {
  logger.error(
    `whatsapp-account-service: embedded signup ${step} failed: ${error instanceof Error ? error.message : String(error)}`,
    { step, error }
  );
  return new WhatsappEmbeddedSignupError(fallbackMessage, {
    cause: error instanceof Error ? error : undefined,
  });
}

/** Exchanges the single-use ES authorization code for a business-integration token. */
async function exchangeEmbeddedSignupCode(
  code: string,
  appId: string,
  appSecret: string,
  apiVersion: string,
  failureMessage: string
): Promise<string> {
  try {
    const request = buildExchangeEmbeddedSignupCodeRequest(apiVersion, { appId, appSecret, code });
    const body = await executeGraphApiFetch<ExchangeEmbeddedSignupCodeResponseBody>(
      request,
      embeddedSignupTokenResponseSchema
    );
    return parseExchangeEmbeddedSignupCodeResponse(body).accessToken;
  } catch (error) {
    throw wrapEmbeddedSignupError(error, failureMessage, "codeExchange");
  }
}

/**
 * Resolves the phone number for the onboarding WABA. When the client session
 * supplied a `phoneNumberId` it wins; otherwise the WABA's phone list is read
 * (must contain exactly one number to be unambiguous).
 */
async function resolveEmbeddedSignupPhoneNumber(
  ctx: GraphApiRequestContext,
  wabaId: string,
  phoneNumberId: string | undefined,
  failureMessage: string
): Promise<{ phoneNumberId: string; displayPhoneNumber: string | null }> {
  if (phoneNumberId) {
    return { phoneNumberId, displayPhoneNumber: null };
  }
  try {
    const phones = await collectAllPhoneNumbers(ctx, { wabaId }, request =>
      executeGraphApiFetch<ListPhoneNumbersResponseBody>(request, phoneNumberListSchema)
    );
    if (phones.length !== 1) {
      throw new WhatsappEmbeddedSignupError(failureMessage);
    }
    return { phoneNumberId: phones[0].id, displayPhoneNumber: phones[0].display_phone_number ?? null };
  } catch (error) {
    throw wrapEmbeddedSignupError(error, failureMessage, "phoneResolution");
  }
}

/**
 * Confirms the coexistence preconditions on the resolved number: the business
 * app must still be installed (`is_on_biz_app`) and the number must be
 * Cloud-API reachable (`platform_type === "CLOUD_API"`).
 */
async function confirmEmbeddedSignupCoexistence(
  ctx: GraphApiRequestContext,
  phoneNumberId: string,
  failureMessage: string
): Promise<string | null> {
  try {
    const request = buildGetPhoneNumberPlatformRequest(ctx, { phoneNumberId });
    const body = await executeGraphApiFetch<GetPhoneNumberPlatformResponseBody>(
      request,
      phoneNumberPlatformResponseSchema
    );
    const platform = parseGetPhoneNumberPlatformResponse(body);
    if (!platform.isOnBizApp || platform.platformType !== "CLOUD_API") {
      throw new WhatsappEmbeddedSignupError(failureMessage);
    }
    return platform.displayPhoneNumber;
  } catch (error) {
    throw wrapEmbeddedSignupError(error, failureMessage, "coexistenceConfirm");
  }
}

/**
 * Attaches the app to the WABA. A failure here is not onboarding-blocking —
 * the account exists; the missing subscription surfaces as a settings
 * warning instead.
 */
async function subscribeAppToWaba(ctx: GraphApiRequestContext, wabaId: string): Promise<void> {
  try {
    const request = buildSubscribeAppToWabaRequest(ctx, { wabaId });
    const body = await executeGraphApiFetch<SubscribedAppsResponseBody>(request, subscribedAppsResponseSchema);
    parseSubscribeAppToWabaResponse(body);
  } catch (error) {
    logger.warn(
      `whatsapp-account-service: subscribed_apps call failed for waba ${wabaId.slice(-4)}: ${error instanceof Error ? error.message : String(error)}`,
      { error }
    );
  }
}

export namespace WhatsappAccountService {
  /**
   * All accounts for the numbers management surface — active and inactive.
   * Synced numbers are created inactive (credentials pending), so an
   * active-only list would make the sync flow appear to add nothing.
   */
  export async function listAccounts(
    actorUserId: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<WhatsappAccountReturnType[]> {
    await assertCanView(actorUserId, tErrors);
    return WhatsappAccountRepository.listAll(tx);
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
        await resetWhatsappChannel(id);
      }
      return updated;
    };

    return tx ? await runner(tx) : await db.transaction(runner);
  }

  /**
   * Assign or change the routing purpose of an account
   * (`WHATSAPP_CONFIG_MANAGE`; permission context passed in from the caller so
   * no extra user-context DB query happens). Purpose assignment on an inactive
   * account is rejected — routing only considers active rows, so assigning a
   * purpose to an inactive account would silently misroute sends.
   */
  export async function updateAccountPurpose(
    actorUserId: string,
    context: UserPermissionContext,
    tErrors: ErrorsLabels,
    id: string,
    purpose: WhatsappAccountPurpose,
    tx?: DBTransaction
  ): Promise<WhatsappAccountReturnType> {
    const ok = await PermissionsService.hasPermission(context, AppPermission.WHATSAPP_CONFIG_MANAGE);
    if (!ok) {
      throw new ForbiddenError(tErrors.insufficientPermissions);
    }
    assertValidId(id, tErrors);

    const runner = async (t: DBTransaction): Promise<WhatsappAccountReturnType> => {
      const previous = await WhatsappAccountRepository.findById(id, t);
      if (!previous) {
        throw new NotFoundError("WHATSAPP_ACCOUNT", tErrors.whatsappAccountNotFound(id));
      }
      if (!previous.isActive) {
        throw new WhatsappPurposeRequiresActiveError(tErrors.whatsappPurposeRequiresActive);
      }
      const updated = await WhatsappAccountRepository.update(id, { purpose }, t);
      if (!updated) {
        throw new NotFoundError("WHATSAPP_ACCOUNT", tErrors.whatsappAccountNotFound(id));
      }
      await auditChange(
        actorUserId,
        "UPDATE",
        id,
        {
          description: `Updated WhatsApp account ${id} purpose to ${purpose}`,
          previousState: { purpose: previous.purpose },
          newState: { purpose },
        },
        t
      );
      await resetWhatsappChannel(id);
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
        await resetWhatsappChannel(id);
      }
      return deactivated;
    };

    return tx ? await runner(tx) : await db.transaction(runner);
  }

  /**
   * Verifies a token against Meta's Graph API for the given phone number and
   * reports whether Meta considers the number CONNECTED. Returns
   * `isValid = false` (and `isConnected = false`) instead of throwing on any
   * network or API error so callers can safely persist credentials regardless.
   */
  export async function checkPhoneNumberStatusWithToken(
    phoneNumberId: string,
    accessToken: string,
    apiVersion: string
  ): Promise<{ isValid: boolean; status?: string; isConnected: boolean }> {
    try {
      const request = buildGetPhoneNumberRequest({ accessToken, apiVersion }, { phoneNumberId });
      const detail = await executeGraphApiFetch<GetPhoneNumberResult>(request, phoneNumberResultSchema);
      const isConnected = detail.status?.toUpperCase() === "CONNECTED";
      return {
        isValid: true,
        status: detail.status,
        isConnected,
      };
    } catch (error) {
      logger.warn(
        `whatsapp-account-service: checkPhoneNumberStatusWithToken failed for phoneNumberId=${phoneNumberId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        { phoneNumberId, error }
      );
      return { isValid: false, isConnected: false };
    }
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

    // Validate the new token against Meta and derive the account's active flag
    // from the real phone-number status. A token that cannot reach the number
    // (or a number Meta reports as non-CONNECTED) must not be marked active.
    const existingAccount = await WhatsappAccountRepository.findById(id, tx);
    let isActive: boolean | undefined;
    if (existingAccount) {
      const apiVersion = await resolveGraphApiVersion();
      const verification = await checkPhoneNumberStatusWithToken(
        existingAccount.phoneNumberId,
        trimmedToken,
        apiVersion
      );
      isActive = verification.isValid && verification.isConnected;
    }

    const updated = await WhatsappAccountRepository.setAccessToken(
      // The field is named `encryptedAccessToken` per the repo/schema contract.
      // The value passed here is plaintext — encryption is handled by the
      // `encryptedText` Drizzle custom type at the toDriver boundary
      // (field-encryption.ts), so the service layer never handles ciphertext.
      { id, encryptedAccessToken: trimmedToken, isActive },
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
      await resetWhatsappChannel(id);
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
      await resetWhatsappChannel(id);
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
    ctx: GraphApiRequestContext,
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
      const isConnected = detail.status?.toUpperCase() === "CONNECTED";
      const hasUsableToken = ctx.accessToken.trim().length > 0 && ctx.accessToken !== SYNC_STATUS_PENDING;

      if (existing) {
        // Reflect Meta's real connectivity status on the account. An existing
        // account keeps its own token; only its active flag is re-synced.
        await WhatsappAccountRepository.update(
          existing.id,
          {
            displayPhoneNumber: detail.display_phone_number,
            qualityRating,
            portfolioMessagingLimitTier,
            throughputLevel: detail.throughput_level,
            isActive: isConnected,
          },
          tx
        );
        return {
          ...existing,
          isActive: isConnected,
          displayPhoneNumber: detail.display_phone_number,
          qualityRating,
          portfolioMessagingLimitTier,
          throughputLevel: detail.throughput_level,
        } satisfies WhatsappAccountReturnType;
      }

      // New number: the detail fetch above already proved `ctx.accessToken` can
      // reach this number's Graph API endpoint. When Meta reports the number
      // CONNECTED, adopt the sync token and mark it active; otherwise store a
      // pending placeholder so it stays visibly inactive until credentials land.
      return WhatsappAccountRepository.create(
        {
          wabaId,
          phoneNumberId: phone.id,
          displayPhoneNumber: detail.display_phone_number,
          qualityRating,
          portfolioMessagingLimitTier,
          throughputLevel: detail.throughput_level,
          encryptedAccessToken: isConnected && hasUsableToken ? ctx.accessToken : SYNC_STATUS_PENDING,
          encryptedTwoStepPin: SYNC_STATUS_PENDING,
          isActive: isConnected && hasUsableToken,
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
    ctx: GraphApiRequestContext,
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
        ctx,
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
      ctx,
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

  /**
   * Completes Embedded Signup (coexistence) onboarding end-to-end:
   * exchange the single-use code → resolve the phone number → confirm the
   * number still runs the Business app and is Cloud-API reachable → attach
   * the app to the WABA → create the account row (`onboardingMode:
   * COEXISTENCE`, business-integration token stored) → enqueue the one-shot
   * contacts/history sync. The account persists even when the sync enqueue
   * fails — onboarding is complete once Meta accepts the credentials.
   *
   * The authorization code is single-use: a replayed or expired code fails
   * the Meta exchange call and surfaces as `whatsapp.embeddedSignupFailed`.
   */
  export async function completeEmbeddedSignup(
    actorUserId: string,
    tErrors: ErrorsLabels,
    input: WhatsappEmbeddedSignupSubmitInput,
    tx?: DBTransaction
  ): Promise<WhatsappAccountReturnType> {
    await assertCanManage(actorUserId, tErrors);

    const code = input.code.trim();
    const wabaId = input.wabaId.trim();
    const phoneNumberId = input.phoneNumberId?.trim() ?? undefined;
    if (code.length === 0 || code.length > 2048 || !isValidMetaNumericId(wabaId)) {
      throw new WhatsappAccountValidationError("INVALID_INPUT", tErrors.invalidInput);
    }
    if (phoneNumberId !== undefined && !isValidMetaNumericId(phoneNumberId)) {
      throw new WhatsappAccountValidationError("INVALID_INPUT", tErrors.invalidInput);
    }

    const appId = await resolveEnvConfig("WHATSAPP_APP_ID");
    const appSecret = await resolveEnvConfig("WHATSAPP_APP_SECRET");
    if (!appId || !appSecret) {
      logger.error("whatsapp-account-service: embedded signup aborted — app credentials not configured");
      throw new WhatsappEmbeddedSignupError(tErrors.whatsappEmbeddedSignupFailed);
    }
    const apiVersion = await resolveGraphApiVersion();

    const accessToken = await exchangeEmbeddedSignupCode(
      code,
      appId,
      appSecret,
      apiVersion,
      tErrors.whatsappEmbeddedSignupFailed
    );
    const ctx: GraphApiRequestContext = { accessToken, apiVersion };

    const resolved = await resolveEmbeddedSignupPhoneNumber(
      ctx,
      wabaId,
      phoneNumberId,
      tErrors.whatsappEmbeddedSignupFailed
    );
    const confirmedDisplayNumber = await confirmEmbeddedSignupCoexistence(
      ctx,
      resolved.phoneNumberId,
      tErrors.whatsappEmbeddedSignupFailed
    );
    const displayPhoneNumber = confirmedDisplayNumber ?? resolved.displayPhoneNumber;

    const existing = await WhatsappAccountRepository.findByPhoneNumberId(resolved.phoneNumberId, tx);
    if (existing) {
      throw wrapEmbeddedSignupError(
        new ConflictError(`WhatsApp account already exists for phoneNumberId ***${resolved.phoneNumberId.slice(-4)}`),
        tErrors.whatsappEmbeddedSignupFailed,
        "duplicateCheck"
      );
    }

    await subscribeAppToWaba(ctx, wabaId);

    // A concurrent signup that passed the duplicate pre-check above loses at
    // the unique `phone_number_id` index (SQLSTATE 23505); surface the same
    // localized onboarding failure instead of leaking the raw driver error.
    let account: WhatsappAccountReturnType;
    try {
      account = await WhatsappAccountRepository.create(
        {
          wabaId,
          phoneNumberId: resolved.phoneNumberId,
          displayPhoneNumber,
          onboardingMode: WhatsappOnboardingMode.COEXISTENCE,
          // Plaintext token — the `encryptedText` column encrypts at the driver
          // boundary (same contract as setAccessToken).
          encryptedAccessToken: accessToken,
          encryptedTwoStepPin: SYNC_STATUS_PENDING,
          isActive: true,
        },
        tx
      );
    } catch (error) {
      if (isDuplicateError(error)) {
        throw wrapEmbeddedSignupError(error, tErrors.whatsappEmbeddedSignupFailed, "accountCreate");
      }
      throw error;
    }

    await auditChange(
      actorUserId,
      "CREATE",
      account.id,
      {
        description: `Completed WhatsApp embedded signup (coexistence) for ${maskPhoneNumber(displayPhoneNumber)}`,
        newState: { wabaId, phoneNumberId: resolved.phoneNumberId, onboardingMode: WhatsappOnboardingMode.COEXISTENCE },
      },
      tx
    );
    await resetWhatsappChannel(account.id);

    try {
      // No caller tx: the sync POSTs to Meta must never sit inside a caller
      // transaction (see the sync service's contract JSDoc).
      await WhatsappCoexistenceSyncService.enqueuePostOnboardingSync(account.id, tErrors);
    } catch (error) {
      logger.error(
        `whatsapp-account-service: post-onboarding sync enqueue failed for account ${account.id}: ${error instanceof Error ? error.message : String(error)}`,
        { accountId: account.id, error }
      );
    }

    return account;
  }

  // REQ-10/BL1: Per-user opt-in helpers

  /**
   * Per-account health hook: validates that the channel for a single account
   * can resolve credentials. Never throws — missing, inactive, or offboarded
   * accounts report `false` so callers can render health surfaces.
   */
  export async function validateAccountConfig(accountId: string): Promise<boolean> {
    const { validateWhatsappChannelConfig } = await import("@/backend/services/communication/channels/whatsapp");
    try {
      return await validateWhatsappChannelConfig(accountId);
    } catch (error) {
      logger.warn("whatsapp-account-service: validateAccountConfig failed", {
        accountId,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Deep link to the Meta App Dashboard "Facebook Login for Business" settings
   * panel (Client OAuth settings → Allowed domains / Valid OAuth redirect URIs),
   * derived from the configured WhatsApp app id. Embedded Signup only returns
   * the onboarding code to pages hosted on registered origins. Returns null
   * when the app id is not configured.
   */
  export async function resolveEmbeddedSignupAllowedOriginsUrl(): Promise<string | null> {
    const appId = await resolveEnvConfig("WHATSAPP_APP_ID");
    if (!appId) {
      return null;
    }
    return `${META_APP_DASHBOARD_BASE_URL}/${appId}/fb-business-login/settings/`;
  }

  /**
   * Reports how WhatsApp Cloud API configuration is satisfied.
   *
   * WhatsApp is considered configured when at least one active account
   * resolves healthy credentials OR the env-bootstrap path is fully configured
   * (both `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_WABA_ID` resolve non-empty) —
   * the bootstrap path is what powers the very first `syncFromMeta` when no
   * account rows exist yet. `missingEnvKeys` is computed independently of
   * account validity so callers can always explain the env-bootstrap state.
   */
  export async function getConfigurationStatus(): Promise<WhatsappConfigurationStatusType> {
    const [accounts, envValues] = await Promise.all([
      WhatsappAccountRepository.listActive(),
      resolveEnvConfigMany([...WHATSAPP_ENV_BOOTSTRAP_KEYS]),
    ]);
    const missingEnvKeys = WHATSAPP_ENV_BOOTSTRAP_KEYS.filter(key => !envValues[key]?.trim());
    const envBootstrapAvailable = missingEnvKeys.length === 0;

    let hasValidAccount = false;
    if (accounts.length > 0) {
      const results = await Promise.all(accounts.map(account => validateAccountConfig(account.id)));
      hasValidAccount = results.some(Boolean);
    }

    return {
      isConfigured: hasValidAccount || envBootstrapAvailable,
      envBootstrapAvailable,
      missingEnvKeys,
    };
  }

  /**
   * Aggregate configuration check across accounts and the env-bootstrap path.
   * Thin wrapper over {@link getConfigurationStatus}.
   */
  export async function isConfigured(): Promise<boolean> {
    const status = await getConfigurationStatus();
    return status.isConfigured;
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

    // Only write opt-in/out prefs for event types that can dispatch over
    // WhatsApp: dispatch treats an EVENT_CHANNEL_ALLOWLIST entry that omits
    // WHATSAPP as "WhatsApp excluded", while an ABSENT entry means the event
    // dispatches over all channels (whatsapp included). The
    // NOTIFICATION_TEMPLATE_MAP check additionally skips events with no
    // WhatsApp template, so the preferences table is not spammed with rows
    // for events that will never dispatch WhatsApp.
    const whatsappEventTypes = (Object.values(NotificationEventType) as NotificationEventType[]).filter(eventType => {
      const allowed = EVENT_CHANNEL_ALLOWLIST[eventType];
      return (
        (!allowed || allowed.includes(NotificationChannel.WHATSAPP)) && NOTIFICATION_TEMPLATE_MAP[eventType] != null
      );
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
