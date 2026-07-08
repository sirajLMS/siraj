import logger from "@/backend/lib/logger";
import { sanitizeStoragePath, validateStoragePath } from "@/backend/lib/path-validator";
import { StorageAuthService, StorageManageService } from "@/backend/services/storage";
import { getStorageService } from "@/backend/storage/storage.service";
import type { BaseContext } from "../gqlContext";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import * as StoragePothos from "../pothos";
import { requireAuth } from "../utils/requireAuth";

/** Maximum number of items allowed in a single bulk operation. */
const BULK_ITEM_LIMIT = 100;

/**
 * Sanitize and validate an array of storage paths.
 * @param rawPaths - Array of raw path strings from the GraphQL input.
 * @returns Array of sanitized and validated paths.
 */
function sanitizeAndValidatePaths(rawPaths: string[]): string[] {
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
 * @param locale - Request locale for localized error messages.
 */
async function authorizeBulkPaths(userId: string, itemPaths: string[], locale: string): Promise<void> {
  for (const itemPath of itemPaths) {
    await StorageAuthService.requireStorageManageOrOwner(userId, itemPath, locale);
  }
}

/**
 * Enforce the bulk-item limit and throw an error when exceeded.
 * @param count - Actual number of items in the request.
 * @param operation - Human-readable label (e.g. "move", "copy") for the error message.
 */
function enforceBulkLimit(count: number, operation: string): void {
  if (count > BULK_ITEM_LIMIT) {
    throw new Error(`Bulk ${operation} operation limited to ${BULK_ITEM_LIMIT} items maximum`);
  }
}

/**
 * Shared resolver logic for bulk move/copy mutations: validate paths, enforce limits,
 * authorise, then delegate to the service's bulk transfer method.
 * @param operation - "move" or "copy" — used both for the limit error and method dispatch.
 * @param input - GraphQL mutation input containing sourcePaths and destinationPath.
 * @param ctx - GraphQL resolver context (for auth and locale).
 * @returns The BulkOperationResult returned by the storage service.
 */
async function resolveBulkTransfer(
  operation: "move" | "copy",
  input: { sourcePaths: string[]; destinationPath: string },
  ctx: BaseContext
) {
  const userId = await requireAuth(ctx);
  const sanitizedSourcePaths = sanitizeAndValidatePaths(input.sourcePaths);
  const sanitizedDestPath = sanitizeStoragePath(input.destinationPath);
  validateStoragePath(sanitizedDestPath);
  enforceBulkLimit(sanitizedSourcePaths.length, operation);
  await authorizeBulkPaths(userId, sanitizedSourcePaths, ctx.locale);
  const storageService = await getStorageService();
  const payload = {
    ...input,
    sourcePaths: sanitizedSourcePaths,
    destinationPath: sanitizedDestPath,
  };
  return operation === "move" ? await storageService.moveItems(payload) : await storageService.copyItems(payload);
}

gqlSchemaBuilder.mutationFields(t => ({
  renameFile: t.field({
    authScopes: { loggedIn: true },
    type: StoragePothos.FileOperationResultPothosObject,
    args: {
      input: t.arg({
        type: StoragePothos.FileRenameInputPothosObject,
        required: true,
      }),
    },
    resolve: async (_parent, { input }, ctx) => {
      const userId = await requireAuth(ctx);
      const currentPath = sanitizeStoragePath(input.currentPath);
      validateStoragePath(currentPath);
      await StorageAuthService.requireStorageManageOrOwner(userId, currentPath, ctx.locale);
      const storageService = await getStorageService();
      return await storageService.renameFile({ ...input, currentPath });
    },
  }),

  deleteFile: t.field({
    authScopes: { loggedIn: true },
    type: StoragePothos.FileOperationResultPothosObject,
    args: {
      path: t.arg.string({ required: true }),
    },
    resolve: async (_parent, { path }, ctx) => {
      const userId = await requireAuth(ctx);
      const sanitizedPath = sanitizeStoragePath(path);
      validateStoragePath(sanitizedPath);
      await StorageAuthService.requireStorageManageOrOwner(userId, sanitizedPath, ctx.locale);
      const storageService = await getStorageService();
      return await storageService.deleteFile(sanitizedPath);
    },
  }),

  prepareUpload: t.field({
    authScopes: { loggedIn: true },
    type: StoragePothos.UploadPreparationPothosObject,
    args: {
      input: t.arg({
        type: StoragePothos.UploadPreparationInputPothosObject,
        required: true,
      }),
    },
    resolve: async (_parent, { input }, ctx) => {
      const userId = await requireAuth(ctx);
      const sanitizedPath = sanitizeStoragePath(input.path);
      validateStoragePath(sanitizedPath);
      await StorageAuthService.requireStorageManage(userId, ctx.locale);
      const storageService = await getStorageService();
      const result = await storageService.prepareUpload({ ...input, path: sanitizedPath });
      logger.info("GraphQL mutation: prepareUpload completed", {
        uploadType: result.uploadType,
      });
      return result;
    },
  }),

  createFolder: t.field({
    authScopes: { loggedIn: true },
    type: StoragePothos.FileOperationResultPothosObject,
    args: {
      input: t.arg({
        type: StoragePothos.FolderCreateInputPothosObject,
        required: true,
      }),
    },
    resolve: async (_parent, { input }, ctx) => {
      const userId = await requireAuth(ctx);
      const sanitizedPath = sanitizeStoragePath(input.path);
      validateStoragePath(sanitizedPath);
      await StorageAuthService.requireStorageManage(userId, ctx.locale);
      const storageService = await getStorageService();
      return await storageService.createFolder({ ...input, path: sanitizedPath });
    },
  }),

  moveStorageItems: t.field({
    authScopes: { loggedIn: true },
    type: StoragePothos.BulkOperationResultPothosObject,
    args: {
      input: t.arg({
        type: StoragePothos.StorageItemsMoveInputPothosObject,
        required: true,
      }),
    },
    resolve: async (_parent, { input }, ctx) => resolveBulkTransfer("move", input, ctx),
  }),

  copyStorageItems: t.field({
    authScopes: { loggedIn: true },
    type: StoragePothos.BulkOperationResultPothosObject,
    args: {
      input: t.arg({
        type: StoragePothos.StorageItemsCopyInputPothosObject,
        required: true,
      }),
    },
    resolve: async (_parent, { input }, ctx) => resolveBulkTransfer("copy", input, ctx),
  }),

  deleteStorageItems: t.field({
    authScopes: { loggedIn: true },
    type: StoragePothos.BulkOperationResultPothosObject,
    args: {
      input: t.arg({
        type: StoragePothos.StorageItemsDeleteInputPothosObject,
        required: true,
      }),
    },
    resolve: async (_parent, { input }, ctx) => {
      const userId = await requireAuth(ctx);
      const sanitizedPaths = sanitizeAndValidatePaths(input.paths);
      enforceBulkLimit(sanitizedPaths.length, "delete");
      await authorizeBulkPaths(userId, sanitizedPaths, ctx.locale);
      const storageService = await getStorageService();
      return await storageService.deleteItems({ ...input, paths: sanitizedPaths });
    },
  }),

  updateDirectoryPermissions: t.field({
    authScopes: { loggedIn: true },
    type: StoragePothos.FileOperationResultPothosObject,
    args: {
      input: t.arg({
        type: StoragePothos.DirectoryPermissionsUpdateInputPothosObject,
        required: true,
      }),
    },
    resolve: async (_parent, { input }, ctx) => {
      const userId = await requireAuth(ctx);
      const sanitizedPath = sanitizeStoragePath(input.path);
      validateStoragePath(sanitizedPath);
      await StorageAuthService.requireStorageManage(userId, ctx.locale);
      return await StorageManageService.updateDirectoryPermissions({ ...input, path: sanitizedPath });
    },
  }),

  setStorageItemProtection: t.field({
    authScopes: { loggedIn: true },
    type: StoragePothos.FileOperationResultPothosObject,
    args: {
      input: t.arg({
        type: StoragePothos.StorageItemProtectionUpdateInputPothosObject,
        required: true,
      }),
    },
    resolve: async (_parent, { input }, ctx) => {
      const userId = await requireAuth(ctx);
      const sanitizedPath = sanitizeStoragePath(input.path);
      validateStoragePath(sanitizedPath);
      await StorageAuthService.requireStorageManage(userId, ctx.locale);
      return await StorageManageService.setStorageItemProtection({ ...input, path: sanitizedPath });
    },
  }),
}));
