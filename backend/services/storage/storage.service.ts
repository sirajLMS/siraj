import { SignedUrlRepository, SiteContentRepository, StorageDbRepository } from "@/backend/db/repo";
import { AppPermission } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import {
  claimSignedUrlResult,
  resolveDirectoryUploadError,
  resolveFileAccess,
  resolveSignedUrlSessionError,
} from "@/backend/services/storage/storage.helpers";
import {
  linkFileToEntityResult,
  resolveFileUsageResult,
  setStorageItemProtectionResult,
  updateDirectoryPermissionsResult,
} from "@/backend/services/storage/storage-operations.helpers";
import type {
  DirectoryPermissionsUpdateInput,
  FileOperationResult,
  FileUsageCheckInput,
  FileUsageResult,
  SiteContentUpsertInput,
  StorageItemProtectionUpdateInput,
  StorageUploadValidationParams,
} from "@/backend/types";
import { StorageUtils } from "@/backend/utils/storage.utils";
import type { ErrorsLabels } from "@/shared/locale";

// --- Extended StorageService ---
export namespace StorageService {
  // ─── Bootstrap / Seeder Operations (no auth) ──────────────────────────────

  export async function upsertManySiteContent(inputs: readonly SiteContentUpsertInput[]) {
    return SiteContentRepository.upsertMany(inputs);
  }

  /**
   * Require that the user has STORAGE_MANAGE permission.
   * Throws a localized error if the user lacks the permission.
   */
  export async function requireStorageManage(userId: string, tErrors: ErrorsLabels): Promise<void> {
    const hasPermission = await PermissionsService.hasPermission(userId, AppPermission.STORAGE_MANAGE);
    if (!hasPermission) {
      throw new Error(tErrors.insufficientPermissions);
    }
  }

  /**
   * Require that the user has STORAGE_MANAGE permission OR is an owner of the file.
   * Ownership is determined by checking file usages for a user reference.
   * Throws a localized error if neither condition is met.
   */
  export async function requireStorageManageOrOwner(
    userId: string,
    filePath: string,
    tErrors: ErrorsLabels
  ): Promise<void> {
    const hasPermission = await PermissionsService.hasPermission(userId, AppPermission.STORAGE_MANAGE);
    if (hasPermission) return;

    const usages = await StorageDbRepository.getFileUsages(filePath);
    const isOwner = usages.some(u => u.referenceTable === "users" && u.referenceId === userId);
    if (!isOwner) {
      throw new Error(tErrors.insufficientPermissions);
    }
  }

  /**
   * Validate upload parameters (path, size, contentType).
   * Returns an error message if validation fails, or null if valid.
   */
  export function validateUpload(params: StorageUploadValidationParams, locale?: string): string | null {
    return StorageDbRepository.validateUpload(params, locale);
  }

  /**
   * Validate a signed URL session.
   * Returns an error response if validation fails, or null if valid.
   */
  export async function validateSignedUrlSession(
    sessionId: string,
    filePath: string,
    locale?: string,
    userId?: string
  ): Promise<{
    error: string;
    status: number;
  } | null> {
    return resolveSignedUrlSessionError(sessionId, filePath, userId, locale);
  }

  /**
   * Claim a signed URL session (mark as used) and return the signed URL data.
   */
  export async function claimSignedUrl(sessionId: string): Promise<{
    contentType: string;
    fileSize: bigint;
    contentHash: string;
    filePath: string;
    uploadedByUserId: string | null;
  } | null> {
    return claimSignedUrlResult(sessionId);
  }

  /**
   * Create a file record in the database.
   */
  export async function createFile(filePath: string): Promise<void> {
    await StorageDbRepository.createFile(filePath);
  }

  /**
   * Create a file record in the database and return the file entity.
   */
  export async function createFileAndGet(
    filePath: string,
    isProtected: boolean = false
  ): Promise<{
    id: string;
    path: string;
    isProtected: boolean;
  }> {
    return await StorageDbRepository.createFile(filePath, isProtected);
  }

