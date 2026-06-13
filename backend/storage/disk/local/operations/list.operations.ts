import type { Dirent } from "node:fs";
import fs from "node:fs/promises";
import { StorageDbRepository } from "@/backend/db/repo";
import logger from "@/backend/lib/logger";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import { loadListEntities, paginateStorageItems } from "../../shared/list-operations.helper";
import { processDirectory, processFile } from "../shared";
import type { LocalContext } from "../types";
import { cleanLocalPath, getAbsolutePath } from "../utils";

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

  for (const filePath of filePaths) {
    try {
      const dbFile = dbFileMap.get(filePath);
      items.push(await processFile(ctx, filePath, dbFile));
    } catch (error) {
      logger.warn(`Failed to process file: ${filePath}`, error);
    }
  }

  for (const dirPath of dirPaths) {
    try {
      const dbDir = dbDirMap.get(dirPath);
      items.push(await processDirectory(ctx, dirPath, dbDir));
    } catch (error) {
      logger.warn(`Failed to process directory: ${dirPath}`, error);
    }
  }

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

      for (const entry of entries) {
        if (entry.isDirectory()) {
          try {
            const dirInfo = await processLocalDirectoryEntry(ctx, entry.name, targetPath, dbDirectoriesByPath);
            directories.push(dirInfo);
          } catch (error) {
            logger.warn(`Failed to process directory entry: ${entry.name}`, error);
          }
        }
      }
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
