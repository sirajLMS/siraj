import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { OrderSortDirectionPothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import * as Types from "@/backend/types";

// File type enum
export const FileTypePothosObject = gqlSchemaBuilder.enumType(Types.FileTypes, {
  name: "FileType",
});

// Upload type enum
export const UploadTypePothosObject = gqlSchemaBuilder.enumType(Types.UploadType, {
  name: "UploadType",
});

export const SortByPothosObject = gqlSchemaBuilder.enumType(Types.FileSortField, {
  name: "FileSortField",
});

// Upload preparation result
export const UploadPreparationPothosObject = gqlSchemaBuilder
  .objectRef<Types.UploadPreparationResult>("UploadPreparation")
  .implement({
    fields: t => ({
      id: t.exposeString("id", { nullable: false }),
      url: t.exposeString("url", { nullable: false }),
      uploadType: t.expose("uploadType", {
        type: UploadTypePothosObject,
        nullable: false,
      }),
      access: t.exposeString("access", { nullable: true }),
    }),
  });

// Directory permissions object
export const DirectoryPermissionsPothosObject = gqlSchemaBuilder
  .objectRef<Types.DirectoryPermissions>("DirectoryPermissions")
  .implement({
    fields: t => ({
      allowUploads: t.exposeBoolean("allowUploads"),
      allowDelete: t.exposeBoolean("allowDelete"),
      allowMove: t.exposeBoolean("allowMove"),
      allowCreateSubDirs: t.exposeBoolean("allowCreateSubDirs"),
      allowDeleteFiles: t.exposeBoolean("allowDeleteFiles"),
      allowMoveFiles: t.exposeBoolean("allowMoveFiles"),
    }),
  });

// File usage info
export const FileUsageInfoPothosObject = gqlSchemaBuilder.objectRef<Types.FileUsageInfo>("FileUsageInfo").implement({
  fields: t => ({
    id: t.field({
      type: "String",
      resolve: usageInfo => usageInfo.id,
    }),
    filePath: t.exposeString("filePath"),
    usageType: t.exposeString("usageType"),
    referenceId: t.field({
      type: "String",
      resolve: usageInfo => usageInfo.referenceId,
    }),
    referenceTable: t.exposeString("referenceTable"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
  }),
});

const StorageItemPothosInterface = gqlSchemaBuilder.interfaceRef<Types.StorageObject>("StorageObject").implement({
  fields: t => ({
    path: t.exposeString("path", { nullable: false }),
    name: t.exposeString("name"),
    isProtected: t.exposeBoolean("isProtected"),
  }),
});

export const FileInfoPothosObject = gqlSchemaBuilder.objectRef<Types.FileInfo>("FileInfo").implement({
  interfaces: [StorageItemPothosInterface],
  isTypeOf: item => typeof item === "object" && item !== null && "size" in item,
  fields: t => ({
    directoryPath: t.exposeString("directoryPath"),
    size: t.field({
      type: "Int",
      resolve: fileInfo => Number(fileInfo.size),
      nullable: false,
    }),
    contentType: t.exposeString("contentType", { nullable: true }),
    contentHash: t.exposeString("contentHash", { nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    lastModified: t.expose("lastModified", { type: "DateTime" }),
    isFromBucket: t.exposeBoolean("isFromBucket"),
    url: t.exposeString("url", { nullable: false }),
    mediaLink: t.exposeString("mediaLink", { nullable: true }),
    fileType: t.expose("fileType", { type: FileTypePothosObject }),
    isPublic: t.exposeBoolean("isPublic"),
    isInUse: t.exposeBoolean("isInUse"),
    usages: t.expose("usages", { type: [FileUsageInfoPothosObject] }),
  }),
});

export const DirectoryInfoPothosObject = gqlSchemaBuilder.objectRef<Types.DirectoryInfo>("DirectoryInfo").implement({
  interfaces: [StorageItemPothosInterface],
  isTypeOf: item => typeof item === "object" && item !== null && !("size" in item),
  fields: t => ({
    permissions: t.expose("permissions", {
      type: DirectoryPermissionsPothosObject,
    }),
    protectChildren: t.exposeBoolean("protectChildren"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    lastModified: t.expose("lastModified", { type: "DateTime" }),
    isFromBucket: t.exposeBoolean("isFromBucket"),
    fileCount: t.exposeInt("fileCount"),
    folderCount: t.exposeInt("folderCount"),
    totalSize: t.exposeInt("totalSize"),
  }),
});

export const StorageObjectListPothosObject = gqlSchemaBuilder
  .objectRef<Types.StorageObjectList>("StorageObjectList")
  .implement({
    fields: t => ({
      items: t.expose("items", { type: [StorageItemPothosInterface] }),
      totalCount: t.exposeInt("totalCount", { nullable: false }),
      hasMore: t.exposeBoolean("hasMore", { nullable: false }),
      offset: t.exposeInt("offset", { nullable: false }),
      limit: t.exposeInt("limit", { nullable: false }),
    }),
  });
export const ListFileInputPothosObject = gqlSchemaBuilder
  .inputRef<Types.FilesListSearchInput>("FilesListInput")
  .implement({
    fields: t => ({
      path: t.string({ required: true }),
      limit: t.int({ required: false }),
      offset: t.int({ required: false }),
      searchTerm: t.string({ required: false }),
      includeDirectories: t.boolean({ required: false, defaultValue: true }),
      fileType: t.string({ required: false }), // Deprecated: Use fileTypes instead
      fileTypes: t.field({
        type: [FileTypePothosObject],
        required: false,
      }),
      contentTypes: t.stringList({ required: false }),
      sortDirection: t.field({
        type: OrderSortDirectionPothosObject,
        required: false,
      }),
      sortBy: t.field({
        type: SortByPothosObject,
        required: false,
      }),
    }),
  });

// File type breakdown for storage stats
export const FileTypeBreakdownPothosObject = gqlSchemaBuilder
  .objectRef<{
    type: string;
    count: number;
    size: bigint;
  }>("FileTypeBreakdown")
  .implement({
    fields: t => ({
      type: t.exposeString("type"),
      count: t.exposeInt("count"),
      size: t.field({
        type: "String",
        resolve: breakdown => breakdown.size.toString(),
      }),
    }),
  });

// Storage stats object
export const StorageStatsPothosObject = gqlSchemaBuilder.objectRef<Types.StorageStats>("StorageStats").implement({
  fields: t => ({
    totalFiles: t.exposeInt("totalFiles"),
    totalSize: t.field({
      type: "String",
      resolve: stats => stats.totalSize.toString(),
    }),
    fileTypeBreakdown: t.field({
      type: [FileTypeBreakdownPothosObject],
      resolve: stats => stats.fileTypeBreakdown,
    }),
    directoryCount: t.exposeInt("directoryCount"),
  }),
});

// File usage result object
export const FileUsageResultPothosObject = gqlSchemaBuilder
  .objectRef<Types.FileUsageResult>("FileUsageResult")
  .implement({
    fields: t => ({
      isInUse: t.exposeBoolean("isInUse"),
      usages: t.expose("usages", { type: [FileUsageInfoPothosObject] }),
      canDelete: t.exposeBoolean("canDelete"),
      deleteBlockReason: t.exposeString("deleteBlockReason", {
        nullable: true,
      }),
    }),
  });

// Check file usage input
export const FileUsageCheckInputPothosObject = gqlSchemaBuilder
  .inputRef<Types.FileUsageCheckInput>("FileUsageCheckInput")
  .implement({
    fields: t => ({
      path: t.string({ required: true }),
    }),
  });

// File operation result object
export const FileOperationResultPothosObject = gqlSchemaBuilder
  .objectRef<Types.FileOperationResult>("FileOperationResult")
  .implement({
    fields: t => ({
      success: t.exposeBoolean("success"),
      message: t.exposeString("message"),
      data: t.field({
        type: StorageItemPothosInterface,
        nullable: true,
        resolve: result => result.data ?? null,
      }),
    }),
  });

// Bulk operation failure object
export const BulkOperationFailurePothosObject = gqlSchemaBuilder
  .objectRef<{ path: string; error: string }>("BulkOperationFailure")
  .implement({
    fields: t => ({
      path: t.exposeString("path"),
      error: t.exposeString("error"),
    }),
  });

// Bulk operation result object
export const BulkOperationResultPothosObject = gqlSchemaBuilder
  .objectRef<Types.BulkOperationResult>("BulkOperationResult")
  .implement({
    fields: t => ({
      success: t.exposeBoolean("success"),
      message: t.exposeString("message"),
      successCount: t.exposeInt("successCount"),
      failureCount: t.exposeInt("failureCount"),
      failures: t.field({
        type: [BulkOperationFailurePothosObject],
        resolve: result => result.failures,
      }),
      successfulItems: t.expose("successfulItems", {
        type: [StorageItemPothosInterface],
      }),
    }),
  });

// File rename input
export const FileRenameInputPothosObject = gqlSchemaBuilder
  .inputRef<Types.FileRenameInput>("FileRenameInput")
  .implement({
    fields: t => ({
      currentPath: t.string({ required: true }),
      newName: t.string({ required: true }),
    }),
  });

// Upload preparation input
export const UploadPreparationInputPothosObject = gqlSchemaBuilder
  .inputRef<Types.UploadPreparationInput>("UploadPreparationInput")
  .implement({
    fields: t => ({
      path: t.string({ required: true }),
      fileSize: t.int({ required: true }),
      contentType: t.string({ required: true }),
      contentHash: t.string({ required: true }),
    }),
  });

// Directory permissions input
export const DirectoryPermissionsInputPothosObject = gqlSchemaBuilder
  .inputRef<Types.DirectoryPermissions>("DirectoryPermissionsInput")
  .implement({
    fields: t => ({
      allowUploads: t.boolean({ required: true }),
      allowDelete: t.boolean({ required: true }),
      allowMove: t.boolean({ required: true }),
      allowCreateSubDirs: t.boolean({ required: true }),
      allowDeleteFiles: t.boolean({ required: true }),
      allowMoveFiles: t.boolean({ required: true }),
    }),
  });

// Create folder input
export const FolderCreateInputPothosObject = gqlSchemaBuilder
  .inputRef<Types.FolderCreateInput>("FolderCreateInput")
  .implement({
    fields: t => ({
      path: t.string({ required: true }),
      permissions: t.field({
        type: DirectoryPermissionsInputPothosObject,
        required: false,
      }),
      protected: t.boolean({ required: false }),
      protectChildren: t.boolean({ required: false }),
    }),
  });

// Move storage items input
export const StorageItemsMoveInputPothosObject = gqlSchemaBuilder
  .inputRef<Types.StorageItemsMoveInput>("StorageItemsMoveInput")
  .implement({
    fields: t => ({
      sourcePaths: t.stringList({ required: true }),
      destinationPath: t.string({ required: true }),
    }),
  });

// Copy storage items input
export const StorageItemsCopyInputPothosObject = gqlSchemaBuilder
  .inputRef<Types.StorageItemsCopyInput>("StorageItemsCopyInput")
  .implement({
    fields: t => ({
      sourcePaths: t.stringList({ required: true }),
      destinationPath: t.string({ required: true }),
    }),
  });

// Delete items input
export const StorageItemsDeleteInputPothosObject = gqlSchemaBuilder
  .inputRef<Types.StorageItemsDeleteInput>("StorageItemsDeleteInput")
  .implement({
    fields: t => ({
      paths: t.stringList({ required: true }),
      force: t.boolean({ required: false }),
    }),
  });

// Update directory permissions input
export const DirectoryPermissionsUpdateInputPothosObject = gqlSchemaBuilder
  .inputRef<Types.DirectoryPermissionsUpdateInput>("DirectoryPermissionsUpdateInput")
  .implement({
    fields: t => ({
      path: t.string({ required: true }),
      permissions: t.field({
        type: DirectoryPermissionsInputPothosObject,
        required: true,
      }),
    }),
  });

// Set storage item protection input
export const StorageItemProtectionUpdateInputPothosObject = gqlSchemaBuilder
  .inputRef<Types.StorageItemProtectionUpdateInput>("StorageItemProtectionUpdateInput")
  .implement({
    fields: t => ({
      path: t.string({ required: true }),
      isProtected: t.boolean({ required: true }),
      protectChildren: t.boolean({ required: false }),
    }),
  });
