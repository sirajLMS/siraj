import logger from "@/backend/lib/logger";
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
      await StorageAuthService.requireStorageManageOrOwner(userId, input.currentPath, ctx.locale);
      const storageService = await getStorageService();
      return await storageService.renameFile(input);
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
      await StorageAuthService.requireStorageManageOrOwner(userId, path, ctx.locale);
      const storageService = await getStorageService();
      return await storageService.deleteFile(path);
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
      await StorageAuthService.requireStorageManage(userId, ctx.locale);
      const storageService = await getStorageService();
      const result = await storageService.prepareUpload(input);
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
      await StorageAuthService.requireStorageManage(userId, ctx.locale);
      const storageService = await getStorageService();
      return await storageService.createFolder(input);
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
      for (const itemPath of input.sourcePaths) {
        await StorageAuthService.requireStorageManageOrOwner(userId, itemPath, ctx.locale);
      }
      const storageService = await getStorageService();
      return await storageService.moveItems(input);
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
      for (const itemPath of input.sourcePaths) {
        await StorageAuthService.requireStorageManageOrOwner(userId, itemPath, ctx.locale);
      }
      const storageService = await getStorageService();
      return await storageService.copyItems(input);
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
      for (const itemPath of input.paths) {
        await StorageAuthService.requireStorageManageOrOwner(userId, itemPath, ctx.locale);
      }
      const storageService = await getStorageService();
      return await storageService.deleteItems(input);
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
      await StorageAuthService.requireStorageManage(userId, ctx.locale);
      return await StorageManageService.updateDirectoryPermissions(input);
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
      await StorageAuthService.requireStorageManage(userId, ctx.locale);
      return await StorageManageService.setStorageItemProtection(input);
    },
  }),
}));
