import {
  BillingRepository,
  ComplaintRepository,
  ParentRepository,
  SignedUrlRepository,
  StorageDbRepository,
  TeacherRepository,
} from "@/backend/db/repo";
import { AppPermission } from "@/backend/enum";
import { logger } from "@/backend/lib";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { UserPermissionContext, ValidReferenceTable } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

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

export function isValidReferenceTable(value: string): value is ValidReferenceTable {
  return (VALID_REFERENCE_TABLES as readonly string[]).includes(value);
}

async function resolveParentIdForReferenceTable(
  referenceTable: "invoices" | "complaints",
  referenceId: string
): Promise<string | null> {
  if (referenceTable === "invoices") {
    return (await BillingRepository.getInvoiceById(referenceId))?.parentId ?? null;
  }
  return (await ComplaintRepository.getComplaintById(referenceId))?.parentId ?? null;
}

/**
 * Ownership for reference tables that do not point directly at a user.
 * Invoices and complaints are owned through their parent (parents.userId);
 * learning resources are available to any caller with RESOURCES_LIST.
 */
async function checkUserAccessThroughReferenceTable(
  userId: string,
  referenceTable: ValidReferenceTable,
  referenceId: string,
  userContext: UserPermissionContext
): Promise<boolean> {
  if (referenceTable === "learning_resources") {
    return userContext.permissions.includes(AppPermission.RESOURCES_LIST);
  }
  if (referenceTable !== "invoices" && referenceTable !== "complaints") return false;

  const parentId = await resolveParentIdForReferenceTable(referenceTable, referenceId);
  if (!parentId) return false;
  const ownerUserId = await ParentRepository.findUserIdByParentId(parentId);
  return ownerUserId === userId;
}

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

/**
 * Resolve file access from the file's usages: super admins and direct owners
 * are allowed; otherwise ownership is checked through related entities and
 * reference tables. Default-deny when no usages exist so unlinked files are
 * never readable.
 */
export async function resolveFileAccess(
  userId: string,
  filePath: string,
  locale?: string
): Promise<{ error: string; status: number } | null> {
  const tErrors = getServerTranslations(locale ?? "en").errorsTranslations.file;
  const usages = await StorageDbRepository.getFileUsages(filePath);

  // Default-deny when no usages (prevents unlinked file access): a file created
  // but not yet junction-linked is in an upload race window.
  if (usages.length === 0) return { error: tErrors.forbidden, status: 403 };

  const userContext = await PermissionsService.getUserContext(userId);
  if (userContext.isSuperAdmin) return null;

  // Direct access for user — short-circuit before async checks.
  if (usages.some(u => u.referenceTable === "users" && u.referenceId === userId)) {
    return null;
  }

  // Check access through related entities and reference tables in parallel.
  const entityUsages = usages.filter(
    (u): u is typeof u & { referenceTable: "teachers" | "parents" } =>
      u.referenceTable === "teachers" || u.referenceTable === "parents"
  );
  const entityChecks = entityUsages.map(u => checkUserAccessThroughEntity(userId, u.referenceTable, u.referenceId));

  const referenceChecks = usages
    .filter(
      u =>
        u.referenceTable === "invoices" ||
        u.referenceTable === "complaints" ||
        u.referenceTable === "learning_resources"
    )
    .map(u => checkUserAccessThroughReferenceTable(userId, u.referenceTable, u.referenceId, userContext));

  const [hasEntityAccess, hasReferenceAccess] = await Promise.all([
    Promise.all(entityChecks).then(results => results.some(Boolean)),
    Promise.all(referenceChecks).then(results => results.some(Boolean)),
  ]);
  if (hasEntityAccess || hasReferenceAccess) return null;

  return { error: tErrors.forbidden, status: 403 };
}

/**
 * Validate a signed URL session and return the first rejection, or null when
 * the session is valid for the given path and uploader.
 */
export async function resolveSignedUrlSessionError(
  sessionId: string,
  filePath: string,
  userId: string | undefined,
  locale?: string
): Promise<{ error: string; status: number } | null> {
  const tErrors = getServerTranslations(locale ?? "en").errorsTranslations.file;
  const session = await SignedUrlRepository.getSignedUrlById(sessionId);

  if (!session) {
    logger.warn("Invalid upload session", { sessionId, filePath });
    return { error: tErrors.invalidUploadSession, status: 403 };
  }

  if (session.used) {
    logger.warn("Upload session already used", { sessionId, filePath });
    return { error: tErrors.uploadSessionAlreadyUsed, status: 403 };
  }

  if (session.expiresAt < new Date()) {
    logger.warn("Upload session expired", { sessionId, filePath, expiresAt: session.expiresAt });
    return { error: tErrors.uploadSessionExpired, status: 403 };
  }

  if (session.filePath !== filePath) {
    logger.warn("File path mismatch", {
      sessionId,
      expectedPath: session.filePath,
      receivedPath: filePath,
    });
    return { error: tErrors.filePathMismatch, status: 400 };
  }

  if (!session.uploadedByUserId) {
    logger.warn("Signed URL session is not bound to an uploader", { sessionId, filePath });
    return { error: tErrors.invalidUploadSession, status: 403 };
  }

  if (session.uploadedByUserId !== userId) {
    logger.warn("Signed URL user mismatch in session validation", {
      sessionId,
      signedUrlUserId: session.uploadedByUserId,
      userId,
    });
    return { error: tErrors.invalidUploadSession, status: 403 };
  }

  logger.info("✅ Validated upload session", { sessionId, filePath });
  return null;
}

export async function claimSignedUrlResult(sessionId: string): Promise<{
  contentType: string;
  fileSize: bigint;
  contentHash: string;
  filePath: string;
  uploadedByUserId: string | null;
} | null> {
  const row = await SignedUrlRepository.claimSignedUrl(sessionId);
  if (!row) return null;
  return {
    contentType: row.contentType,
    fileSize: BigInt(row.fileSize),
    contentHash: row.contentHash,
    filePath: row.filePath,
    uploadedByUserId: row.uploadedByUserId ?? null,
  };
}

/**
 * Check upload permission for a directory. Default-deny when the directory is
 * not registered so an authenticated user cannot upload to non-existent paths.
 */
export async function resolveDirectoryUploadError(directoryPath: string, locale?: string): Promise<string | null> {
  const tErrors = getServerTranslations(locale ?? "en").errorsTranslations.file;
  const dbDirectory = await StorageDbRepository.directoryByPath(directoryPath);
  if (!dbDirectory) {
    logger.warn("Upload rejected: directory not registered (default-deny)", { directoryPath });
    return tErrors.uploadsNotAllowedInDirectory;
  }
  if (!dbDirectory.allowUploads) {
    logger.warn("Uploads not allowed in directory", { directoryPath });
    return tErrors.uploadsNotAllowedInDirectory;
  }
  return null;
}
