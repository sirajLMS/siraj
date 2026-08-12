import { ParentRepository } from "@/backend/db/repo/parents";
import { SignedUrlRepository } from "@/backend/db/repo/shared";
import { SiteContentRepository, StorageDbRepository } from "@/backend/db/repo/storage";
import { TeacherRepository } from "@/backend/db/repo/teachers";
import { AppPermission } from "@/backend/enum";
import { logger } from "@/backend/lib";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type {
  DirectoryPermissionsUpdateInput,
  FileOperationResult,
  FileUsageInfo,
  StorageItemProtectionUpdateInput,
  StorageUploadValidationParams,
} from "@/backend/types";
import type { SiteContentUpsertInput } from "@/backend/types/storage/site-content.types";
import type { ValidReferenceTable } from "@/backend/types/storage/storage.types";
import type { ErrorsLabels } from "@/shared/locale";

const VALID_REFERENCE_TABLES: readonly ValidReferenceTable[] = [
  "users",
  "teachers",
  "students",
  "parents",
  "invoices",
  "complaints",
  "learning_resources",
  "staff_profiles",
  "recurring_schedules",
  "class_instances",
  "storageFiles",
];

function isValidReferenceTable(value: string): value is ValidReferenceTable {
  return (VALID_REFERENCE_TABLES as readonly string[]).includes(value);
}

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
  export function validateUpload(params: StorageUploadValidationParams): string | null {
    return StorageDbRepository.validateUpload(params);
  }

  /**
   * Validate a signed URL session.
   * Returns an error response if validation fails, or null if valid.
   */
  export async function validateSignedUrlSession(
    sessionId: string,
    filePath: string
  ): Promise<{
    error: string;
    status: number;
  } | null> {
    const session = await SignedUrlRepository.getSignedUrlById(sessionId);

    if (!session) {
      logger.warn("Invalid upload session", { sessionId, filePath });
      return { error: "Invalid upload session", status: 403 };
    }

    if (session.used) {
      logger.warn("Upload session already used", { sessionId, filePath });
      return { error: "Upload session already used", status: 403 };
    }

    if (session.expiresAt < new Date()) {
      logger.warn("Upload session expired", { sessionId, filePath, expiresAt: session.expiresAt });
      return { error: "Upload session expired", status: 403 };
    }

    if (session.filePath !== filePath) {
      logger.warn("File path mismatch", {
        sessionId,
        expectedPath: session.filePath,
        receivedPath: filePath,
      });
      return { error: "File path mismatch", status: 400 };
    }

    logger.info("✅ Validated upload session", { sessionId, filePath });
    return null;
  }

  /**
   * Claim a signed URL session (mark as used) and return the signed URL data.
   */
  export async function claimSignedUrl(sessionId: string): Promise<{
    contentType: string;
    fileSize: bigint;
    contentHash: string;
    filePath: string;
  } | null> {
    return await SignedUrlRepository.claimSignedUrl(sessionId);
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
   * Get file usages (which entities reference this file).
   */
  export async function getFileUsages(filePath: string): Promise<FileUsageInfo[]> {
    return await StorageDbRepository.getFileUsages(filePath);
  }

  /**
   * Check if a user has access to a file based on its usages.
   * Returns an error response if access is denied, or null if allowed.
   */
  async function checkUserAccessThroughEntity(
    userId: string,
    entityType: "teachers" | "parents",
    referenceId: string
  ): Promise<boolean> {
    if (entityType === "teachers") {
      const teacher = await TeacherRepository.findByUserId(userId);
      return teacher?.id === referenceId;
    } else if (entityType === "parents") {
      const parent = await ParentRepository.findByUserId(userId);
      return parent?.id === referenceId;
    }
    return false;
  }

  export async function checkFileAccess(
    userId: string,
    filePath: string
  ): Promise<{ error: string; status: number } | null> {
    const usages = await StorageDbRepository.getFileUsages(filePath);

    // If no usages, file is accessible to all authenticated users
    if (usages.length === 0) return null;

    // Check if user is super admin
    const userContext = await PermissionsService.getUserContext(userId);
    if (userContext.isSuperAdmin) return null;

    // Direct access for user — short-circuit before async checks
    if (usages.some(u => u.referenceTable === "users" && u.referenceId === userId)) {
      return null;
    }

    // Check access through related entities in parallel
    const entityUsages = usages.filter(
      (u): u is typeof u & { referenceTable: "teachers" | "parents" } =>
        u.referenceTable === "teachers" || u.referenceTable === "parents"
    );
    const entityChecks = entityUsages.map(u => checkUserAccessThroughEntity(userId, u.referenceTable, u.referenceId));

    const hasEntityAccess = (await Promise.all(entityChecks)).some(Boolean);
    if (hasEntityAccess) return null;

    return { error: "Forbidden", status: 403 };
  }

  /**
   * Check if uploads are allowed in a directory.
   * Returns an error message if uploads are not allowed, or null if allowed.
   */
  export async function checkDirectoryUploadPermissions(directoryPath: string): Promise<string | null> {
    const dbDirectory = await StorageDbRepository.directoryByPath(directoryPath);
    if (dbDirectory && !dbDirectory.allowUploads) {
      logger.warn("Uploads not allowed in directory", { directoryPath });
      return "Uploads not allowed in this directory";
    }
    return null;
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
   * Validate a file path for traversal attempts.
   * Returns true if the path is safe, false otherwise.
   */
  export function validatePath(filePath: string): boolean {
    return !(filePath.includes("..") || filePath.startsWith("/") || filePath.startsWith("~"));
  }

  /**
   * Clean up unused file records (files with no references).
   */
  export async function cleanupExpiredFiles(): Promise<void> {
    await StorageDbRepository.cleanupExpiredFiles();
  }

  /**
   * Clean up expired signed URLs.
   */
  export async function cleanupExpiredSignedUrls(): Promise<number> {
    return await SignedUrlRepository.deleteExpired();
  }

  /**
   * Get file metadata by path.
   */
  export async function getFileByPath(filePath: string): Promise<{
    id: string;
    path: string;
    isProtected: boolean;
  } | null> {
    return await StorageDbRepository.fileByPath(filePath);
  }

  /**
   * Links an uploaded file path to an entity junction table.
   */
  export async function linkFileToEntity(input: {
    referenceTable: string;
    referenceId: string;
    usageType: string;
    filePath: string;
  }): Promise<FileOperationResult> {
    if (!isValidReferenceTable(input.referenceTable)) {
      throw new Error(`Invalid reference table: ${input.referenceTable}`);
    }
    return StorageDbRepository.registerFileUsage({
      referenceTable: input.referenceTable,
      referenceId: input.referenceId,
      usageType: input.usageType,
      filePath: input.filePath,
    });
  }

  /**
   * Update directory permissions.
   * Delegates to the repository after the caller has verified authorization.
   */
  export async function updateDirectoryPermissions(
    input: DirectoryPermissionsUpdateInput
  ): Promise<FileOperationResult> {
    logger.info("Updating directory permissions", { path: input.path });
    return await StorageDbRepository.updateDirectoryPermissions(input);
  }

  /**
   * Set protection status on a storage item (file or directory).
   * Delegates to the repository after the caller has verified authorization.
   */
  export async function setStorageItemProtection(
    input: StorageItemProtectionUpdateInput
  ): Promise<FileOperationResult> {
    logger.info("Setting storage item protection", { path: input.path, isProtected: input.isProtected });
    return await StorageDbRepository.setProtection(input);
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
    input: DirectoryPermissionsUpdateInput
  ): Promise<FileOperationResult> {
    return StorageService.updateDirectoryPermissions(input);
  }

  export async function setStorageItemProtection(
    input: StorageItemProtectionUpdateInput
  ): Promise<FileOperationResult> {
    return StorageService.setStorageItemProtection(input);
  }

  /** @deprecated Use StorageService.checkDirectoryUploadPermissions instead */
  export async function checkUploadPermissions(directoryPath: string): Promise<string | null> {
    return StorageService.checkDirectoryUploadPermissions(directoryPath);
  }
}

/** @deprecated Use StorageService directly */
export const StorageUtils = {
  validateUpload: StorageService.validateUpload,
};
