import type * as Types from "@/backend/types";

/**
 * Storage Service Interface
 * Handles cloud storage operations (GCP Cloud Storage) and integrates with database
 * Matches the Kotlin StorageService interface
 */
export interface StorageService {
  fileExists(path: string): Promise<boolean>;
  prepareUpload(input: Types.UploadPreparationInput, locale?: string): Promise<Types.UploadPreparationResult>;
  uploadFile(path: string, contentType: string, buffer: Buffer, locale?: string): Promise<Types.FileUploadResult>;
  listFiles(input: Types.FilesListSearchInput): Promise<Types.StorageObjectList>;
  createFolder(input: Types.FolderCreateInput, locale?: string): Promise<Types.FileOperationResult>;
  renameFile(input: Types.FileRenameInput, locale?: string): Promise<Types.FileOperationResult>;
  deleteFile(path: string, locale?: string): Promise<Types.FileOperationResult>;
  directoryInfoByPath(path: string): Promise<Types.DirectoryInfo | null>;
  fileInfoByPath(path: string): Promise<Types.FileInfo | null>;
  fileInfoByDbFileId(id: string): Promise<Types.FileInfo | null>;
  storageStatistics(path?: string | null): Promise<Types.StorageStats>;
  fetchDirectoryChildren(path?: string | null): Promise<Types.DirectoryInfo[]>;
  moveItems(input: Types.StorageItemsMoveInput, locale?: string): Promise<Types.BulkOperationResult>;
  copyItems(input: Types.StorageItemsCopyInput, locale?: string): Promise<Types.BulkOperationResult>;
  deleteItems(input: Types.StorageItemsDeleteInput, locale?: string): Promise<Types.BulkOperationResult>;
}

/**
 * Configuration constants matching Kotlin companion object
 */
export const STORAGE_CONFIG = {
  SIGNED_URL_DURATION: 15, // minutes
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  DEFAULT_CONTENT_TYPE: "application/octet-stream",
} as const;

/**
 * Error classes for storage operations
 */
class StorageError extends Error {
  constructor(
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = "StorageError";
  }
}

export class StorageValidationError extends StorageError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR");
    this.name = "StorageValidationError";
  }
}
