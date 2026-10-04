import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  FileTypePothosObject,
  OrderSortDirectionPothosObject,
  SortByPothosObject,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import type * as Types from "@/backend/types";

export const ListFileInputPothosObject = gqlSchemaBuilder
  .inputRef<Types.FilesListSearchInput>("FilesListInput")
  .implement({
    fields: t => ({
      path: t.string({ required: true, directives: { constraint: { maxLength: 1024 } } }),
      limit: t.int({ required: false, directives: { constraint: { min: 0, max: 500 } } }),
      offset: t.int({ required: false, directives: { constraint: { min: 0, max: 1000000 } } }),
      searchTerm: t.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
      includeDirectories: t.boolean({ required: false, defaultValue: true }),
      fileType: t.string({ required: false, directives: { constraint: { maxLength: 128 } } }), // Deprecated: Use fileTypes instead
      fileTypes: t.field({
        type: [FileTypePothosObject],
        required: false,
      }),
      contentTypes: t.stringList({ required: false, directives: { constraint: { maxItems: 100, maxLength: 128 } } }),
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

export const FileUsageCheckInputPothosObject = gqlSchemaBuilder
  .inputRef<Types.FileUsageCheckInput>("FileUsageCheckInput")
  .implement({
    fields: t => ({
      path: t.string({ required: true, directives: { constraint: { maxLength: 1024 } } }),
    }),
  });

export const FileRenameInputPothosObject = gqlSchemaBuilder
  .inputRef<Types.FileRenameInput>("FileRenameInput")
  .implement({
    fields: t => ({
      currentPath: t.string({ required: true, directives: { constraint: { maxLength: 1024 } } }),
      newName: t.string({ required: true, directives: { constraint: { maxLength: 255 } } }),
    }),
  });

export const UploadPreparationInputPothosObject = gqlSchemaBuilder
  .inputRef<Types.UploadPreparationInput>("UploadPreparationInput")
  .implement({
    fields: t => ({
      path: t.string({ required: true, directives: { constraint: { maxLength: 1024 } } }),
      fileSize: t.int({ required: true, directives: { constraint: { min: 1, max: 104857600 } } }),
      contentType: t.string({ required: true, directives: { constraint: { maxLength: 128 } } }),
      contentHash: t.string({ required: true, directives: { constraint: { maxLength: 128 } } }),
    }),
  });

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

export const FolderCreateInputPothosObject = gqlSchemaBuilder
  .inputRef<Types.FolderCreateInput>("FolderCreateInput")
  .implement({
    fields: t => ({
      path: t.string({ required: true, directives: { constraint: { maxLength: 1024 } } }),
      permissions: t.field({
        type: DirectoryPermissionsInputPothosObject,
        required: false,
      }),
      protected: t.boolean({ required: false }),
      protectChildren: t.boolean({ required: false }),
    }),
  });

export const StorageItemsMoveInputPothosObject = gqlSchemaBuilder
  .inputRef<Types.StorageItemsMoveInput>("StorageItemsMoveInput")
  .implement({
    fields: t => ({
      sourcePaths: t.stringList({ required: true, directives: { constraint: { maxItems: 100, maxLength: 1024 } } }),
      destinationPath: t.string({ required: true, directives: { constraint: { maxLength: 1024 } } }),
    }),
  });

export const StorageItemsCopyInputPothosObject = gqlSchemaBuilder
  .inputRef<Types.StorageItemsCopyInput>("StorageItemsCopyInput")
  .implement({
    fields: t => ({
      sourcePaths: t.stringList({ required: true, directives: { constraint: { maxItems: 100, maxLength: 1024 } } }),
      destinationPath: t.string({ required: true, directives: { constraint: { maxLength: 1024 } } }),
    }),
  });

export const StorageItemsDeleteInputPothosObject = gqlSchemaBuilder
  .inputRef<Types.StorageItemsDeleteInput>("StorageItemsDeleteInput")
  .implement({
    fields: t => ({
      paths: t.stringList({ required: true, directives: { constraint: { maxItems: 100, maxLength: 1024 } } }),
      force: t.boolean({ required: false }),
    }),
  });

export const DirectoryPermissionsUpdateInputPothosObject = gqlSchemaBuilder
  .inputRef<Types.DirectoryPermissionsUpdateInput>("DirectoryPermissionsUpdateInput")
  .implement({
    fields: t => ({
      path: t.string({ required: true, directives: { constraint: { maxLength: 1024 } } }),
      permissions: t.field({
        type: DirectoryPermissionsInputPothosObject,
        required: true,
      }),
    }),
  });

export const StorageItemProtectionUpdateInputPothosObject = gqlSchemaBuilder
  .inputRef<Types.StorageItemProtectionUpdateInput>("StorageItemProtectionUpdateInput")
  .implement({
    fields: t => ({
      path: t.string({ required: true, directives: { constraint: { maxLength: 1024 } } }),
      isProtected: t.boolean({ required: true }),
      protectChildren: t.boolean({ required: false }),
    }),
  });
