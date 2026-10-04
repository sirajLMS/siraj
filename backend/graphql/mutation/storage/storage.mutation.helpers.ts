import { GraphQLError } from "graphql";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { sanitizeStoragePath, validateStoragePath } from "@/backend/lib/path-validator";
import { StorageAuthService } from "@/backend/services";
import { getStorageService } from "@/backend/storage/storage.service";
import type { ErrorsLabels } from "@/shared/locale";

/** Maximum number of items allowed in a single bulk operation. */
const BULK_ITEM_LIMIT = 100;

/**
 * Sanitize and validate an array of storage paths.
 * @param rawPaths - Array of raw path strings from the GraphQL input.
 * @returns Array of sanitized and validated paths.
 */
export function sanitizeAndValidatePaths(rawPaths: string[]): string[] {
  return rawPaths.map(p => {
    const sanitized = sanitizeStoragePath(p);
    validateStoragePath(sanitized);
    return sanitized;
  });
}

/**
 * Ensure the user has storage manage or owner permission on every sanitised path.
 * @param userId - Authenticated user ID.
 * @param itemPaths - Already-sanitised paths to authorise.
 * @param tErrors - Error labels for localized error messages.
 */
export async function authorizeBulkPaths(userId: string, itemPaths: string[], tErrors: ErrorsLabels): Promise<void> {
  await Promise.all(
    itemPaths.map(itemPath => StorageAuthService.requireStorageManageOrOwner(userId, itemPath, tErrors))
  );
}

/**
 * Enforce the bulk-item limit and throw an error when exceeded.
 * @param count - Actual number of items in the request.
 * @param operation - Human-readable label (e.g. "move", "copy") for the error message.
 * @param tErrors - Error labels for localized error messages.
 */
export function enforceBulkLimit(count: number, operation: string, tErrors: ErrorsLabels): void {
  if (count > BULK_ITEM_LIMIT) {
    throw new GraphQLError(tErrors.bulkOperationLimitExceeded(operation, BULK_ITEM_LIMIT), {
      extensions: { code: "BAD_USER_INPUT", operation, limit: BULK_ITEM_LIMIT },
    });
  }
}

/**
 * Authenticate, sanitise/validate a single path, and check storage-manage permission.
 * Shared by single-path mutation resolvers (prepareUpload, createFolder,
 * updateDirectoryPermissions, setStorageItemProtection).
 * @param ctx - GraphQL resolver context (for auth and locale).
 * @param rawPath - Raw path string from the GraphQL input.
 * @returns The sanitised path and the error labels.
 */
export async function authAndSanitizeSinglePath(
  ctx: BaseContext,
  rawPath: string
): Promise<{ userId: string; sanitizedPath: string; tErrors: ErrorsLabels }> {
  const userId = await requireAuth(ctx);
  const sanitizedPath = sanitizeStoragePath(rawPath);
  validateStoragePath(sanitizedPath);
  const tErrors = ctx.t().errorsTranslations;
  await StorageAuthService.requireStorageManage(userId, tErrors);
  return { userId, sanitizedPath, tErrors };
}

/**
 * Shared resolver logic for bulk move/copy mutations: validate paths, enforce limits,
 * authorise, then delegate to the service's bulk transfer method.
 * @param operation - "move" or "copy" — used both for the limit error and method dispatch.
 * @param input - GraphQL mutation input containing sourcePaths and destinationPath.
 * @param ctx - GraphQL resolver context (for auth and locale).
 * @returns The BulkOperationResult returned by the storage service.
 */
export async function resolveBulkTransfer(
  operation: "move" | "copy",
  input: { sourcePaths: string[]; destinationPath: string },
  ctx: BaseContext
) {
  const userId = await requireAuth(ctx);
  const sanitizedSourcePaths = sanitizeAndValidatePaths(input.sourcePaths);
  const sanitizedDestPath = sanitizeStoragePath(input.destinationPath);
  validateStoragePath(sanitizedDestPath);
  const tErrors = ctx.t().errorsTranslations;
  enforceBulkLimit(sanitizedSourcePaths.length, operation, tErrors);
  await authorizeBulkPaths(userId, sanitizedSourcePaths, tErrors);
  const storageService = await getStorageService();
  const payload = {
    ...input,
    sourcePaths: sanitizedSourcePaths,
    destinationPath: sanitizedDestPath,
  };
  return operation === "move"
    ? await storageService.moveItems(payload, ctx.locale)
    : await storageService.copyItems(payload, ctx.locale);
}
