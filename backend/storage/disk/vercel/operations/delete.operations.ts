import { del, head } from "@vercel/blob";
import { StorageDbRepository } from "@/backend/db/repo";
import logger from "@/backend/lib/logger";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import { formatBulkOperationResult } from "../../shared/bulk-operations.helper";
import { loadDeleteEntities, validateDeletePermissions } from "../../shared/delete-operations.helper";
import { getBlobs, isDirectory } from "../shared";
import type { VercelContext } from "../types";
import { fileInfoByPath } from "./file.operations";
import { directoryInfoByPath } from "./folder.operations";

export async function deleteFile(ctx: VercelContext, filePath: string): Promise<Types.FileOperationResult> {
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

    let blobUrl: string;
    try {
      const blobInfo = await head(filePath, { token: ctx.token });
      blobUrl = blobInfo.url;
    } catch (error) {
      logger.warn(`File not found in Vercel Blob: ${filePath}`, error);

      try {
        await StorageDbRepository.deleteFile(filePath);
      } catch (dbError) {
        logger.warn(`Failed to delete file from database: ${filePath}`, dbError);
      }

      return { success: false, message: "File not found" };
    }

    logger.info("🗑️ deleteFile: Deleting from Vercel Blob", {
      filePath,
      url: blobUrl,
    });

    await del(blobUrl, { token: ctx.token });

    logger.info("🗑️ deleteFile: Deleted from Vercel Blob successfully");

    try {
      await StorageDbRepository.deleteFile(filePath);
      logger.info("🗑️ deleteFile: Deleted from database successfully");
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
  ctx: VercelContext,
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
      const result = await deleteItem(
        ctx,
        itemPath,
        input.force || false,
        dbFileMap,
        dbDirectoryMap,
        dbParentDirMap,
        usageCheckMap
      );
      successfulItems.push(result);
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

async function deleteItem(
  ctx: VercelContext,
  itemPath: string,
  force: boolean,
  dbFileMap: Map<string, Types.FileEntity>,
  dbDirectoryMap: Map<string, Types.DirectoryEntity>,
  dbParentDirMap: Map<string, Types.DirectoryEntity>,
  usageCheckMap: Map<string, { isInUse: boolean; deleteBlockReason: string | null | undefined }>
): Promise<Types.FileInfo | Types.DirectoryInfo> {
  const dbFile = dbFileMap.get(itemPath);
  const dbDirectory = dbDirectoryMap.get(itemPath);

  validateDeletePermissions(
    force,
    usageCheckMap.get(itemPath),
    dbFile,
    dbDirectory,
    dbParentDirMap.get(itemPath.substring(0, itemPath.lastIndexOf("/")))
  );

  const fileEntity = await fileInfoByPath(ctx, itemPath);
  const folderEntity = fileEntity ? null : await directoryInfoByPath(ctx, itemPath);

  const isDir = await isDirectory(ctx, itemPath);

  if (isDir) {
    await deleteDirectory(ctx, itemPath);
  } else {
    await deleteSingleFile(ctx, itemPath);
  }

  if (dbFile) {
    await StorageDbRepository.deleteFile(itemPath);
  } else if (dbDirectory) {
    await StorageDbRepository.deleteDirectory(dbDirectory.id.toString());
  }

  if (fileEntity) return fileEntity;
  if (folderEntity) return folderEntity;
  throw new Error("Item not found");
}

async function deleteSingleFile(ctx: VercelContext, filePath: string): Promise<void> {
  const blobInfo = await head(filePath, { token: ctx.token });
  await del(blobInfo.url, { token: ctx.token });
  logger.info("🗑️ deleteSingleFile: Deleted blob", { path: filePath });
}

async function deleteDirectory(ctx: VercelContext, dirPath: string): Promise<void> {
  const prefix = `${dirPath}/`;
  const allBlobs = await getBlobs(ctx, prefix);

  logger.info("🗑️ deleteDirectory: Found files to delete", {
    dir: dirPath,
    fileCount: allBlobs.length,
  });

  for (const blob of allBlobs) {
    try {
      await del(blob.url, { token: ctx.token });

      const dbFile = await StorageDbRepository.fileByPath(blob.pathname);
      if (dbFile) {
        await StorageDbRepository.deleteFile(blob.pathname);
      }

      logger.info("🗑️ deleteDirectory: Deleted file", { path: blob.pathname });
    } catch (error) {
      logger.error(`Failed to delete file in directory: ${blob.pathname}`, error);
      throw error;
    }
  }

  logger.info("✅ deleteDirectory: All files deleted", {
    dir: dirPath,
    fileCount: allBlobs.length,
  });
}
