import { copy, del, head } from "@vercel/blob";
import { StorageDbRepository } from "@/backend/db/repo";
import logger from "@/backend/lib/logger";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import { getBlobs, isDirectory } from "../shared";
import type { VercelContext } from "../types";
import { fileInfoByPath } from "./file.operations";
import { directoryInfoByPath } from "./folder.operations";

export async function moveItems(
  ctx: VercelContext,
  input: Types.StorageItemsMoveInput
): Promise<Types.BulkOperationResult> {
  let successCount = 0;
  const failures: Array<{ path: string; error: string }> = [];
  const successfulItems: Array<Types.FileInfo | Types.DirectoryInfo> = [];

  const validSources = await validateSourcesExist(ctx, input.sourcePaths, failures);

  if (validSources.length === 0) {
    return {
      success: failures.length === 0,
      message: failures.length === 0 ? "No valid source files to move" : "Failed to find source files",
      successCount,
      failureCount: failures.length,
      failures,
      successfulItems,
    };
  }

  const { dbFileMap, dbDirectoryMap, dbSourceDirMap, dbDestDir } = await loadMoveEntities(
    validSources,
    input.destinationPath
  );

  if (dbDestDir && !dbDestDir.allowUploads) {
    return createBulkError(validSources, "Uploads not allowed to destination directory");
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

  return {
    success: failures.length === 0,
    message:
      failures.length === 0 ? "All items moved successfully" : `${successCount} items moved, ${failures.length} failed`,
    successCount,
    failureCount: failures.length,
    failures,
    successfulItems,
  };
}

async function validateSourcesExist(
  ctx: VercelContext,
  paths: string[],
  failures: Array<{ path: string; error: string }>
): Promise<string[]> {
  const checks = await Promise.all(
    paths.map(async path => {
      try {
        await head(path, { token: ctx.token });
        return { path, exists: true };
      } catch {
        return { path, exists: false };
      }
    })
  );

  return checks
    .filter(check => {
      if (!check.exists) {
        failures.push({ path: check.path, error: "Source path not found" });
        return false;
      }
      return true;
    })
    .map(check => check.path);
}

async function loadMoveEntities(sources: string[], destinationPath: string) {
  const sourceDirectories = [...new Set(sources.map(path => path.substring(0, path.lastIndexOf("/"))))];

  const [dbFiles, dbDirectories, dbSourceDirs, dbDestDir] = await Promise.all([
    StorageDbRepository.filesByPaths(sources),
    StorageDbRepository.directoriesByPaths(sources),
    StorageDbRepository.directoriesByPaths(sourceDirectories),
    StorageDbRepository.directoryByPath(destinationPath),
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

  return { dbFileMap, dbDirectoryMap, dbSourceDirMap, dbDestDir };
}

function createBulkError(sources: string[], message: string): Types.BulkOperationResult {
  return {
    success: false,
    message,
    successCount: 0,
    failureCount: sources.length,
    failures: sources.map(path => ({ path, error: message })),
    successfulItems: [],
  };
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
