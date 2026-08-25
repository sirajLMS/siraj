import { ParentRepository } from "@/backend/db/repo/parents";
import type { AppPermission } from "@/backend/enum";
import { NotFoundError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import { assertHasPermission } from "@/backend/services/shared";
import type {
  BaseEntity,
  DBTx,
  ResolutionResult,
  ResolveEntityByIdArgs,
  ResolveNotFoundErrorKey,
  SoftDeleteEntityLogArgs,
} from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";
import type { ErrorsLabels } from "@/shared/locale/types";

export type { ResolveEntityByIdArgs, ResolveNotFoundErrorKey, SoftDeleteEntityLogArgs };

/** Permission gate shared by every endpoint in both services. */
export async function assertPermission(actorUserId: string, permission: AppPermission, locale?: string): Promise<void> {
  const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
  return assertHasPermission(actorUserId, permission, tErrors.insufficientPermissions);
}

/**
 * Permission gate + parent lookup used for parent-side operations
 * (submit, list own history, etc.).
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

/** Resolves a localized not-found message by key, falling back to the key. */
function resolveNotFoundMessage(key: ResolveNotFoundErrorKey, tErrors: ErrorsLabels): string {
  const value = tErrors[key];
  return typeof value === "string" ? value : key;
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
    throw new NotFoundError(args.entityCode, message);
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
    if (error instanceof NotFoundError) {
      logger.logDomainError(`Failed to delete ${args.entityLabel.toLowerCase()} (not found)`, {
        ...logFields,
        error,
      });
    } else {
      logger.error(`Failed to delete ${args.entityLabel.toLowerCase()}`, {
        ...logFields,
        error,
      });
    }
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
