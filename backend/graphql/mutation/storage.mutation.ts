import logger from "@/backend/lib/logger";
import { sanitizeStoragePath, validateStoragePath } from "@/backend/lib/path-validator";
import { StorageAuthService, StorageManageService } from "@/backend/services/storage";
import { getStorageService } from "@/backend/storage/storage.service";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import * as StoragePothos from "../pothos";
import { requireAuth } from "../utils/requireAuth";

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
    resolve: async (_parent, { input }, ctx) => {
      const userId = await requireAuth(ctx);
      const sanitizedSourcePaths = input.sourcePaths.map(p => {
        const sanitized = sanitizeStoragePath(p);
        validateStoragePath(sanitized);
        return sanitized;
      });
      const sanitizedDestPath = sanitizeStoragePath(input.destinationPath);
      validateStoragePath(sanitizedDestPath);
      if (sanitizedSourcePaths.length > 100) {
        throw new Error("Bulk move operation limited to 100 items maximum");
      }
      for (const itemPath of sanitizedSourcePaths) {
        await StorageAuthService.requireStorageManageOrOwner(userId, itemPath, ctx.locale);
      }
      const storageService = await getStorageService();
      return await storageService.moveItems({
        ...input,
        sourcePaths: sanitizedSourcePaths,
        destinationPath: sanitizedDestPath,
      });
    },
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
    resolve: async (_parent, { input }, ctx) => {
      const userId = await requireAuth(ctx);
      const sanitizedSourcePaths = input.sourcePaths.map(p => {
        const sanitized = sanitizeStoragePath(p);
        validateStoragePath(sanitized);
        return sanitized;
      });
      const sanitizedDestPath = sanitizeStoragePath(input.destinationPath);
      validateStoragePath(sanitizedDestPath);
      if (sanitizedSourcePaths.length > 100) {
        throw new Error("Bulk copy operation limited to 100 items maximum");
      }
      for (const itemPath of sanitizedSourcePaths) {
        await StorageAuthService.requireStorageManageOrOwner(userId, itemPath, ctx.locale);
      }
      const storageService = await getStorageService();
      return await storageService.copyItems({
        ...input,
        sourcePaths: sanitizedSourcePaths,
        destinationPath: sanitizedDestPath,
      });
    },
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
      const sanitizedPaths = input.paths.map(p => {
        const sanitized = sanitizeStoragePath(p);
        validateStoragePath(sanitized);
        return sanitized;
      });
      if (sanitizedPaths.length > 100) {
        throw new Error("Bulk delete operation limited to 100 items maximum");
      }
      for (const itemPath of sanitizedPaths) {
        await StorageAuthService.requireStorageManageOrOwner(userId, itemPath, ctx.locale);
      }
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
