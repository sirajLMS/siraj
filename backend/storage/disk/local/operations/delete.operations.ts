import fs from "node:fs/promises";
import { StorageDbRepository } from "@/backend/db/repo";
import logger from "@/backend/lib/logger";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import { formatBulkOperationResult } from "../../shared/bulk-operations.helper";
import { loadDeleteEntities, validateDeletePermissions } from "../../shared/delete-operations.helper";
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

    const dbFile = await StorageDbRepository.fileByPath(filePath);
    const parentPath = filePath.substring(0, filePath.lastIndexOf("/"));
    const parentDir = await StorageDbRepository.directoryByPath(parentPath);

    try {
      validateDeletePermissions(
        false,
        {
          isInUse: usageCheck.isInUse,
          deleteBlockReason: usageCheck.deleteBlockReason ?? null,
        },
        dbFile || undefined,
        undefined,
        parentDir || undefined
      );
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
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
  const { dbFileMap, dbDirectoryMap, dbParentDirMap, usageCheckMap } = await loadDeleteEntities(
    input.paths,
    input.force || false
  );

  let successCount = 0;
  const failures: Array<{ path: string; error: string }> = [];
  const successfulItems: Array<Types.FileInfo | Types.DirectoryInfo> = [];

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

  return formatBulkOperationResult(successCount, failures, successfulItems, "deleted");
}

async function processDelete(
  ctx: LocalContext,
  itemPath: string,
  force: boolean,
  usageCheck: { isInUse: boolean; deleteBlockReason: string | null | undefined } | undefined,
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
