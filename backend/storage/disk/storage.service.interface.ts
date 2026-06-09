import type * as Types from "@/backend/types";

type StorageProvider = "gcp";

/**
 * Storage Service Interface
 * Handles cloud storage operations (GCP Cloud Storage) and integrates with database
 * Matches the Kotlin StorageService interface
 */
export interface StorageService {
  /**
   * Check if a file exists in cloud storage
   */
  fileExists(path: string): Promise<boolean>;

  /**
   * Prepare upload by generating upload instructions
   * Returns upload preparation result with URL and upload type
   */
  prepareUpload(input: Types.UploadPreparationInput): Promise<Types.UploadPreparationResult>;

  /**
   * Upload a file to cloud storage
   */
  uploadFile(path: string, contentType: string, buffer: Buffer): Promise<Types.FileUploadResult>;

  /**
   * List files and directories with pagination and filtering
   */
  listFiles(input: Types.FilesListSearchInput): Promise<Types.StorageObjectList>;

  /**
   * Create a folder in cloud storage
   */
  createFolder(input: Types.FolderCreateInput): Promise<Types.FileOperationResult>;

  /**
   * Rename a file or folder
   */
  renameFile(input: Types.FileRenameInput): Promise<Types.FileOperationResult>;

  /**
   * Delete a single file
   */
  deleteFile(path: string): Promise<Types.FileOperationResult>;

  /**
   * Get directory information by path
   */
  directoryInfoByPath(path: string): Promise<Types.DirectoryInfo | null>;

  /**
   * Get file information by path
   */
  fileInfoByPath(path: string): Promise<Types.FileInfo | null>;

  /**
   * Get file information by database file ID
   */
  fileInfoByDbFileId(id: bigint): Promise<Types.FileInfo | null>;

  /**
   * Get storage statistics
   */
  storageStatistics(path?: string | null): Promise<Types.StorageStats>;

  /**
   * Fetch immediate directory children for lazy loading
   */
  fetchDirectoryChildren(path?: string | null): Promise<Types.DirectoryInfo[]>;

  /**
   * Move multiple files/folders
   */
  moveItems(input: Types.StorageItemsMoveInput): Promise<Types.BulkOperationResult>;

  /**
   * Copy multiple files/folders
   */
  copyItems(input: Types.StorageItemsCopyInput): Promise<Types.BulkOperationResult>;

  /**
   * Delete multiple items
   */
  deleteItems(input: Types.StorageItemsDeleteInput): Promise<Types.BulkOperationResult>;
}

/**
 * Factory function to create StorageService instance
 * Matches the Kotlin storageService factory function
 */
export declare function createStorageService(provider: StorageProvider): StorageService;

/**
 * Configuration constants matching Kotlin companion object
 */
export const STORAGE_CONFIG = {
  SIGNED_URL_DURATION: 15, // minutes
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  DEFAULT_CONTENT_TYPE: "application/octet-stream",
} as const;

/**
 * Helper functions for file type detection and validation
 */
export interface StorageUtils {
  getFileTypeFromContentType(contentType?: string): string;
  validatePath(path: string): string | null;
  extractDirectoryPath(filePath: string): string;
  extractFileName(filePath: string): string;
  sanitizePath(path: string): string;
}

/**
 * Error classes for storage operations
 */
export class StorageError extends Error {
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

export class StorageNotFoundError extends StorageError {
  constructor(path: string) {
    super(`File or directory not found: ${path}`, "NOT_FOUND");
    this.name = "StorageNotFoundError";
  }
}

export class StoragePermissionError extends StorageError {
  constructor(message: string) {
    super(message, "PERMISSION_DENIED");
    this.name = "StoragePermissionError";
  }
}
