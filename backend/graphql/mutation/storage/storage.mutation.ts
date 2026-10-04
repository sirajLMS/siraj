import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  authAndSanitizeSinglePath,
  authorizeBulkPaths,
  enforceBulkLimit,
  resolveBulkTransfer,
  sanitizeAndValidatePaths,
} from "@/backend/graphql/mutation/storage/storage.mutation.helpers";
import * as StoragePothos from "@/backend/graphql/pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { logger } from "@/backend/lib/logger";
import { sanitizeStoragePath, validateStoragePath } from "@/backend/lib/path-validator";
import { StorageAuthService, StorageManageService } from "@/backend/services";
import { getStorageService } from "@/backend/storage/storage.service";

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
      const tErrors = ctx.t().errorsTranslations;
      await StorageAuthService.requireStorageManageOrOwner(userId, currentPath, tErrors);
      const storageService = await getStorageService();
      return await storageService.renameFile({ ...input, currentPath }, ctx.locale);
    },
  }),

  deleteFile: t.field({
    authScopes: { loggedIn: true },
    type: StoragePothos.FileOperationResultPothosObject,
    args: {
      path: t.arg.string({ required: true, directives: { constraint: { maxLength: 1024 } } }),
    },
    resolve: async (_parent, { path }, ctx) => {
      const userId = await requireAuth(ctx);
      const sanitizedPath = sanitizeStoragePath(path);
      validateStoragePath(sanitizedPath);
      const tErrors = ctx.t().errorsTranslations;
      await StorageAuthService.requireStorageManageOrOwner(userId, sanitizedPath, tErrors);
      const storageService = await getStorageService();
      return await storageService.deleteFile(sanitizedPath, ctx.locale);
    },
  }),
}));

gqlSchemaBuilder.mutationFields(t => ({
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
      const { userId, sanitizedPath } = await authAndSanitizeSinglePath(ctx, input.path);
      const storageService = await getStorageService();
      const result = await storageService.prepareUpload(
        { ...input, path: sanitizedPath, uploadedByUserId: userId },
        ctx.locale
      );
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
      const { sanitizedPath } = await authAndSanitizeSinglePath(ctx, input.path);
      const storageService = await getStorageService();
      return await storageService.createFolder({ ...input, path: sanitizedPath }, ctx.locale);
    },
  }),
}));

gqlSchemaBuilder.mutationFields(t => ({
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
      const tErrors = ctx.t().errorsTranslations;
      enforceBulkLimit(sanitizedPaths.length, "delete", tErrors);
      await authorizeBulkPaths(userId, sanitizedPaths, tErrors);
      const storageService = await getStorageService();
      return await storageService.deleteItems({ ...input, paths: sanitizedPaths }, ctx.locale);
    },
  }),
}));

gqlSchemaBuilder.mutationFields(t => ({
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
      const { sanitizedPath } = await authAndSanitizeSinglePath(ctx, input.path);
      return await StorageManageService.updateDirectoryPermissions({ ...input, path: sanitizedPath }, ctx.locale);
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
      const { sanitizedPath } = await authAndSanitizeSinglePath(ctx, input.path);
      return await StorageManageService.setStorageItemProtection({ ...input, path: sanitizedPath }, ctx.locale);
    },
  }),
}));
