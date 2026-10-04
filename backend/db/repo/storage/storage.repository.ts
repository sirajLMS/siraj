import {
  assertFilePathNotPublic,
  deleteOwnerFileJunctionRows,
  insertJunctionRow,
  type JunctionInsertParams,
  MAX_FILE_SIZE_BYTES,
} from "@/backend/db/repo/storage/storage.repository.helpers";
import {
  deleteDirectoryRow,
  deleteFileRow,
  insertFileRow,
  insertInvoiceFileLink,
  insertParentFileLink,
  selectDirectoriesByParentPath,
  selectDirectoriesByPaths,
  selectDirectoryByPath,
  selectFileById,
  selectFileByPath,
  selectFilesByPaths,
  selectLinkedFilesForInvoice,
  selectLinkedFilesForParent,
  updateDirectoryRecord,
  updateFileRow,
  upsertDirectoryRecord,
} from "@/backend/db/repo/storage/storage.repository.queries";
import {
  collectFileUsages,
  deleteUsagesFromAllTables,
  isFileIdInUse,
} from "@/backend/db/repo/storage/storage.repository.usage.helpers";
import { logger } from "@/backend/lib";
import { isAllowedMimeType } from "@/backend/lib/storage/mime-allowlist";
import type * as StorageTypes from "@/backend/types";
import type { DBTransaction } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

export namespace StorageDbRepository {
  // File operations
  export const fileById = (id: string): Promise<StorageTypes.FileSelectType | null> => selectFileById(id);

  export const fileByPath = (path: string): Promise<StorageTypes.FileSelectType | null> => selectFileByPath(path);

  export const filesByPaths = (paths: string[]): Promise<StorageTypes.FileSelectType[]> => selectFilesByPaths(paths);

  export const createFile = (path: string, isProtected: boolean = false): Promise<StorageTypes.FileSelectType> =>
    insertFileRow(path, isProtected);

  export const updateFile = (
    file: StorageTypes.FileInsertType & { id: string }
  ): Promise<StorageTypes.FileSelectType | undefined> => updateFileRow(file);

  export const deleteFile = (path: string): Promise<boolean> => deleteFileRow(path);

  // Directory operations
  export const directoryByPath = (path: string): Promise<StorageTypes.DirectorySelectType | null> =>
    selectDirectoryByPath(path);

  export const directoriesByParentPath = (parentPath?: string): Promise<StorageTypes.DirectorySelectType[]> =>
    selectDirectoriesByParentPath(parentPath);

  export const directoriesByPaths = (paths: string[]): Promise<StorageTypes.DirectorySelectType[]> =>
    selectDirectoriesByPaths(paths);

  export const createDirectory = (input: StorageTypes.FolderCreateInput): Promise<StorageTypes.DirectorySelectType> =>
    upsertDirectoryRecord(input);

  export const ensureDirectoryRecord = (
    input: StorageTypes.FolderCreateInput
  ): Promise<StorageTypes.DirectorySelectType> => upsertDirectoryRecord(input);

  export const updateDirectory = (
    directory: StorageTypes.DirectorySelectType
  ): Promise<StorageTypes.DirectorySelectType | undefined> => updateDirectoryRecord(directory);

  export const deleteDirectory = (path: string): Promise<boolean> => deleteDirectoryRow(path);

  // File usage operations
  export const getFileUsages = async (filePath: string): Promise<StorageTypes.FileUsageInfo[]> => {
    const file = await fileByPath(filePath);
    if (!file) return [];
    return collectFileUsages(file.id, file.path);
  };

  export const isFileInUse = async (filePath: string): Promise<boolean> => {
    const file = await fileByPath(filePath);
    if (!file) return false;
    return isFileIdInUse(file.id);
  };

  export const registerFileUsage = async (
    input: StorageTypes.FileUsageRegisterInput,
    locale?: string
  ): Promise<StorageTypes.FileOperationResult> => {
    try {
      const { referenceTable, referenceId, usageType, filePath } = input;

      const file = await createFile(filePath);
      await performJunctionInsert(
        {
          table: referenceTable,
          fileId: file.id,
          refId: referenceId,
          type: usageType,
          createdAt: new Date(),
        },
        locale
      );

      return { success: true, message: "File usage registered successfully" };
    } catch (error) {
      logger.error("Failed to register file usage", { error: error instanceof Error ? error.message : String(error) });
      const tErrors = getServerTranslations(locale ?? "en").errorsTranslations.file;
      return { success: false, message: tErrors.fileUsageRegisterFailedGeneric };
    }
  };

