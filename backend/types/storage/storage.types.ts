import type { invoiceFiles, storageDirectories, storageFiles } from "@/backend/db/schema";
import type { OrderSortDirection } from "@/backend/enum";
import type { FileSortField, FileTypes, UploadType } from "@/backend/enum/storage/storage.enum";
// Type aliases to match Kotlin entities
export type FileSelectType = typeof storageFiles.$inferSelect;
export type FileInsertType = typeof storageFiles.$inferInsert;

export type DirectorySelectType = typeof storageDirectories.$inferSelect;

export interface DirectoryPermissions {
  allowUploads: boolean;
  allowDelete: boolean;
  allowMove: boolean;
  allowCreateSubDirs: boolean;
  allowDeleteFiles: boolean;
  allowMoveFiles: boolean;
}

export interface FileUsageInfo {
  id: string;
  filePath: string;
  usageType: string;
  referenceId: string;
  referenceTable: ValidReferenceTable;
  createdAt: Date;
}

// info from db, and storage service

export type ValidReferenceTable =
  | "users"
  | "teachers"
  | "students"
  | "parents"
  | "invoices"
  | "complaints"
  | "learning_resources"
  | "staff_profiles"
  | "recurring_schedules"
  | "class_instances"
  | "storageFiles";

export type StorageObject = {
  path: string;
  name?: string | null;
  isProtected: boolean;
};

export type BucketDirectory = {
  path: string;
  createdAt: Date;
  lastModified: Date;
  isPublic: boolean;
};

export type DirectoryInfo = StorageObject &
  Omit<DirectorySelectType, keyof DirectoryPermissions | "id"> &
  BucketDirectory & {
    path: string;
    name: string;
    isProtected: boolean;
    dbId?: string | null;
    permissions: DirectoryPermissions;
    protectChildren: boolean;
    isFromBucket: boolean;
    fileCount: number;
    folderCount: number;
    totalSize: number;
  };

export type BucketFile = {
  path: string;
  directoryPath: string;
  size: bigint;
  contentType?: string;
  contentHash?: string;
  createdAt: Date;
  lastModified: Date;
  url: string;
  mediaLink?: string;
  fileType: FileTypes;
  isPublic: boolean;
};

export type FileInfo = Omit<FileSelectType, "id"> &
  BucketFile &
  StorageObject & {
    path: string;
    name: string;
    isProtected: boolean;
    dbId?: string | null;
    isFromBucket: boolean;
    isInUse: boolean;
    usages: FileUsageInfo[];
  };

export type StorageObjectList = {
  items: Array<FileInfo | DirectoryInfo>;
  totalCount: number;
  hasMore: boolean;
  offset: number;
  limit: number;
};

// Input types
/** Path traversal protection is enforced server-side — never trust client-provided paths without sanitization */

/**
 * Parameters for upload validation (path, size, contentType).
 * Used by StorageService.validateUpload.
 */
export interface StorageUploadValidationParams {
  path: string;
  size: number;
  contentType: string;
}

/** Path traversal protection is enforced server-side — never trust client-provided paths without sanitization */
export interface FolderCreateInput {
  /** Must be validated against path traversal attacks before use */
  path: string;
  permissions?: DirectoryPermissions | null;
  protected?: boolean | null;
  protectChildren?: boolean | null;
}

/** Path traversal protection is enforced server-side — never trust client-provided paths without sanitization */
export interface DirectoryPermissionsUpdateInput {
  /** Must be validated against path traversal attacks before use */
  path: string;
  permissions: DirectoryPermissions;
}

/** Path traversal protection is enforced server-side — never trust client-provided paths without sanitization */
export interface StorageItemProtectionUpdateInput {
  /** Must be validated against path traversal attacks before use */
  path: string;
  isProtected: boolean;
  protectChildren?: boolean | null;
}

/** Path traversal protection is enforced server-side — never trust client-provided paths without sanitization */
export interface StorageItemsMoveInput {
  /** All paths must be validated against path traversal attacks before use */
  sourcePaths: string[];
  /** Must be validated against path traversal attacks before use */
  destinationPath: string;
}

