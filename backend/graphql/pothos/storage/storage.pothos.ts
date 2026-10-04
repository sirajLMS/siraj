import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { FileTypePothosObject, UploadTypePothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import type * as Types from "@/backend/types";

// Input registrations live in a sibling module to keep this file within the
// max-lines budget. Re-exported so the public module path is unchanged.
export * from "@/backend/graphql/pothos/storage/storage.inputs.pothos";

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

export const StorageItemPothosInterface = gqlSchemaBuilder
  .interfaceRef<Types.StorageObject>("StorageObject")
  .implement({
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
    id: t.string({ resolve: parent => parent.dbId ?? parent.path }),
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
    id: t.string({ resolve: parent => parent.dbId ?? parent.path }),
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

// File type breakdown for storage stats
export const FileTypeBreakdownPothosObject = gqlSchemaBuilder
  .objectRef<Types.FileTypeBreakdown>("FileTypeBreakdown")
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
  .objectRef<Types.BulkOperationFailure>("BulkOperationFailure")
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
