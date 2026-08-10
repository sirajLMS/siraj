import { del, head } from "@vercel/blob";
import { StorageDbRepository } from "@/backend/db/repo";
import { logger } from "@/backend/lib/logger";
import {
  type DeleteFnParams,
  executeBulkDelete,
  executeDeleteFile,
  validateDeletePermissions,
} from "@/backend/storage/disk/shared/delete-operations.helper";
import { fileInfoByPath } from "@/backend/storage/disk/vercel/operations/file.operations";
import { directoryInfoByPath } from "@/backend/storage/disk/vercel/operations/folder.operations";
import { getBlobs, isDirectory } from "@/backend/storage/disk/vercel/shared";
import type { VercelContext } from "@/backend/storage/disk/vercel/types";
import type * as Types from "@/backend/types";

export async function deleteFile(ctx: VercelContext, filePath: string): Promise<Types.FileOperationResult> {
  return executeDeleteFile(filePath, async () => {
    let blobUrl: string;
    try {
      const blobInfo = await head(filePath, { token: ctx.token });
      blobUrl = blobInfo.url;
    } catch (error) {
      logger.warn(`File not found in Vercel Blob: ${filePath}`, error);
      throw new Error("File not found", { cause: error });
    }

    logger.info("🗑️ deleteFile: Deleting from Vercel Blob", {
      filePath,
      url: blobUrl,
    });

    await del(blobUrl, { token: ctx.token });

    logger.info("🗑️ deleteFile: Deleted from Vercel Blob successfully");
  });
}

export async function deleteItems(
  ctx: VercelContext,
  input: Types.StorageItemsDeleteInput
): Promise<Types.BulkOperationResult> {
  return executeBulkDelete(ctx, input, deleteItem);
}

async function deleteItem(ctx: VercelContext, params: DeleteFnParams): Promise<Types.FileInfo | Types.DirectoryInfo> {
  const { itemPath, force, dbFile, dbDirectory, parentDir, usageCheck } = params;

  validateDeletePermissions({ force, usageCheck, dbFile, dbDirectory, parentDir });

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
    await StorageDbRepository.deleteDirectory(dbDirectory.id);
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

  await Promise.all(
    allBlobs.map(async blob => {
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
    })
  );

  logger.info("✅ deleteDirectory: All files deleted", {
    dir: dirPath,
    fileCount: allBlobs.length,
  });
}
