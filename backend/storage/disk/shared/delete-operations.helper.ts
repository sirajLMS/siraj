import { StorageDbRepository } from "@/backend/db/repo/storage";
import { logger } from "@/backend/lib/logger";
import { formatBulkOperationResult } from "@/backend/storage/disk/shared/bulk-operations.helper";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import { type FileErrors, getServerTranslations } from "@/shared/locale";

/**
 * Options for validating delete permissions
 */
export interface DeletePermissionOptions {
  force: boolean;
  usageCheck?: { isInUse: boolean; deleteBlockReason: string | null | undefined };
  dbFile?: Types.FileSelectType;
  dbDirectory?: Types.DirectorySelectType;
  parentDir?: Types.DirectorySelectType;
}

/**
 * Validates if an item can be deleted based on usage and protection status
 */
export function validateDeletePermissions(options: DeletePermissionOptions, tFile: FileErrors): void {
  const { force, usageCheck, dbFile, dbDirectory, parentDir } = options;

  if (!force && usageCheck?.isInUse) {
    throw new Error(usageCheck.deleteBlockReason ?? tFile.fileCurrentlyInUse);
  }

  if (dbFile?.isProtected === true || dbDirectory?.isProtected === true) {
    throw new Error(tFile.itemProtectedFromDeletion);
  }

  if (parentDir) {
    const isFile = dbFile != null;
    const canDelete = isFile ? parentDir.allowDeleteFiles : parentDir.allowDelete;
    if (!canDelete) {
      throw new Error(tFile.deletionNotAllowedInParentDirectoryWithPath(parentDir.path));
    }
  }
}

/**
 * Common validation and entity loading for single file deletion
 */
async function prepareDeleteFile(
  filePath: string,
  locale?: string
): Promise<{
  error?: string;
  dbFile?: Types.FileSelectType | null;
  parentDir?: Types.DirectorySelectType | null;
}> {
  const tFile = getServerTranslations(locale ?? "en").errorsTranslations.file;
  const validationError = StorageUtils.validatePath(filePath);
  if (validationError) {
    return { error: validationError };
  }

  const usageCheck = await StorageDbRepository.checkFileUsage({
    path: filePath,
  });

  const dbFile = await StorageDbRepository.fileByPath(filePath);
  const parentPath = filePath.substring(0, filePath.lastIndexOf("/"));
  const parentDir = await StorageDbRepository.directoryByPath(parentPath);

  try {
    validateDeletePermissions(
      {
        force: false,
        usageCheck: {
          isInUse: usageCheck.isInUse,
          deleteBlockReason: usageCheck.deleteBlockReason ?? null,
        },
        dbFile: dbFile ?? undefined,
        parentDir: parentDir ?? undefined,
      },
      tFile
    );
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
    };
  }

  return { dbFile, parentDir };
}

/**
 * Shared implementation for single file delete operation
 */
export async function executeDeleteFile(
  filePath: string,
  onDelete: () => Promise<void>,
  locale?: string
): Promise<Types.FileOperationResult> {
  const tFile = getServerTranslations(locale ?? "en").errorsTranslations.file;
  try {
    const { error } = await prepareDeleteFile(filePath, locale);
    if (error) {
      return { success: false, message: error };
    }

    await onDelete();

    try {
      await StorageDbRepository.deleteFile(filePath);
    } catch (caughtError) {
      logger.warn(`Failed to delete file from database: ${filePath}`, caughtError);
    }

    return { success: true, message: tFile.fileDeletedSuccessfully };
  } catch (error) {
    logger.error(`Failed to delete file: ${filePath}`, error);
    return {
      success: false,
      message: tFile.failedToDeleteFile(error instanceof Error ? error.message : String(error)),
    };
  }
}

/**
 * Loads all necessary database entities for bulk delete operations
 */
async function loadDeleteEntities(paths: string[], force: boolean) {
  const parentDirectories = [...new Set(paths.map(path => path.substring(0, path.lastIndexOf("/"))))];

  const [dbFiles, dbDirectories, dbParentDirs, usageChecks] = await Promise.all([
    StorageDbRepository.filesByPaths(paths),
    StorageDbRepository.directoriesByPaths(paths),
    StorageDbRepository.directoriesByPaths(parentDirectories),
    force ? Promise.resolve([]) : checkFileUsages(paths),
  ]);

  const dbFileMap = new Map<string, Types.FileSelectType>();
  for (const file of dbFiles) {
    dbFileMap.set(file.path, file);
  }

  const dbDirectoryMap = new Map<string, Types.DirectorySelectType>();
  for (const dir of dbDirectories) {
    dbDirectoryMap.set(dir.path, dir);
  }

  const dbParentDirMap = new Map<string, Types.DirectorySelectType>();
  for (const dir of dbParentDirs) {
    dbParentDirMap.set(dir.path, dir);
  }

  const usageCheckMap = new Map<string, { isInUse: boolean; deleteBlockReason: string | null | undefined }>();
  for (const check of usageChecks) {
    usageCheckMap.set(check.path, check);
  }

  return { dbFileMap, dbDirectoryMap, dbParentDirMap, usageCheckMap };
}

/**
 * Parameters for the bulk delete function callback
 */
export interface DeleteFnParams {
  itemPath: string;
  force: boolean;
  dbFile?: Types.FileSelectType;
  dbDirectory?: Types.DirectorySelectType;
  parentDir?: Types.DirectorySelectType;
  usageCheck?: { isInUse: boolean; deleteBlockReason: string | null | undefined };
}

/**
 * Shared implementation for bulk delete operations
 */
export async function executeBulkDelete<
  TContext,
  TResult extends Types.FileInfo | Types.DirectoryInfo | null | undefined,
>(
  ctx: TContext,
  input: Types.StorageItemsDeleteInput,
  deleteFn: (ctx: TContext, params: DeleteFnParams) => Promise<TResult>,
  locale?: string
): Promise<Types.BulkOperationResult> {
  const { dbFileMap, dbDirectoryMap, dbParentDirMap, usageCheckMap } = await loadDeleteEntities(
    input.paths,
    input.force ?? false
  );

  const failures: Array<{ path: string; error: string }> = [];

  const results = await Promise.allSettled(
    input.paths.map(itemPath => {
      const parentPath = itemPath.substring(0, itemPath.lastIndexOf("/"));
      return deleteFn(ctx, {
        itemPath,
        force: input.force ?? false,
        dbFile: dbFileMap.get(itemPath),
        dbDirectory: dbDirectoryMap.get(itemPath),
        parentDir: dbParentDirMap.get(parentPath),
        usageCheck: usageCheckMap.get(itemPath),
      });
    })
  );

  const successfulItems: Array<Types.FileInfo | Types.DirectoryInfo> = [];
  let successCount = 0;

  for (let i = 0; i < input.paths.length; i++) {
    const outcome = results[i];
    if (outcome.status === "fulfilled") {
      if (outcome.value != null) {
        successfulItems.push(outcome.value);
      }
      successCount++;
    } else {
      failures.push({
        path: input.paths[i],
        error: outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason),
      });
    }
  }

  return formatBulkOperationResult(successCount, failures, successfulItems, "deleted", locale);
}

async function checkFileUsages(paths: string[]) {
  return Promise.all(
    paths.map(filePath =>
      StorageDbRepository.checkFileUsage({ path: filePath })
        .then(result => ({
          path: filePath,
          isInUse: result.isInUse,
          deleteBlockReason: result.deleteBlockReason ?? null,
        }))
        .catch(() => ({
          path: filePath,
          isInUse: false,
          deleteBlockReason: null,
        }))
    )
  );
}
