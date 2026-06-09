import fs from "node:fs/promises";
import { StorageDbRepository } from "@/backend/db/repo";
import logger from "@/backend/lib/logger";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import type { LocalContext } from "../types";
import { getAbsolutePath } from "../utils";
import { fileInfoByPath } from "./file.operations";
import { directoryInfoByPath } from "./folder.operations";

export async function deleteFile(ctx: LocalContext, filePath: string): Promise<Types.FileOperationResult> {
  try {
    const validationError = await StorageUtils.validatePath(filePath);
    if (validationError) {
      return { success: false, message: validationError };
    }

    const usageCheck = await StorageDbRepository.checkFileUsage({
      path: filePath,
    });
    if (usageCheck.isInUse) {
      return {
        success: false,
        message: usageCheck.deleteBlockReason || "File is in use",
      };
    }

    const dbFile = await StorageDbRepository.fileByPath(filePath);
    if (dbFile?.isProtected === true) {
      return { success: false, message: "File is protected from deletion" };
    }

    const parentPath = filePath.substring(0, filePath.lastIndexOf("/"));
    const parentDir = await StorageDbRepository.directoryByPath(parentPath);
    if (parentDir && !parentDir.allowDeleteFiles) {
      return {
        success: false,
        message: "File deletion not allowed in this directory",
      };
    }

    const absolutePath = getAbsolutePath(ctx.basePath, filePath);
    await fs.unlink(absolutePath);

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

export async function deleteItems(
  ctx: LocalContext,
  input: Types.StorageItemsDeleteInput
): Promise<Types.BulkOperationResult> {
  let successCount = 0;
  const failures: Array<{ path: string; error: string }> = [];
  const successfulItems: Array<Types.FileInfo | Types.DirectoryInfo> = [];

  const parentDirectories = [...new Set(input.paths.map(path => path.substring(0, path.lastIndexOf("/"))))];

  const [dbFiles, dbDirectories, dbParentDirs, usageChecks] = await Promise.all([
    StorageDbRepository.filesByPaths(input.paths),
    StorageDbRepository.directoriesByPaths(input.paths),
    StorageDbRepository.directoriesByPaths(parentDirectories),
    input.force
      ? Promise.resolve([])
      : Promise.all(
          input.paths.map(filePath =>
            StorageDbRepository.checkFileUsage({ path: filePath })
              .then(result => ({ path: filePath, ...result }))
              .catch(() => ({
                path: filePath,
                isInUse: false,
                deleteBlockReason: null,
              }))
          )
        ),
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

  const usageCheckMap = new Map<string, { path: string; isInUse: boolean; deleteBlockReason: string | null }>();
  for (const check of usageChecks) {
    usageCheckMap.set(
      check.path,
      check as {
        path: string;
        isInUse: boolean;
        deleteBlockReason: string | null;
      }
    );
  }

  for (const itemPath of input.paths) {
    try {
      const result = await processDelete(
        ctx,
        itemPath,
        input.force || false,
        usageCheckMap.get(itemPath),
        dbFileMap.get(itemPath),
        dbDirectoryMap.get(itemPath),
        dbParentDirMap.get(itemPath.substring(0, itemPath.lastIndexOf("/")))
      );
      if (result) {
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

  return {
    success: failures.length === 0,
    message:
      failures.length === 0
        ? "All items deleted successfully"
        : `${successCount} items deleted, ${failures.length} failed`,
    successCount,
    failureCount: failures.length,
    failures,
    successfulItems,
  };
}

function validateDeletePermissions(
  force: boolean,
  usageCheck: { isInUse: boolean; deleteBlockReason: string | null } | undefined,
  dbFile: Types.FileEntity | undefined,
  dbDirectory: Types.DirectoryEntity | undefined,
  parentDir: Types.DirectoryEntity | undefined
) {
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
      throw new Error("Deletion not allowed in parent directory");
    }
  }
}

async function processDelete(
  ctx: LocalContext,
  itemPath: string,
  force: boolean,
  usageCheck: { isInUse: boolean; deleteBlockReason: string | null } | undefined,
  dbFile: Types.FileEntity | undefined,
  dbDirectory: Types.DirectoryEntity | undefined,
  parentDir: Types.DirectoryEntity | undefined
): Promise<Types.FileInfo | Types.DirectoryInfo | null> {
  validateDeletePermissions(force, usageCheck, dbFile, dbDirectory, parentDir);

  const fileEntity = await fileInfoByPath(ctx, itemPath);
  const folderEntity = fileEntity ? null : await directoryInfoByPath(ctx, itemPath);

  const absolutePath = getAbsolutePath(ctx.basePath, itemPath);
  const stats = await fs.stat(absolutePath);

  if (stats.isDirectory()) {
    await fs.rm(absolutePath, { recursive: true, force: true });
  } else {
    await fs.unlink(absolutePath);
  }

  if (dbFile) {
    await StorageDbRepository.deleteFile(itemPath);
    if (fileEntity) return fileEntity;
  } else if (dbDirectory) {
    await StorageDbRepository.deleteDirectory(itemPath);
    if (folderEntity) return folderEntity;
  } else if (fileEntity) {
    return fileEntity;
  } else if (folderEntity) {
    return folderEntity;
  }

  return null;
}