/** Path traversal protection is enforced server-side — never trust client-provided paths without sanitization */
export interface StorageItemsCopyInput {
  /** All paths must be validated against path traversal attacks before use */
  sourcePaths: string[];
  /** Must be validated against path traversal attacks before use */
  destinationPath: string;
}

/** Path traversal protection is enforced server-side — never trust client-provided paths without sanitization */
export interface StorageItemsDeleteInput {
  /** All paths must be validated against path traversal attacks before use */
  paths: string[];
  force?: boolean | null;
}

/** Path traversal protection is enforced server-side — never trust client-provided paths without sanitization */
export interface FileUsageCheckInput {
  /** Must be validated against path traversal attacks before use */
  path: string;
}

export interface FileUsageRegisterInput {
  filePath: string;
  usageType: string;
  referenceId: string;
  referenceTable: ValidReferenceTable;
}

/** Path traversal protection is enforced server-side — never trust client-provided paths without sanitization */
export interface FileRenameInput {
  /** Must be validated against path traversal attacks before use */
  currentPath: string;
  newName: string;
}

/** Path traversal protection is enforced server-side — never trust client-provided paths without sanitization */
export interface FilesListSearchInput {
  /** Must be validated against path traversal attacks before use */
  path: string;
  limit?: number | null;
  offset?: number | null;
  searchTerm?: string | null;
  includeDirectories?: boolean | null;
  fileType?: string | null; // Deprecated: Use fileTypes instead
  fileTypes?: string[] | null; // List of FileTypes enum values
  contentTypes?: string[] | null; // List of MIME types
  sortBy?: FileSortField | null;
  sortDirection?: OrderSortDirection | null;
}

/** Path traversal protection is enforced server-side — never trust client-provided paths without sanitization */
export interface UploadPreparationInput {
  /** Must be validated against path traversal attacks before use */
  path: string;
  contentType: string;
  fileSize: number;
  contentHash: string;
  uploadedByUserId?: string | null;
}

// Result types
export interface FileOperationResult {
  success: boolean;
  message: string;
  data?: FileInfo | DirectoryInfo | null;
}

export interface FileUsageResult {
  isInUse: boolean;
  usages: FileUsageInfo[];
  canDelete: boolean;
  deleteBlockReason?: string;
}

export type BulkOperationFailure = {
  path: string;
  error: string;
};

export interface BulkOperationResult {
  success: boolean;
  message: string;
  successCount: number;
  failureCount: number;
  failures: BulkOperationFailure[];
  successfulItems: Array<FileInfo | DirectoryInfo>;
}

export interface FileUploadResult {
  success: boolean;
  message: string;
  data?: FileInfo | null;
}

export type FileTypeBreakdown = {
  type: FileTypes;
  count: number;
  size: bigint;
};

export interface StorageStats {
  totalFiles: number;
  totalSize: bigint;
  fileTypeBreakdown: FileTypeBreakdown[];
  directoryCount: number;
}

export type BlobMetadata = {
  name?: string;
  size?: number | string;
  contentType?: string;
  timeCreated?: string;
  updated?: string;
  mediaLink?: string;
  contentHash?: string;
};

/**
 * Upload type discriminator
 * - SIGNED_URL: Traditional flow (GCP, Local) - client uploads to signed URL
 * - VERCEL_BLOB_CLIENT: Vercel Blob flow - client uploads directly using Vercel SDK
 */

/**
 * Upload preparation result
 * Contains instructions for how the client should perform the upload
 */
export interface UploadPreparationResult {
  /**
   * Unique identifier for this upload session
   * - For SIGNED_URL: token ID stored in signed_urls table
   * - For VERCEL_BLOB_CLIENT: upload session ID for tracking
   */
  id: string;

  /**
   * URL or endpoint for upload
   * - For SIGNED_URL: the signed URL to PUT the file to
   * - For VERCEL_BLOB_CLIENT: API endpoint for the Vercel SDK to call
   */
  url: string;

  /**
   * Upload flow type
   */
  uploadType: UploadType;

  /**
   * Upload access level (for Vercel Blob)
   */
  access?: string;
}

type InvoiceFileSelectType = typeof invoiceFiles.$inferSelect;

export type LinkedFileReturnType = Omit<InvoiceFileSelectType, "invoiceId"> & {
  readonly filePath: string;
  readonly isProtected: boolean;
};
