import type { Dirent } from "node:fs";
import fs from "node:fs/promises";
import { StorageDbRepository } from "@/backend/db/repo";
import { logger } from "@/backend/lib/logger";
import { processDirectory, processFile } from "@/backend/storage/disk/local/shared";
import type { LocalContext } from "@/backend/storage/disk/local/types";
import { cleanLocalPath, getAbsolutePath } from "@/backend/storage/disk/local/utils";
import { loadListEntities, paginateStorageItems } from "@/backend/storage/disk/shared/list-operations.helper";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";

/**
 * List files and directories in a local path
 */
export async function listFiles(
  ctx: LocalContext,
  input: Types.FilesListSearchInput
): Promise<Types.StorageObjectList> {
  try {
    const searchPath = cleanLocalPath(input.path || "");
    const absolutePath = getAbsolutePath(ctx.basePath, searchPath);

    let entries: Dirent[];
    try {
      entries = await fs.readdir(absolutePath, { withFileTypes: true });
    } catch {
      return {
        items: [],
        totalCount: 0,
        hasMore: false,
        offset: input.offset || 0,
        limit: input.limit || 50,
      };
    }

    const { filePaths, dirPaths } = classifyEntries(entries, searchPath);
    const items = await processListFilesEntries(ctx, filePaths, dirPaths);

    return paginateStorageItems(items, input);
  } catch (error) {
    logger.error(`Failed to list files: ${input.path}`, error);
    return {
      items: [],
      totalCount: 0,
      hasMore: false,
      offset: input.offset || 0,
      limit: input.limit || 50,
    };
  }
}

/**
 * Classify directory entries into files and directories
 */
function classifyEntries(entries: Dirent[], searchPath: string): { filePaths: string[]; dirPaths: string[] } {
  const filePaths: string[] = [];
  const dirPaths: string[] = [];

  for (const entry of entries) {
    const itemPath = searchPath ? `${searchPath}/${entry.name}` : entry.name;
    if (entry.isFile()) {
      filePaths.push(itemPath);
    } else if (entry.isDirectory()) {
      dirPaths.push(itemPath);
    }
  }

  return { filePaths, dirPaths };
}

async function processListFilesEntries(
  ctx: LocalContext,
  filePaths: string[],
  dirPaths: string[]
): Promise<Array<Types.FileInfo | Types.DirectoryInfo>> {
  const items: Array<Types.FileInfo | Types.DirectoryInfo> = [];
  const { dbFileMap, dbDirMap } = await loadListEntities(filePaths, dirPaths);

  const fileResults = await Promise.allSettled(
    filePaths.map(filePath => processFile(ctx, filePath, dbFileMap.get(filePath)))
  );
  fileResults.forEach((result, index) => {
    if (result.status === "fulfilled") {
      items.push(result.value);
    } else {
      logger.warn(`Failed to process file: ${filePaths[index]}`, result.reason);
    }
  });

  const dirResults = await Promise.allSettled(
    dirPaths.map(dirPath => processDirectory(ctx, dirPath, dbDirMap.get(dirPath)))
  );
  dirResults.forEach((result, index) => {
    if (result.status === "fulfilled") {
      items.push(result.value);
    } else {
      logger.warn(`Failed to process directory: ${dirPaths[index]}`, result.reason);
    }
  });

  return items;
}

/**
 * Fetch child directories for a given path
 */
export async function fetchDirectoryChildren(
  ctx: LocalContext,
  searchPath?: string | null
): Promise<Types.DirectoryInfo[]> {
  try {
    const targetPath = searchPath || "";
    const absolutePath = getAbsolutePath(ctx.basePath, targetPath);

    const dbDirectories = await StorageDbRepository.directoriesByParentPath(targetPath);
    const dbDirectoriesByPath = new Map(dbDirectories.map(dir => [dir.path, dir]));

    const directories: Types.DirectoryInfo[] = [];

    try {
      const entries = await fs.readdir(absolutePath, { withFileTypes: true });
      const directoryEntries = entries.filter(entry => entry.isDirectory());

      const dirEntryResults = await Promise.allSettled(
        directoryEntries.map(entry =>
          processLocalDirectoryEntry(ctx, entry.name, targetPath, dbDirectoriesByPath)
        )
      );
      dirEntryResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          directories.push(result.value);
        } else {
          logger.warn(`Failed to process directory entry: ${directoryEntries[index].name}`, result.reason);
        }
      });
    } catch (error) {
      logger.warn(`Failed to read directory: ${targetPath}`, error);
    }

    return directories;
  } catch (error) {
    logger.error(`Failed to fetch directory children: ${searchPath}`, error);
    return [];
  }
}

/**
 * Process a single directory entry to create a DirectoryInfo object
 */
async function processLocalDirectoryEntry(
  ctx: LocalContext,
  entryName: string,
  targetPath: string,
  dbDirectoriesByPath: Map<string, Types.DirectoryEntity>
): Promise<Types.DirectoryInfo> {
  const dirPath = targetPath ? `${targetPath}/${entryName}` : entryName;
  const absoluteDirPath = getAbsolutePath(ctx.basePath, dirPath);
  const stats = await fs.stat(absoluteDirPath);
  const dbDir = dbDirectoriesByPath.get(dirPath);

  const bucketDir: Types.BucketDirectory = {
    path: dirPath,
    createdAt: stats.birthtime,
    lastModified: stats.mtime,
    isPublic: dirPath.startsWith("public"),
  };

  return StorageUtils.combineDirectoryData(bucketDir, dbDir);
}
