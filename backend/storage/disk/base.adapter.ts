import type * as Types from "@/backend/types";
import type { StorageService } from "./storage.service.interface";

export interface AdapterOperations<TContext> {
  fileExists: (ctx: TContext, path: string) => Promise<boolean>;
  prepareUpload: (ctx: TContext, input: Types.UploadPreparationInput) => Promise<Types.UploadPreparationResult>;
  uploadFile: (ctx: TContext, path: string, contentType: string, buffer: Buffer) => Promise<Types.FileUploadResult>;
  listFiles: (ctx: TContext, input: Types.FilesListSearchInput) => Promise<Types.StorageObjectList>;
  createFolder: (ctx: TContext, input: Types.FolderCreateInput) => Promise<Types.FileOperationResult>;
  renameFile: (ctx: TContext, input: Types.FileRenameInput) => Promise<Types.FileOperationResult>;
  deleteFile: (ctx: TContext, path: string) => Promise<Types.FileOperationResult>;
  directoryInfoByPath: (ctx: TContext, path: string) => Promise<Types.DirectoryInfo | null>;
  fileInfoByPath: (ctx: TContext, path: string) => Promise<Types.FileInfo | null>;
  fileInfoByDbFileId: (ctx: TContext, id: bigint) => Promise<Types.FileInfo | null>;
  storageStatistics: (ctx: TContext, path?: string | null) => Promise<Types.StorageStats>;
  fetchDirectoryChildren: (ctx: TContext, path?: string | null) => Promise<Types.DirectoryInfo[]>;
  moveItems: (ctx: TContext, input: Types.StorageItemsMoveInput) => Promise<Types.BulkOperationResult>;
  copyItems: (ctx: TContext, input: Types.StorageItemsCopyInput) => Promise<Types.BulkOperationResult>;
  deleteItems: (ctx: TContext, input: Types.StorageItemsDeleteInput) => Promise<Types.BulkOperationResult>;
}

export abstract class BaseAdapter<TContext> implements StorageService {
  constructor(
    protected readonly context: TContext,
    protected readonly ops: AdapterOperations<TContext>
  ) {}

  async fileExists(path: string): Promise<boolean> {
    return this.ops.fileExists(this.context, path);
  }

  async prepareUpload(input: Types.UploadPreparationInput): Promise<Types.UploadPreparationResult> {
    return this.ops.prepareUpload(this.context, input);
  }

  async uploadFile(path: string, contentType: string, buffer: Buffer): Promise<Types.FileUploadResult> {
    return this.ops.uploadFile(this.context, path, contentType, buffer);
  }

  async listFiles(input: Types.FilesListSearchInput): Promise<Types.StorageObjectList> {
    return this.ops.listFiles(this.context, input);
  }

  async createFolder(input: Types.FolderCreateInput): Promise<Types.FileOperationResult> {
    return this.ops.createFolder(this.context, input);
  }

  async renameFile(input: Types.FileRenameInput): Promise<Types.FileOperationResult> {
    return this.ops.renameFile(this.context, input);
  }

  async deleteFile(path: string): Promise<Types.FileOperationResult> {
    return this.ops.deleteFile(this.context, path);
  }

  async directoryInfoByPath(path: string): Promise<Types.DirectoryInfo | null> {
    return this.ops.directoryInfoByPath(this.context, path);
  }

  async fileInfoByPath(path: string): Promise<Types.FileInfo | null> {
    return this.ops.fileInfoByPath(this.context, path);
  }

  async fileInfoByDbFileId(id: bigint): Promise<Types.FileInfo | null> {
    return this.ops.fileInfoByDbFileId(this.context, id);
  }

  async storageStatistics(path?: string | null): Promise<Types.StorageStats> {
    return this.ops.storageStatistics(this.context, path);
  }

  async fetchDirectoryChildren(path?: string | null): Promise<Types.DirectoryInfo[]> {
    return this.ops.fetchDirectoryChildren(this.context, path);
  }

  async moveItems(input: Types.StorageItemsMoveInput): Promise<Types.BulkOperationResult> {
    return this.ops.moveItems(this.context, input);
  }

  async copyItems(input: Types.StorageItemsCopyInput): Promise<Types.BulkOperationResult> {
    return this.ops.copyItems(this.context, input);
  }

  async deleteItems(input: Types.StorageItemsDeleteInput): Promise<Types.BulkOperationResult> {
    return this.ops.deleteItems(this.context, input);
  }
}
