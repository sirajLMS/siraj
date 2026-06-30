import { StorageDbRepository } from "@/backend/db/repo";
import { getBackendTranslations } from "@/backend/lib/intl";
import logger from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { getStorageService } from "@/backend/storage/storage.service";
import { AppPermission } from "@/shared/lib/enum";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import * as StoragePothos from "../pothos";
import { requireAuth } from "../utils/requireAuth";

async function requireStorageManage(userId: string, locale?: string): Promise<void> {
  const hasPermission = await PermissionsService.hasPermission(userId, AppPermission.STORAGE_MANAGE);
  if (!hasPermission) {
    const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(tFunc("insufficientPermissions"));
  }
}

async function requireStorageManageOrOwner(userId: string, filePath: string, locale?: string): Promise<void> {
  const hasPermission = await PermissionsService.hasPermission(userId, AppPermission.STORAGE_MANAGE);
  if (hasPermission) return;

  const usages = await StorageDbRepository.getFileUsages(filePath);
  const isOwner = usages.some(u => u.referenceTable === "users" && u.referenceId === userId);
  if (!isOwner) {
    const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(tFunc("insufficientPermissions"));
  }
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
    resolve: async (_parent, { input }) => {
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
      await requireStorageManageOrOwner(userId, path, ctx.locale);
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
    resolve: async (_parent, { input }) => {
      logger.info("GraphQL mutation: prepareUpload", { input });
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
    resolve: async (_parent, { input }) => {
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
    resolve: async (_parent, { input }) => {
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
    resolve: async (_parent, { input }) => {
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
        await requireStorageManageOrOwner(userId, itemPath, ctx.locale);
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
      await requireStorageManage(userId, ctx.locale);
      return await StorageDbRepository.updateDirectoryPermissions(input);
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
      await requireStorageManage(userId, ctx.locale);
      return await StorageDbRepository.setProtection(input);
    },
  }),
}));
