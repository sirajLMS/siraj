import type { Storage } from "@google-cloud/storage";
import type * as Types from "@/backend/types";
import type { StorageService } from "../storage.service.interface";
import { copyItems } from "./operations/copy.operations";
import { deleteFile, deleteItems } from "./operations/delete.operations";
import { fileExists, fileInfoByDbFileId, fileInfoByPath, renameFile } from "./operations/file.operations";
import { createFolder, directoryInfoByPath } from "./operations/folder.operations";
import { fetchDirectoryChildren, listFiles } from "./operations/list.operations";
import { moveItems } from "./operations/move.operations";
import { storageStatistics } from "./operations/stats.operations";
import { prepareUpload, uploadFile } from "./operations/upload.operations";
import type { GcpContext } from "./types";

export class GcpAdapter implements StorageService {
  private readonly context: GcpContext;

  constructor(storage: Storage) {
    const bucketName = process.env.GCP_BUCKET_NAME;
    if (!bucketName) {
      throw new Error("GCP_BUCKET_NAME environment variable is required");
    }

    this.context = {
      bucket: storage.bucket(bucketName),
      gcpBaseUrl: `https://storage.googleapis.com/${bucketName}/`,
    };
  }

  async fileExists(path: string): Promise<boolean> {
    return fileExists(this.context, path);
  }

  async prepareUpload(input: Types.UploadPreparationInput): Promise<Types.UploadPreparationResult> {
    return prepareUpload(this.context, input);
  }

  async uploadFile(path: string, contentType: string, buffer: Buffer): Promise<Types.FileUploadResult> {
    return uploadFile(this.context, path, contentType, buffer);
  }

  async listFiles(input: Types.FilesListSearchInput): Promise<Types.StorageObjectList> {
    return listFiles(this.context, input);
  }

  async createFolder(input: Types.FolderCreateInput): Promise<Types.FileOperationResult> {
    return createFolder(this.context, input);
  }

  async renameFile(input: Types.FileRenameInput): Promise<Types.FileOperationResult> {
    return renameFile(this.context, input);
  }

  async deleteFile(path: string): Promise<Types.FileOperationResult> {
    return deleteFile(this.context, path);
  }

  async directoryInfoByPath(path: string): Promise<Types.DirectoryInfo | null> {
    return directoryInfoByPath(this.context, path);
  }

  async fileInfoByPath(path: string): Promise<Types.FileInfo | null> {
    return fileInfoByPath(this.context, path);
  }

  async fileInfoByDbFileId(id: bigint): Promise<Types.FileInfo | null> {
    return fileInfoByDbFileId(this.context, id);
  }

  async storageStatistics(path?: string): Promise<Types.StorageStats> {
    return storageStatistics(this.context, path);
  }

  async fetchDirectoryChildren(path?: string): Promise<Types.DirectoryInfo[]> {
    return fetchDirectoryChildren(this.context, path);
  }

  async moveItems(input: Types.StorageItemsMoveInput): Promise<Types.BulkOperationResult> {
    return moveItems(this.context, input);
  }

  async copyItems(input: Types.StorageItemsCopyInput): Promise<Types.BulkOperationResult> {
    return copyItems(this.context, input);
  }

  async deleteItems(input: Types.StorageItemsDeleteInput): Promise<Types.BulkOperationResult> {
    return deleteItems(this.context, input);
  }
}
