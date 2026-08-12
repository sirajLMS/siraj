import { ParentRepository } from "@/backend/db/repo/parents";
import type { AppPermission } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services";
import type { BaseEntity, DBTx, ResolutionResult } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";
import type { ErrorsLabels } from "@/shared/locale/types";

/**
 * Shared helpers for {@link ComplaintService} and {@link SuggestionService}.
 * The two services have different entity types but identical management flow:
 * permission gate → parent lookup → resolve-by-id → soft-delete / response.
 *
 * Helpers here are *generic-only* — call sites supply their own permission
 * constants, repository functions, error-message keys and log labels so that
 * i18n, logging and entity-specific behaviour stay intact at the call site.
 */

// ─── Permission & parent resolution ────────────────────────────────────────

/** Permission gate shared by every endpoint in both services. */
export async function assertPermission(actorUserId: string, permission: AppPermission, locale?: string): Promise<void> {
  const allowed = await PermissionsService.hasPermission(actorUserId, permission);
  if (!allowed) {
    const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
    throw new Error(tErrors.insufficientPermissions);
  }
}

/**
 * Permission gate + parent lookup used for parent-side operations
 * (submit, list own history, etc.). Equivalent to:
 *   - {@link ComplaintService.getParentIdForComplaints}
 *   - the inline permission+parent blocks in `submitComplaint`,
 *     `getParentComplaints`, `submitSuggestion`, `getParentSuggestions`.
 */
export async function requireParentByActorUserId(
  actorUserId: string,
  permission: AppPermission,
  locale?: string
): Promise<{ id: string }> {
  await assertPermission(actorUserId, permission, locale);

  const parent = await ParentRepository.findByUserId(actorUserId);
  if (!parent) {
    const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
    throw new Error(tErrors.parentNotFound);
  }
  return parent;
}

// ─── Entity lookup (the "resolveEntity" flow) ──────────────────────────────

/** Resolves a localized not-found message by key, falling back to the key. */
function resolveNotFoundMessage(key: ResolveNotFoundErrorKey, tErrors: ErrorsLabels): string {
  const value = tErrors[key];
  return typeof value === "string" ? value : key;
}

/** Union of the two top-level not-found error keys used by both services. */
type ResolveNotFoundErrorKey = "complaintNotFound" | "suggestionNotFound";

/** Re-exports the union for typed call sites. */
export type { ResolveNotFoundErrorKey };

interface ResolveEntityByIdArgs<T extends BaseEntity> {
  actorUserId: string;
  permission: AppPermission;
  entityId: string;
  /** Repository function that returns the entity by id, e.g. `ComplaintRepository.getComplaintById`. */
  findFn: (id: string, tx?: DBTx) => Promise<T | null>;
  /**
   * Top-level {@link ErrorsLabels} key used for the localized
   * "not found" message. Both communication services use
   * `complaintNotFound` or `suggestionNotFound` from the root of
   * {@link ErrorsLabels}.
   */
  notFoundErrorKey: ResolveNotFoundErrorKey;
  /** Optional transaction to share with downstream writes. */
  tx?: DBTx;
  locale?: string;
  /**
   * Informational label used in resolution logs. When provided, an
   * info-level log statement is emitted on the resolved entity.
   */
  logLabel?: string;
}

/**
 * Generic permission-gated entity resolution: checks permission, fetches the
 * entity, throws the localized not-found error if missing, and optionally
 * logs an info message on success. Used by complaint (`getComplaintFiles`,
 * `complaintResponses.assertCanRespondToComplaint`) and suggestion
 * (`respondToSuggestion`, `markAsDuplicate`, `deleteSuggestion`).
 */
export async function resolveEntityById<T extends BaseEntity>(args: ResolveEntityByIdArgs<T>): Promise<T> {
  await assertPermission(args.actorUserId, args.permission, args.locale);

  const entity = await args.findFn(args.entityId, args.tx);
  if (!entity) {
    const tErrors = getServerTranslations(args.locale ?? "en").errorsTranslations;
    const message = resolveNotFoundMessage(args.notFoundErrorKey, tErrors);
    throw new Error(message);
  }

  if (args.logLabel) {
    logger.info(`Entity resolved via complaintSuggestionBase:${args.logLabel}`, {
      actorUserId: args.actorUserId,
      entityId: args.entityId,
    });
  }

  return entity;
}

// ─── Soft-delete template (deleteComplaint / deleteSuggestion) ─────────────

interface SoftDeleteEntityLogArgs {
  actorUserId: string;
  /** Short human-readable label used in log messages (`Complaint` / `Suggestion`). */
  entityLabel: string;
  /** Lowercase identifier key used in structured logs (`complaintId` / `suggestionId`). */
  idKey: string;
  entityId: string;
  /** Void soft-delete function that returns `{ deletedAt: Date }`. */
  deleteFn: (entityId: string, actorUserId: string) => Promise<{ deletedAt: Date }>;
}

/**
 * Executes a soft delete, emits an info log on success, and re-throws any
 * failure after logging it as an error. The caller is responsible for
 * permission gating (typically via {@link resolveEntityById}) so the soft
 * delete is only attempted on a verifiably-resolved, permitted entity.
 */
export async function softDeleteEntityLog(args: SoftDeleteEntityLogArgs): Promise<{ readonly deletedAt: string }> {
  const logFields = { actorUserId: args.actorUserId, [args.idKey]: args.entityId };

  try {
    const result = await args.deleteFn(args.entityId, args.actorUserId);

    logger.info(`${args.entityLabel} soft-deleted`, {
      ...logFields,
      deletedAt: result.deletedAt,
    });

    return { deletedAt: result.deletedAt.toISOString() };
  } catch (error) {
    logger.error(`Failed to delete ${args.entityLabel.toLowerCase()}`, {
      ...logFields,
      error,
    });
    throw error;
  }
}

// ─── Resolution response constructor ───────────────────────────────────────

/**
 * Builds a `ResolutionResult` indicating whether an admin response was
 * recorded and what the resolution text was. Used by procedural endpoints
 * that record an admin's response to a complaint or suggestion.
 */
export function buildResolutionResponse(resolved: boolean, resolution: string | null): ResolutionResult {
  return { resolved, resolution };
}

// ─── Internal helpers status ──────────────────────────────────────────────

export type { BaseEntity, DBTx };
