/**
 * Service-layer API for the Settings → Session & Security tab.
 *
 * This service is the bridge between the GraphQL resolver (read path guarded
 * with `SETTINGS_VIEW`, write path guarded with `SETTINGS_EDIT_SESSION`) and
 * the {@link SessionConfigRepository} data-access layer.
 *
 * Read path — `listSessionConfigs()` / `getSessionConfig(roleName)`:
 *   No permission check. The GraphQL resolver is expected to guard with
 *   `AppPermission.SETTINGS_VIEW`.
 *
 * Write path — `upsertSessionConfig()` / `deleteSessionConfig()`:
 *   Enforces `AppPermission.SETTINGS_EDIT_SESSION` (else throws
 *   `tErrors.insufficientPermissions`). Validates `ttlSeconds` and
 *   `maxConcurrentSessions` ranges, throwing {@link SessionConfigValidationError}
 *   with a stable `code` discriminator for invalid inputs. After a successful
 *   mutation, emits a best-effort audit log entry via
 *   `AuditService.createManyAuditLogs` — audit failures are swallowed so they
 *   never roll back the mutation.
 *
 * `tErrors: ErrorsLabels` is caller-supplied (mirrors `SiteContentService`,
 * `SystemSettingsService`, and `FxProviderConfigService`) so localized error
 * strings come from the compile-time translation system rather than hardcoded
 * strings. The resolver is responsible for supplying it; if a non-GraphQL
 * caller needs a default, it can call `getServerTranslations(locale ?? "en")
 *   .errorsTranslations` (the same pattern used by `FxProviderConfigService`).
 */

import type { DBTransaction } from "@/backend/db/db.types";
import { SessionConfigRepository } from "@/backend/db/repo";
import { AppPermission } from "@/backend/enum";
import logger from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { AuditService } from "@/backend/services/system/audit.service";
import type { CreateAuditLogInput, SessionConfigSelectType, SessionConfigUpsertInput } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

/** Minimum allowed session TTL, in seconds (1 minute). */
const TTL_SECONDS_MIN = 60;
/** Maximum allowed session TTL, in seconds (28 days = 7 days × 4). */
const TTL_SECONDS_MAX = 604800 * 4;
/** Minimum allowed concurrent-session cap. */
const MAX_CONCURRENT_MIN = 1;
/** Maximum allowed concurrent-session cap. */
const MAX_CONCURRENT_MAX = 50;

/** Discriminator for typed service validation errors (machine-readable). */
export type SessionConfigValidationErrorCode =
  | "ETTL_OUT_OF_RANGE"
  | "EMAX_CONCURRENT_OUT_OF_RANGE"
  | "EROLE_NAME_REQUIRED";

/**
 * Typed error thrown by the session-config service when input validation fails.
 *
 * Carries a stable `code` field so callers (e.g. GraphQL resolvers) can map
 * to localized error strings without regex-matching `message`.
 */
export class SessionConfigValidationError extends Error {
  readonly code: SessionConfigValidationErrorCode;

  constructor(code: SessionConfigValidationErrorCode, message: string) {
    super(message);
    this.name = "SessionConfigValidationError";
    this.code = code;
  }
}

/** Enforces `SETTINGS_EDIT_SESSION`; throws `tErrors.insufficientPermissions` on miss. */
async function assertManagePermission(actorUserId: string, tErrors: ErrorsLabels): Promise<void> {
  const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.SETTINGS_EDIT_SESSION);
  if (!hasPermission) {
    throw new Error(tErrors.insufficientPermissions);
  }
}

/** Validates an upsert input, throwing {@link SessionConfigValidationError} on violation. */
function validateUpsertInput(input: SessionConfigUpsertInput): void {
  if (!input.roleName || input.roleName.trim().length === 0) {
    throw new SessionConfigValidationError("EROLE_NAME_REQUIRED", "Session config requires a non-empty roleName.");
  }
  if (input.ttlSeconds < TTL_SECONDS_MIN || input.ttlSeconds > TTL_SECONDS_MAX) {
    throw new SessionConfigValidationError(
      "ETTL_OUT_OF_RANGE",
      `ttlSeconds must be between ${TTL_SECONDS_MIN} and ${TTL_SECONDS_MAX} (28 days).`
    );
  }
  if (input.maxConcurrentSessions < MAX_CONCURRENT_MIN || input.maxConcurrentSessions > MAX_CONCURRENT_MAX) {
    throw new SessionConfigValidationError(
      "EMAX_CONCURRENT_OUT_OF_RANGE",
      `maxConcurrentSessions must be between ${MAX_CONCURRENT_MIN} and ${MAX_CONCURRENT_MAX}.`
    );
  }
}

/** Best-effort audit emit — never throws. */
async function emitAudit(
  actorUserId: string,
  action: "UPSERT" | "DELETE",
  roleName: string,
  tx?: DBTransaction
): Promise<void> {
  const input: CreateAuditLogInput = {
    actorUserId,
    actorType: "USER",
    entityType: "SESSION_CONFIG",
    entityId: roleName,
    action,
    description: `Session config '${roleName}' ${action.toLowerCase()}`,
  };

  try {
    await AuditService.createManyAuditLogs([input], tx);
  } catch (error) {
    logger.error(`session-config-service: audit log failed for ${action} on "${roleName}". ${error}`);
  }
}

export namespace SessionConfigService {
  /** Lists every session-config row. Read-only; no permission check. */
  export async function listSessionConfigs(tx?: DBTransaction): Promise<SessionConfigSelectType[]> {
    return SessionConfigRepository.listAll(tx);
  }

  /** Returns the session config for a role, or `null` if absent. Read-only. */
  export async function getSessionConfig(
    roleName: string,
    tx?: DBTransaction
  ): Promise<SessionConfigSelectType | null> {
    return SessionConfigRepository.findByRoleName(roleName, tx);
  }

  /**
   * Creates or updates a session-config row.
   *
   * - Enforces `AppPermission.SETTINGS_EDIT_SESSION` (else
   *   `tErrors.insufficientPermissions`).
   * - Validates `roleName`, `ttlSeconds` (60–2_419_200), and
   *   `maxConcurrentSessions` (1–50); throws {@link SessionConfigValidationError}
   *   with a stable `code` on violation.
   * - Persists via `SessionConfigRepository.upsert`.
   * - Emits a best-effort audit log (`action: "UPSERT"`); audit failure never
   *   blocks the upsert.
   */
  export async function upsertSessionConfig(
    input: SessionConfigUpsertInput,
    actorUserId: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<SessionConfigSelectType> {
    await assertManagePermission(actorUserId, tErrors);
    validateUpsertInput(input);

    const result = await SessionConfigRepository.upsert(input, tx);

    await emitAudit(actorUserId, "UPSERT", input.roleName, tx);

    return result;
  }

  /**
   * Deletes a session-config row by role name.
   *
   * - Enforces `AppPermission.SETTINGS_EDIT_SESSION` (else
   *   `tErrors.insufficientPermissions`).
   * - Removes the row via `SessionConfigRepository.deleteByRoleName`.
   * - Emits a best-effort audit log (`action: "DELETE"`); audit failure never
   *   blocks the delete.
   */
  export async function deleteSessionConfig(
    roleName: string,
    actorUserId: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<void> {
    await assertManagePermission(actorUserId, tErrors);

    await SessionConfigRepository.deleteByRoleName(roleName, tx);

    await emitAudit(actorUserId, "DELETE", roleName, tx);
  }
}
