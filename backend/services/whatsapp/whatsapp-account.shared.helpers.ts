import type { ZodType } from "zod";
import { WhatsappAccountRepository } from "@/backend/db/repo/whatsapp";
import { AppPermission, SystemPermissionGroupSlug } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import {
  FETCH_TIMEOUT_MS,
  resolveGraphApiContextFromEnv,
  resolveGraphApiVersion,
} from "@/backend/lib/whatsapp-constants";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { GraphApiError } from "@/backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.helpers";
import {
  noFollowRedirectInit,
  readJsonWithByteBudget,
  readResponseBodyWithByteBudget,
} from "@/backend/services/shared/outbound-fetch-guard";
import { resolveEnvConfig } from "@/backend/services/system";
import { auditWhatsappChange, type WhatsappAuditChangeOptions } from "@/backend/services/whatsapp/__shared__";
import { UUID_REGEX } from "@/backend/services/whatsapp/whatsapp-account.constants";
import type { AuditAction, DBTransaction, GraphApiRequestContext, GraphApiRequestInit } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

/**
 * Validation error specific to the WhatsApp account service.
 *
 * Carries a stable `code` so the GraphQL resolver can map to a localized
 * error string without regex-matching `message`.
 */
export class WhatsappAccountValidationError extends Error {
  readonly code: "INVALID_INPUT" | "INVALID_ID";

  constructor(code: "INVALID_INPUT" | "INVALID_ID", message: string) {
    super(message);
    this.name = "WhatsappAccountValidationError";
    this.code = code;
  }
}

/** Asserts `id` is a valid UUID, throwing a validation error otherwise. */
export function assertValidId(id: string, tErrors: ErrorsLabels): void {
  if (!UUID_REGEX.test(id)) {
    throw new WhatsappAccountValidationError("INVALID_ID", tErrors.invalidInput);
  }
}

/**
 * Extracts a safe error description from an unknown error value.
 * Avoids leaking DB internals per r10-036.
 */
export function getErrorDescription(error: unknown): string {
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
export function maskPhoneNumber(phone: string | undefined | null): string {
  if (!phone) {
    return "unknown";
  }
  const last4 = phone.slice(-4);
  return `***${last4}`;
}

/**
 * Runs an async mapper over items sequentially, collecting results into an array.
 *
 * Intentionally sequential (not parallel) for transaction safety: when a `tx`
 * is passed, all writes share a single drizzle pg connection. Parallel queries
 * on the same connection are unsafe and can cause deadlocks / interleaved
 * protocol frames. When no `tx` is present (default `db`), each call uses its
 * own connection and `Promise.all` is used instead.
 */
export async function collectSequentially<T, R>(items: readonly T[], mapper: (item: T) => Promise<R>): Promise<R[]> {
  const results = await Promise.all(items.map(mapper));
  return results;
}

export async function assertCanView(actorUserId: string, tErrors: ErrorsLabels): Promise<void> {
  const ok = await PermissionsService.hasPermission(actorUserId, AppPermission.WHATSAPP_VIEW);
  if (!ok) {
    throw new Error(tErrors.insufficientPermissions);
  }
}

export async function assertCanManage(actorUserId: string, tErrors: ErrorsLabels): Promise<void> {
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
export async function assertSuperAdmin(actorUserId: string, tErrors: ErrorsLabels): Promise<void> {
  const context = await PermissionsService.getUserContext(actorUserId);
  if (!context.isSuperAdmin && !context.permissionGroups.includes(SystemPermissionGroupSlug.SUPER_ADMIN)) {
    throw new Error(tErrors.insufficientPermissions);
  }
}

export async function auditChange(
  actorUserId: string,
  action: AuditAction,
  entityId: string,
  options: WhatsappAuditChangeOptions,
  tx?: DBTransaction
): Promise<void> {
  return auditWhatsappChange("whatsapp-account-service", actorUserId, action, entityId, options, tx);
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
export async function resolveGraphApiContext(
  tErrors: ErrorsLabels
): Promise<{ ctx: GraphApiRequestContext; wabaId: string }> {
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
export async function executeGraphApiFetch<T>(request: GraphApiRequestInit, schema: ZodType<T>): Promise<T> {
  const response = await fetch(request.url, {
    ...request.init,
    ...noFollowRedirectInit(),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    const errorBody = await readResponseBodyWithByteBudget(response);
    throw new GraphApiError(response.status, errorBody);
  }
  const raw: unknown = await readJsonWithByteBudget(response);
  return schema.parse(raw);
}

/**
 * Per-account health hook: validates that the channel for a single account
 * can resolve credentials. Never throws — missing, inactive, or offboarded
 * accounts report `false` so callers can render health surfaces.
 */
export async function validateAccountConfigInternal(accountId: string): Promise<boolean> {
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
