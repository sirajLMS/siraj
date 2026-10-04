import { StorageDbRepository } from "@/backend/db/repo";
import { logger } from "@/backend/lib";
import { isValidReferenceTable } from "@/backend/services/storage/storage.helpers";
import type {
  DirectoryPermissionsUpdateInput,
  FileOperationResult,
  FileUsageCheckInput,
  FileUsageResult,
  StorageItemProtectionUpdateInput,
} from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

/**
 * Links an uploaded file path to an entity junction table and owns the
 * success/message derivation (business logic) — the repo does pure DB ops.
 */
export async function linkFileToEntityResult(
  input: {
    referenceTable: string;
    referenceId: string;
    usageType: string;
    filePath: string;
  },
  locale?: string
): Promise<FileOperationResult> {
  if (!isValidReferenceTable(input.referenceTable)) {
    throw new Error(`Invalid reference table: ${input.referenceTable}`);
  }
  const { file } = getServerTranslations(locale ?? "en").errorsTranslations;
  try {
    const createdFile = await StorageDbRepository.createFile(input.filePath);
    await StorageDbRepository.performJunctionInsert(
      {
        table: input.referenceTable,
        fileId: createdFile.id,
        refId: input.referenceId,
        type: input.usageType,
        createdAt: new Date(),
      },
      locale
    );
    return { success: true, message: file.fileUsageRegistered };
  } catch (error) {
    logger.error("Failed to register file usage", { error: error instanceof Error ? error.message : String(error) });
    return { success: false, message: file.fileUsageRegisterFailedGeneric };
  }
}

/**
 * Checks file usage and derives whether the file can be deleted. Owns the
 * `canDelete`/`deleteBlockReason` business logic — the repo only queries raw
 * usage data.
 */
export async function resolveFileUsageResult(input: FileUsageCheckInput, locale?: string): Promise<FileUsageResult> {
  const { file } = getServerTranslations(locale ?? "en").errorsTranslations;
  try {
    const usages = await StorageDbRepository.getFileUsages(input.path);
    const isInUse = usages.length > 0;
    return {
      isInUse,
      usages,
      canDelete: !isInUse,
      deleteBlockReason: isInUse ? file.fileCurrentlyInUse : undefined,
    };
  } catch (err) {
    logger.error("Error checking file usage:", err);
    return {
      isInUse: false,
      usages: [],
      canDelete: false,
      deleteBlockReason: file.unableToCheckFileUsage,
    };
  }
}

/**
 * Update directory permissions. Owns the success/message derivation (business
 * logic) — the repo does pure DB ops.
 */
export async function updateDirectoryPermissionsResult(
  input: DirectoryPermissionsUpdateInput,
  locale?: string
): Promise<FileOperationResult> {
  const { file } = getServerTranslations(locale ?? "en").errorsTranslations;
  logger.info("Updating directory permissions", { path: input.path });
  try {
    const directory = await StorageDbRepository.directoryByPath(input.path);
    if (!directory) return { success: false, message: file.directoryNotFound };

    const updated = await StorageDbRepository.updateDirectory({
      ...directory,
      allowUploads: input.permissions.allowUploads,
      allowDelete: input.permissions.allowDelete,
      allowMove: input.permissions.allowMove,
      allowCreateSubDirs: input.permissions.allowCreateSubDirs,
      allowDeleteFiles: input.permissions.allowDeleteFiles,
      allowMoveFiles: input.permissions.allowMoveFiles,
    });

    return {
      success: !!updated,
      message: updated ? file.directoryPermissionsUpdated : file.directoryPermissionsUpdateFailed,
    };
  } catch (error) {
    logger.error("Failed to update directory permissions", {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      message: file.directoryPermissionsUpdateFailed,
    };
  }
}

/**
 * Set protection status on a storage item (file or directory). Owns the
 * success/message derivation (business logic) — the repo does pure DB ops.
 */
export async function setStorageItemProtectionResult(
  input: StorageItemProtectionUpdateInput,
  locale?: string
): Promise<FileOperationResult> {
  const { file } = getServerTranslations(locale ?? "en").errorsTranslations;
  logger.info("Setting storage item protection", { path: input.path, isProtected: input.isProtected });
  try {
    const fileEntity = await StorageDbRepository.fileByPath(input.path);
    if (fileEntity) {
      const updated = await StorageDbRepository.updateFile({ ...fileEntity, isProtected: input.isProtected });
      return {
        success: !!updated,
        message: updated ? file.fileProtectionUpdated : file.fileProtectionUpdateFailed,
      };
    }

    const directory = await StorageDbRepository.directoryByPath(input.path);
    if (directory) {
      const updated = await StorageDbRepository.updateDirectory({
        ...directory,
        isProtected: input.isProtected,
        protectChildren: input.protectChildren ?? false,
      });
      return {
        success: !!updated,
        message: updated ? file.directoryProtectionUpdated : file.directoryProtectionUpdateFailed,
      };
    }

    return { success: false, message: file.fileOrDirectoryNotFound };
  } catch (error) {
    logger.error("Failed to update storage item protection", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, message: file.directoryProtectionUpdateFailed };
  }
}
