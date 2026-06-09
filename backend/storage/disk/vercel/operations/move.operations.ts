import { copy, del, head } from "@vercel/blob";
import { StorageDbRepository } from "@/backend/db/repo";
import logger from "@/backend/lib/logger";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import { formatBulkOperationResult, validateBulkOperation } from "../../shared/bulk-operations.helper";
import { getBlobs, isDirectory } from "../shared";
import type { VercelContext } from "../types";
import { fileExists, fileInfoByPath } from "./file.operations";
import { directoryInfoByPath } from "./folder.operations";

export async function moveItems(
  ctx: VercelContext,
  input: Types.StorageItemsMoveInput
): Promise<Types.BulkOperationResult> {
  const { validSources, failures, destDirAllowed } = await validateBulkOperation(
    ctx,
    input.sourcePaths,
    input.destinationPath,
    fileExists
  );

  let successCount = 0;
  const successfulItems: Array<Types.FileInfo | Types.DirectoryInfo> = [];

  if (validSources.length === 0) {
    return formatBulkOperationResult(successCount, failures, successfulItems, "moved");
  }

  const { dbFileMap, dbDirectoryMap, dbSourceDirMap } = await loadMoveEntities(validSources);

  if (!destDirAllowed) {
    return {
      success: false,
      message: "Uploads not allowed to destination directory",
      successCount: 0,
      failureCount: validSources.length,
      failures: validSources.map(path => ({
        path,
        error: "Uploads not allowed to destination directory",
      })),
      successfulItems,
    };
  }

  for (const sourcePath of validSources) {
    try {
      const result = await moveItem(ctx, sourcePath, input.destinationPath, dbFileMap, dbDirectoryMap, dbSourceDirMap);
      successfulItems.push(result);
      successCount++;
    } catch (error) {
      failures.push({
        path: sourcePath,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return formatBulkOperationResult(successCount, failures, successfulItems, "moved");
}

async function loadMoveEntities(sources: string[]) {
  const sourceDirectories = [...new Set(sources.map(path => path.substring(0, path.lastIndexOf("/"))))];

  const [dbFiles, dbDirectories, dbSourceDirs] = await Promise.all([
    StorageDbRepository.filesByPaths(sources),
    StorageDbRepository.directoriesByPaths(sources),
    StorageDbRepository.directoriesByPaths(sourceDirectories),
  ]);

  const dbFileMap = new Map<string, Types.FileEntity>();
  for (const file of dbFiles) {
    dbFileMap.set(file.path, file);
  }

  const dbDirectoryMap = new Map<string, Types.DirectoryEntity>();
  for (const dir of dbDirectories) {
    dbDirectoryMap.set(dir.path, dir);
  }

  const dbSourceDirMap = new Map<string, Types.DirectoryEntity>();
  for (const dir of dbSourceDirs) {
    dbSourceDirMap.set(dir.path, dir);
  }

  return { dbFileMap, dbDirectoryMap, dbSourceDirMap };
}

async function moveItem(
  ctx: VercelContext,
  sourcePath: string,
  destinationPath: string,
  dbFileMap: Map<string, Types.FileEntity>,
  dbDirectoryMap: Map<string, Types.DirectoryEntity>,
  dbSourceDirMap: Map<string, Types.DirectoryEntity>
): Promise<Types.FileInfo | Types.DirectoryInfo> {
  const sourceDir = sourcePath.substring(0, sourcePath.lastIndexOf("/"));
  const dbSourceDir = dbSourceDirMap.get(sourceDir);
  if (dbSourceDir && !dbSourceDir.allowMove) {
    throw new Error(`Move not allowed from directory: ${sourceDir}`);
  }

  const fileName = StorageUtils.extractFileName(sourcePath);
  const newPath = `${destinationPath.replace(/\/$/, "")}/${fileName}`;

  const isDir = await isDirectory(ctx, sourcePath);

  if (isDir) {
    await moveDirectory(ctx, sourcePath, newPath);
  } else {
    await moveSingleFile(ctx, sourcePath, newPath);
  }

  const dbFile = dbFileMap.get(sourcePath);
  const dbDirectory = dbDirectoryMap.get(sourcePath);

  if (dbFile) {
    await StorageDbRepository.updateFile({
      id: dbFile.id,
      path: newPath,
      isProtected: dbFile.isProtected,
    });
    const fileInfo = await fileInfoByPath(ctx, newPath);
    if (!fileInfo) throw new Error("Failed to get file info after move");
    return fileInfo;
  }

  if (dbDirectory) {
    await StorageDbRepository.updateDirectory({
      ...dbDirectory,
      path: newPath,
    });
    const dirInfo = await directoryInfoByPath(ctx, newPath);
    if (!dirInfo) throw new Error("Failed to get directory info after move");
    return dirInfo;
  }

  const info = await fileInfoByPath(ctx, newPath);
  if (!info) throw new Error("Failed to get info after move");
  return info;
}

async function moveSingleFile(ctx: VercelContext, sourcePath: string, destPath: string): Promise<void> {
  const sourceBlob = await head(sourcePath, { token: ctx.token });

  const newBlob = await copy(sourceBlob.url, destPath, {
    token: ctx.token,
    access: "public",
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

  for (const blob of allBlobs) {
    const relativePath = blob.pathname.slice(prefix.length);
    const newFilePath = `${destPath}/${relativePath}`;

    try {
      await copy(blob.url, newFilePath, {
        token: ctx.token,
        access: "public",
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
  }

  logger.info("✅ moveDirectory: All files moved", {
    sourceDir: sourcePath,
    destDir: destPath,
    fileCount: allBlobs.length,
  });
}
