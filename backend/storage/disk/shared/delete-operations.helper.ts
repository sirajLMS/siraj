import { StorageDbRepository } from "@/backend/db/repo";
import logger from "@/backend/lib/logger";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import { formatBulkOperationResult } from "./bulk-operations.helper";

/**
 * Options for validating delete permissions
 */
export interface DeletePermissionOptions {
  force: boolean;
  usageCheck?: { isInUse: boolean; deleteBlockReason: string | null | undefined };
  dbFile?: Types.FileEntity;
  dbDirectory?: Types.DirectoryEntity;
  parentDir?: Types.DirectoryEntity;
}

/**
 * Validates if an item can be deleted based on usage and protection status
 */
export function validateDeletePermissions(options: DeletePermissionOptions): void {
  const { force, usageCheck, dbFile, dbDirectory, parentDir } = options;

  if (!force && usageCheck?.isInUse) {
    throw new Error(usageCheck.deleteBlockReason || "File is currently in use");
  }

  if (dbFile?.isProtected === true || dbDirectory?.isProtected === true) {
    throw new Error("Item is protected from deletion");
  }

  if (parentDir) {
    const isFile = dbFile != null;
    const canDelete = isFile ? parentDir.allowDeleteFiles : parentDir.allowDelete;
    if (!canDelete) {
      throw new Error(`Deletion not allowed in parent directory: ${parentDir.path}`);
    }
  }
}

/**
 * Common validation and entity loading for single file deletion
 */
export async function prepareDeleteFile(filePath: string): Promise<{
  error?: string;
  dbFile?: Types.FileEntity | null;
  parentDir?: Types.DirectoryEntity | null;
}> {
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
    validateDeletePermissions({
      force: false,
      usageCheck: {
        isInUse: usageCheck.isInUse,
        deleteBlockReason: usageCheck.deleteBlockReason ?? null,
      },
      dbFile: dbFile || undefined,
      parentDir: parentDir || undefined,
    });
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
  onDelete: () => Promise<void>
): Promise<Types.FileOperationResult> {
  try {
    const { error } = await prepareDeleteFile(filePath);
    if (error) {
      return { success: false, message: error };
    }

    await onDelete();

    try {
      await StorageDbRepository.deleteFile(filePath);
    } catch (error) {
      logger.warn(`Failed to delete file from database: ${filePath}`, error);
    }

    return { success: true, message: "File deleted successfully" };
  } catch (error) {
    logger.error(`Failed to delete file: ${filePath}`, error);
    return {
      success: false,
      message: `Failed to delete file: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Loads all necessary database entities for bulk delete operations
 */
export async function loadDeleteEntities(paths: string[], force: boolean) {
  const parentDirectories = [...new Set(paths.map(path => path.substring(0, path.lastIndexOf("/"))))];

  const [dbFiles, dbDirectories, dbParentDirs, usageChecks] = await Promise.all([
    StorageDbRepository.filesByPaths(paths),
    StorageDbRepository.directoriesByPaths(paths),
    StorageDbRepository.directoriesByPaths(parentDirectories),
    force ? Promise.resolve([]) : checkFileUsages(paths),
  ]);

  const dbFileMap = new Map<string, Types.FileEntity>();
  for (const file of dbFiles) {
    dbFileMap.set(file.path, file);
  }

  const dbDirectoryMap = new Map<string, Types.DirectoryEntity>();
  for (const dir of dbDirectories) {
    dbDirectoryMap.set(dir.path, dir);
  }

  const dbParentDirMap = new Map<string, Types.DirectoryEntity>();
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
  dbFile?: Types.FileEntity;
  dbDirectory?: Types.DirectoryEntity;
  parentDir?: Types.DirectoryEntity;
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
  deleteFn: (ctx: TContext, params: DeleteFnParams) => Promise<TResult>
): Promise<Types.BulkOperationResult> {
  const { dbFileMap, dbDirectoryMap, dbParentDirMap, usageCheckMap } = await loadDeleteEntities(
    input.paths,
    input.force || false
  );

  let successCount = 0;
  const failures: Array<{ path: string; error: string }> = [];
  const successfulItems: Array<Types.FileInfo | Types.DirectoryInfo> = [];

  for (const itemPath of input.paths) {
    try {
      const parentPath = itemPath.substring(0, itemPath.lastIndexOf("/"));
      const result = await deleteFn(ctx, {
        itemPath,
        force: input.force || false,
        dbFile: dbFileMap.get(itemPath),
        dbDirectory: dbDirectoryMap.get(itemPath),
        parentDir: dbParentDirMap.get(parentPath),
        usageCheck: usageCheckMap.get(itemPath),
      });

      if (result != null) {
        successfulItems.push(result);
      }
      successCount++;
    } catch (error) {
      failures.push({
        path: itemPath,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return formatBulkOperationResult(successCount, failures, successfulItems, "deleted");
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
