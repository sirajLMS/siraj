import { copy, del, head } from "@vercel/blob";
import { StorageDbRepository } from "@/backend/db/repo/storage";
import { logger } from "@/backend/lib/logger";
import { executeBulkOperation } from "@/backend/storage/disk/shared/bulk-operations.helper";
import {
  loadMoveEntities,
  type MoveEntities,
  updateDbAfterMove,
  validateAndCalculateNewPath,
} from "@/backend/storage/disk/shared/move-operations.helper";
import { fileExists, fileInfoByPath } from "@/backend/storage/disk/vercel/operations/file.operations";
import { directoryInfoByPath } from "@/backend/storage/disk/vercel/operations/folder.operations";
import { getBlobs, isDirectory } from "@/backend/storage/disk/vercel/shared";
import type { VercelContext } from "@/backend/storage/disk/vercel/types";
import type * as Types from "@/backend/types";
import { type FileErrors, getServerTranslations } from "@/shared/locale";

export async function moveItems(
  ctx: VercelContext,
  input: Types.StorageItemsMoveInput,
  locale?: string
): Promise<Types.BulkOperationResult> {
  const tFile = getServerTranslations(locale ?? "en").errorsTranslations.file;
  return executeBulkOperation({
    ctx,
    sourcePaths: input.sourcePaths,
    destinationPath: input.destinationPath,
    existsFn: fileExists,
    operationName: "moved",
    locale,
    beforeProcess: async (_, validSources) => {
      return await loadMoveEntities(validSources);
    },
    processFn: async (opCtx, sourcePath, entities: MoveEntities | undefined) => {
      if (!entities) throw new Error("Move entities not loaded");
      return await moveItem(opCtx, sourcePath, input.destinationPath, entities, tFile);
    },
  });
}

async function moveItem(
  ctx: VercelContext,
  sourcePath: string,
  destinationPath: string,
  { dbFileMap, dbDirectoryMap, dbSourceDirMap }: MoveEntities,
  tFile: FileErrors
): Promise<Types.FileInfo | Types.DirectoryInfo> {
  const newPath = validateAndCalculateNewPath(sourcePath, destinationPath, dbSourceDirMap, tFile);

  const isDir = await isDirectory(ctx, sourcePath);

  if (isDir) {
    await moveDirectory(ctx, sourcePath, newPath);
  } else {
    await moveSingleFile(ctx, sourcePath, newPath);
  }

  const dbFile = dbFileMap.get(sourcePath);
  const dbDirectory = dbDirectoryMap.get(sourcePath);

  await updateDbAfterMove(dbFile, dbDirectory, newPath);

  if (dbDirectory) {
    const dirInfo = await directoryInfoByPath(ctx, newPath);
    if (!dirInfo) throw new Error(tFile.failedToRetrieveMovedItemInfo);
    return dirInfo;
  }

  const info = await fileInfoByPath(ctx, newPath);
  if (!info) throw new Error(tFile.failedToRetrieveMovedItemInfo);
  return info;
}

async function moveSingleFile(ctx: VercelContext, sourcePath: string, destPath: string): Promise<void> {
  const sourceBlob = await head(sourcePath, { token: ctx.token });

  const newBlob = await copy(sourceBlob.url, destPath, {
    token: ctx.token,
    access: ctx.access,
  });

  logger.info("📋 moveSingleFile: Copied blob", {
    from: sourcePath,
    to: destPath,
    url: newBlob.url,
  });

  await del(sourceBlob.url, { token: ctx.token });

  logger.info("🗑️ moveSingleFile: Deleted original blob", { path: sourcePath });
}

async function moveDirectory(ctx: VercelContext, sourcePath: string, destPath: string): Promise<void> {
  const prefix = `${sourcePath}/`;
  const allBlobs = await getBlobs(ctx, prefix);

  logger.info("📋 moveDirectory: Found files to move", {
    sourceDir: sourcePath,
    fileCount: allBlobs.length,
  });

  await Promise.all(
    allBlobs.map(async blob => {
      const relativePath = blob.pathname.slice(prefix.length);
      const newFilePath = `${destPath}/${relativePath}`;

      try {
        await copy(blob.url, newFilePath, {
          token: ctx.token,
          access: ctx.access,
        });

        await del(blob.url, { token: ctx.token });

        const dbFile = await StorageDbRepository.fileByPath(blob.pathname);
        if (dbFile) {
          await StorageDbRepository.updateFile({
            id: dbFile.id,
            path: newFilePath,
            isProtected: dbFile.isProtected,
          });
        }
      } catch (error) {
        logger.error(`Failed to move file in directory: ${blob.pathname}`, error);
        throw error;
      }
    })
  );

  logger.info("✅ moveDirectory: All files moved", {
    sourceDir: sourcePath,
    destDir: destPath,
    fileCount: allBlobs.length,
  });
}