  /**
   * Check if a user has access to a file based on its usages.
   * Returns an error response if access is denied, or null if allowed.
   */
  export async function checkFileAccess(
    userId: string,
    filePath: string,
    locale?: string
  ): Promise<{ error: string; status: number } | null> {
    return resolveFileAccess(userId, filePath, locale);
  }

  /**
   * Check if uploads are allowed in a directory.
   * Returns an error message if uploads are not allowed, or null if allowed.
   */
  export async function checkDirectoryUploadPermissions(
    directoryPath: string,
    locale?: string
  ): Promise<string | null> {
    return resolveDirectoryUploadError(directoryPath, locale);
  }

  /**
   * Get files associated with an invoice.
   */
  export async function getFilesForInvoice(
    invoiceId: string,
    usageType?: string,
    limit?: number
  ): Promise<
    Array<{
      id: string;
      fileId: string;
      filePath: string;
      isProtected: boolean;
    }>
  > {
    return await StorageDbRepository.getFilesForInvoice(invoiceId, usageType, undefined, limit);
  }

  /**
   * Validate a file path for traversal attempts and invalid characters.
   * Returns true if the path is safe, false otherwise.
   */
  export function validatePath(filePath: string): boolean {
    return StorageUtils.validatePath(filePath) === null;
  }

  /**
   * Clean up expired signed URLs.
   */
  export async function cleanupExpiredSignedUrls(): Promise<number> {
    return await SignedUrlRepository.deleteExpired();
  }

  /**
   * Links an uploaded file path to an entity junction table.
   * Owns the success/message derivation (business logic) — the repo does pure DB ops.
   */
  export async function linkFileToEntity(
    input: {
      referenceTable: string;
      referenceId: string;
      usageType: string;
      filePath: string;
    },
    locale?: string
  ): Promise<FileOperationResult> {
    return linkFileToEntityResult(input, locale);
  }

  /**
   * Checks file usage and derives whether the file can be deleted.
   * Owns the `canDelete`/`deleteBlockReason` business logic — the repo only
   * queries raw usage data.
   */
  export async function checkFileUsage(input: FileUsageCheckInput, locale?: string): Promise<FileUsageResult> {
    return resolveFileUsageResult(input, locale);
  }

  /**
   * Update directory permissions.
   * Owns the success/message derivation (business logic) — the repo does pure DB ops.
   */
  export async function updateDirectoryPermissions(
    input: DirectoryPermissionsUpdateInput,
    locale?: string
  ): Promise<FileOperationResult> {
    return updateDirectoryPermissionsResult(input, locale);
  }

  /**
   * Set protection status on a storage item (file or directory).
   * Owns the success/message derivation (business logic) — the repo does pure DB ops.
   */
  export async function setStorageItemProtection(
    input: StorageItemProtectionUpdateInput,
    locale?: string
  ): Promise<FileOperationResult> {
    return setStorageItemProtectionResult(input, locale);
  }
}

// --- Legacy exports (for backward compatibility) ---
export namespace StorageAuthService {
  export async function requireStorageManage(userId: string, tErrors: ErrorsLabels): Promise<void> {
    return StorageService.requireStorageManage(userId, tErrors);
  }

  export async function requireStorageManageOrOwner(
    userId: string,
    filePath: string,
    tErrors: ErrorsLabels
  ): Promise<void> {
    return StorageService.requireStorageManageOrOwner(userId, filePath, tErrors);
  }
}

export namespace StorageManageService {
  export async function updateDirectoryPermissions(
    input: DirectoryPermissionsUpdateInput,
    locale?: string
  ): Promise<FileOperationResult> {
    return StorageService.updateDirectoryPermissions(input, locale);
  }

  export async function setStorageItemProtection(
    input: StorageItemProtectionUpdateInput,
    locale?: string
  ): Promise<FileOperationResult> {
    return StorageService.setStorageItemProtection(input, locale);
  }
}
