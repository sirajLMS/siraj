import fs from "node:fs/promises";
import path from "node:path";
import { StorageDbRepository } from "@/backend/db/repo";
import logger from "@/backend/lib/logger";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import { formatBulkOperationResult, validateBulkOperation } from "../../shared/bulk-operations.helper";
import type { LocalContext } from "../types";
import { ensureDirectory, getAbsolutePath } from "../utils";
import { fileExists, fileInfoByPath } from "./file.operations";
import { directoryInfoByPath } from "./folder.operations";

export async function moveItems(
  ctx: LocalContext,
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
    return formatBulkOperationResult(successCount, failures, successfulItems, "processed");
  }

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

  const sourceDirectories = [...new Set(validSources.map(path => path.substring(0, path.lastIndexOf("/"))))];

  logger.info("💾 moveItems: About to batch load DB entities", {
    validSourcesCount: validSources.length,
    sourceDirectoriesCount: sourceDirectories.length,
  });

  const [dbFiles, dbDirectories, dbSourceDirs] = await Promise.all([
    StorageDbRepository.filesByPaths(validSources),
    StorageDbRepository.directoriesByPaths(validSources),
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

  for (const sourcePath of validSources) {
    try {
      const sourceDir = sourcePath.substring(0, sourcePath.lastIndexOf("/"));
      const dbSourceDir = dbSourceDirMap.get(sourceDir);
      const dbFile = dbFileMap.get(sourcePath);
      const dbDirectory = dbDirectoryMap.get(sourcePath);

      const result = await moveItem(ctx, sourcePath, input.destinationPath, dbSourceDir, dbFile, dbDirectory);

      if (result) {
        successfulItems.push(result);
      }
      successCount++;
    } catch (error) {
      failures.push({
        path: sourcePath,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return formatBulkOperationResult(successCount, failures, successfulItems, "processed");
}

async function moveItem(
  ctx: LocalContext,
  sourcePath: string,
  destinationPath: string,
  dbSourceDir: Types.DirectoryEntity | undefined,
  dbFile: Types.FileEntity | undefined,
  dbDirectory: Types.DirectoryEntity | undefined
): Promise<Types.FileInfo | Types.DirectoryInfo | null> {
  const sourceDir = sourcePath.substring(0, sourcePath.lastIndexOf("/"));
  if (dbSourceDir && !dbSourceDir.allowMove) {
    throw new Error(`Move not allowed from directory: ${sourceDir}`);
  }

  const fileName = StorageUtils.extractFileName(sourcePath);
  const newPath = `${destinationPath.replace(/\/$/, "")}/${fileName}`;

  const sourceAbsolutePath = getAbsolutePath(ctx.basePath, sourcePath);
  const destAbsolutePath = getAbsolutePath(ctx.basePath, newPath);

  await ensureDirectory(path.dirname(destAbsolutePath));
  await fs.rename(sourceAbsolutePath, destAbsolutePath);

  if (dbFile) {
    await StorageDbRepository.updateFile({
      id: dbFile.id,
      path: newPath,
      isProtected: dbFile.isProtected,
    });
    return await fileInfoByPath(ctx, newPath);
  }

  if (dbDirectory) {
    await StorageDbRepository.updateDirectory({
      ...dbDirectory,
      path: newPath,
    });
    return await directoryInfoByPath(ctx, newPath);
  }

  return await fileInfoByPath(ctx, newPath);
}
