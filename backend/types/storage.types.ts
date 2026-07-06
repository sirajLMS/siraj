import type { invoiceFiles, parentFiles, storageDirectories, storageFiles } from "@/backend/db/schema/storage";
import type { OrderSortDirection } from "@/shared/lib/enum";

// Type aliases to match Kotlin entities
export type FileEntity = typeof storageFiles.$inferSelect;
export type FileEntityInput = typeof storageFiles.$inferInsert;

export type DirectoryEntity = typeof storageDirectories.$inferSelect;
export type DirectoryEntityInput = typeof storageDirectories.$inferInsert;

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
  Omit<DirectoryEntity, keyof DirectoryPermissions | "id"> &
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

export type FileInfo = Omit<FileEntity, "id"> &
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

export enum FileTypes {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  AUDIO = "AUDIO",
  DOCUMENT = "DOCUMENT",
  ARCHIVE = "ARCHIVE",
  FONT = "FONT",
  OTHER = "OTHER",
}

export enum FileSortField {
  NAME = "NAME",
  SIZE = "SIZE",
  TYPE = "TYPE",
  CREATED = "CREATED",
  MODIFIED = "MODIFIED",
}

// Input types
/** @remarks Path traversal protection is enforced server-side — never trust client-provided paths without sanitization */
export interface FolderCreateInput {
  /** @remarks Must be validated against path traversal attacks before use */
  path: string;
  permissions?: DirectoryPermissions | null;
  protected?: boolean | null;
  protectChildren?: boolean | null;
}

/** @remarks Path traversal protection is enforced server-side — never trust client-provided paths without sanitization */
export interface DirectoryPermissionsUpdateInput {
  /** @remarks Must be validated against path traversal attacks before use */
  path: string;
  permissions: DirectoryPermissions;
}

/** @remarks Path traversal protection is enforced server-side — never trust client-provided paths without sanitization */
export interface StorageItemProtectionUpdateInput {
  /** @remarks Must be validated against path traversal attacks before use */
  path: string;
  isProtected: boolean;
  protectChildren?: boolean | null;
}

/** @remarks Path traversal protection is enforced server-side — never trust client-provided paths without sanitization */
export interface StorageItemsMoveInput {
  /** @remarks All paths must be validated against path traversal attacks before use */
  sourcePaths: string[];
  /** @remarks Must be validated against path traversal attacks before use */
  destinationPath: string;
}

/** @remarks Path traversal protection is enforced server-side — never trust client-provided paths without sanitization */
export interface StorageItemsCopyInput {
  /** @remarks All paths must be validated against path traversal attacks before use */
  sourcePaths: string[];
  /** @remarks Must be validated against path traversal attacks before use */
  destinationPath: string;
}

/** @remarks Path traversal protection is enforced server-side — never trust client-provided paths without sanitization */
export interface StorageItemsDeleteInput {
  /** @remarks All paths must be validated against path traversal attacks before use */
  paths: string[];
  force?: boolean | null;
}

/** @remarks Path traversal protection is enforced server-side — never trust client-provided paths without sanitization */
export interface FileUsageCheckInput {
  /** @remarks Must be validated against path traversal attacks before use */
  path: string;
}

export interface FileUsageRegisterInput {
  filePath: string;
  usageType: string;
  referenceId: string;
  referenceTable: ValidReferenceTable;
}

/** @remarks Path traversal protection is enforced server-side — never trust client-provided paths without sanitization */
export interface FileRenameInput {
  /** @remarks Must be validated against path traversal attacks before use */
  currentPath: string;
  newName: string;
}

/** @remarks Path traversal protection is enforced server-side — never trust client-provided paths without sanitization */
export interface FilesListSearchInput {
  /** @remarks Must be validated against path traversal attacks before use */
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

/** @remarks Path traversal protection is enforced server-side — never trust client-provided paths without sanitization */
export interface UploadPreparationInput {
  /** @remarks Must be validated against path traversal attacks before use */
  path: string;
  contentType: string;
  fileSize: number;
  contentHash: string;
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

export interface BulkOperationResult {
  success: boolean;
  message: string;
  successCount: number;
  failureCount: number;
  failures: Array<{ path: string; error: string }>;
  successfulItems: Array<FileInfo | DirectoryInfo>;
}

export interface FileUploadResult {
  success: boolean;
  message: string;
  data?: FileInfo | null;
}

export interface StorageStats {
  totalFiles: number;
  totalSize: bigint;
  fileTypeBreakdown: Array<{
    type: FileTypes;
    count: number;
    size: bigint;
  }>;
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
export enum UploadType {
  SIGNED_URL = "SIGNED_URL",
  VERCEL_BLOB_CLIENT = "VERCEL_BLOB_CLIENT",
}

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

export type InvoiceFileSelectType = typeof invoiceFiles.$inferSelect;
export type ParentFileSelectType = typeof parentFiles.$inferSelect;

export type LinkedFileReturnType = Omit<InvoiceFileSelectType, "invoiceId"> & {
  readonly filePath: string;
  readonly isProtected: boolean;
};