  /**
   * Helper to perform the actual junction table insertion in a type-safe way.
   * Exported so StorageService can call it from the service layer.
   */
  export async function performJunctionInsert(
    params: JunctionInsertParams,
    locale?: string,
    tx?: DBTransaction
  ): Promise<void> {
    await insertJunctionRow(params, locale, tx);
  }

  export const unregisterFileUsage = async (
    filePath: string,
    usageType: string,
    referenceId: string
  ): Promise<boolean> => {
    try {
      const file = await fileByPath(filePath);
      if (!file) return true;

      await deleteUsagesFromAllTables(file.id, usageType, referenceId);

      return true;
    } catch (error) {
      logger.error("Failed to unregister file usage:", error);
      return false;
    }
  };

  // Business logic methods
  export const checkFileUsage = async (
    input: StorageTypes.FileUsageCheckInput
  ): Promise<StorageTypes.FileUsageResult> => {
    try {
      const usages = await getFileUsages(input.path);
      const isInUse = usages.length > 0;

      return {
        isInUse,
        usages,
        canDelete: !isInUse,
        deleteBlockReason: isInUse ? "File is currently being used" : undefined,
      };
    } catch (err) {
      logger.error("Error checking file usage:", err);
      return {
        isInUse: false,
        usages: [],
        canDelete: false,
        deleteBlockReason: "Unable to check file usage",
      };
    }
  };

  export const getFilesForParent = (
    parentId: string,
    tx?: DBTransaction
  ): Promise<StorageTypes.LinkedFileReturnType[]> => selectLinkedFilesForParent(parentId, tx);

  export const getFilesForInvoice = (
    invoiceId: string,
    usageType?: string,
    tx?: DBTransaction,
    limit?: number
  ): Promise<StorageTypes.LinkedFileReturnType[]> => selectLinkedFilesForInvoice(invoiceId, usageType, tx, limit);

  export const linkFileToParent = (
    parentId: string,
    fileId: string,
    usageType: string,
    tx?: DBTransaction,
    createdAt: Date = new Date()
  ): Promise<{ id: string; fileId: string; parentId: string; usageType: string; createdAt: Date }> =>
    insertParentFileLink(parentId, fileId, usageType, tx, createdAt);

  export const linkFileToInvoice = async (
    invoiceId: string,
    fileId: string,
    usageType: string,
    tx?: DBTransaction,
    createdAt: Date = new Date()
  ): Promise<{ id: string; fileId: string; invoiceId: string; usageType: string; createdAt: Date }> => {
    await assertFilePathNotPublic(fileId, tx);
    return insertInvoiceFileLink(invoiceId, fileId, usageType, tx, createdAt);
  };

  /**
   * Validate upload parameters (path, size, contentType).
   * Returns an error message if validation fails, or null if valid.
   */
  export const validateUpload = (
    params: { path: string; size: number; contentType: string },
    locale?: string
  ): string | null => {
    const { path, size, contentType } = params;
    const tErrors = getServerTranslations(locale ?? "en").errorsTranslations.file;

    // Check for path traversal attempts
    if (path.includes("..") || path.startsWith("/")) {
      return tErrors.invalidFilePath;
    }

    // Check file size (max 100MB)
    const maxSize = MAX_FILE_SIZE_BYTES;
    if (size > maxSize) {
      return tErrors.fileSizeExceedsMaximum(maxSize / (1024 * 1024));
    }

    // Check content type is provided
    if (!contentType) {
      return tErrors.contentTypeRequired;
    }

    if (!isAllowedMimeType(contentType)) {
      return tErrors.invalidFileType;
    }

    return null;
  };

  /**
   * Right-to-be-forgotten scrub: delete the file-junction rows linking
   * storage files to the anonymized subject (user, parent, teacher, and
   * student identities). The `storage_file` rows themselves stay so shared
   * files referenced by other owners keep their path registry; physical
   * blob removal is handled by the storage cleanup workflow. Runs inside
   * the caller's transaction.
   */
  export const deleteOwnerFileJunctions = async (
    owner: {
      readonly userId: string;
      readonly parentId?: string | null;
      readonly teacherId?: string | null;
      readonly studentIds: readonly string[];
    },
    tx: DBTransaction
  ): Promise<void> => {
    await deleteOwnerFileJunctionRows(owner, tx);
  };
}
