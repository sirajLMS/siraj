import logger from "@/backend/lib/logger";
import { NEXT_PUBLIC_BASE_URL } from "@/backend/lib/server";
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
import type { VercelContext } from "./types";

export class VercelAdapter implements StorageService {
  private readonly context: VercelContext;

  constructor() {
    const token = process.env.BLOB_READ_WRITE_TOKEN || "";
    if (!token) {
      throw new Error("BLOB_READ_WRITE_TOKEN environment variable is required for Vercel Blob storage");
    }

    this.context = {
      baseUrl: NEXT_PUBLIC_BASE_URL,
      token,
    };

    logger.info("Vercel Blob storage initialized");
  }

  async fileExists(filePath: string): Promise<boolean> {
    return fileExists(this.context, filePath);
  }

  async prepareUpload(input: Types.UploadPreparationInput): Promise<Types.UploadPreparationResult> {
    return prepareUpload(this.context, input);
  }

  async uploadFile(filePath: string, contentType: string, buffer: Buffer): Promise<Types.FileUploadResult> {
    return uploadFile(this.context, filePath, contentType, buffer);
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

  async deleteFile(filePath: string): Promise<Types.FileOperationResult> {
    return deleteFile(this.context, filePath);
  }

  async directoryInfoByPath(dirPath: string): Promise<Types.DirectoryInfo | null> {
    return directoryInfoByPath(this.context, dirPath);
  }

  async fileInfoByPath(filePath: string): Promise<Types.FileInfo | null> {
    return fileInfoByPath(this.context, filePath);
  }

  async fileInfoByDbFileId(id: bigint): Promise<Types.FileInfo | null> {
    return fileInfoByDbFileId(this.context, id);
  }

  async storageStatistics(searchPath?: string | null): Promise<Types.StorageStats> {
    return storageStatistics(this.context, searchPath);
  }

  async fetchDirectoryChildren(searchPath?: string | null): Promise<Types.DirectoryInfo[]> {
    return fetchDirectoryChildren(this.context, searchPath);
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
