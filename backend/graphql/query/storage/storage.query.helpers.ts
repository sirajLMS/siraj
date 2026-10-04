import type { BaseContext } from "@/backend/graphql/gqlContext";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { sanitizeStoragePath, validateStoragePath } from "@/backend/lib/path-validator";
import { StorageService } from "@/backend/services/storage";
import type { ErrorsLabels } from "@/shared/locale";

type StorageAuthMode = "owner" | "admin";

// IMPORTANT: Every resolver that accepts a user-supplied storage path MUST
// (1) authenticate the caller, (2) sanitize the path, (3) validate the path
// against traversal attacks, and (4) enforce per-user ownership / storage-manage
// scope before delegating to the storage service. The previous implementation
// trusted the raw client-supplied path and relied on a vague "service layer is
// responsible" comment — that allowed any logged-in user to list/fileInfo any
// storage path (BOLA / IDOR).

/**
 * Authenticate the caller, sanitize + validate the storage path, and enforce
 * the requested scope.
 *
 * - `"owner"` (user-browsing resolvers): when a path is supplied, the caller
 *   must either hold `STORAGE_MANAGE` or be the file's owner (via file usages).
 *   When the path is empty/omitted (root browse), the caller must hold
 *   `STORAGE_MANAGE` (broad bucket-wide access).
 * - `"admin"` (`storageStats`): the caller must always hold `STORAGE_MANAGE`,
 *   regardless of whether a path was supplied.
 *
 * @returns The sanitized path (empty string when none was supplied) and the
 * localized error labels for downstream use.
 */
export async function authorizeStoragePath(
  ctx: BaseContext,
  rawPath: string | undefined | null,
  mode: StorageAuthMode
): Promise<{ sanitizedPath: string; tErrors: ErrorsLabels }> {
  const userId = await requireAuth(ctx);
  const tErrors = ctx.t().errorsTranslations;
  const sanitizedPath = rawPath ? sanitizeStoragePath(rawPath) : "";
  const hasPath = Boolean(rawPath);
  if (hasPath) {
    validateStoragePath(sanitizedPath);
  }
  if (mode === "admin" || !hasPath) {
    // Admin mode always requires STORAGE_MANAGE; owner mode with no path
    // (root/bucket-wide browse) also falls back to STORAGE_MANAGE since there
    // is no specific file to attribute ownership to.
    await StorageService.requireStorageManage(userId, tErrors);
  } else {
    await StorageService.requireStorageManageOrOwner(userId, sanitizedPath, tErrors);
  }
  return { sanitizedPath, tErrors };
}
