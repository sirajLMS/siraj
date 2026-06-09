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

export async function listFiles(
  ctx: LocalContext,
  input: Types.FilesListSearchInput
): Promise<Types.StorageObjectList> {
  try {
    const searchPath = cleanLocalPath(input.path || "");
    const absolutePath = getAbsolutePath(ctx.basePath, searchPath);

    const items: Array<Types.FileInfo | Types.DirectoryInfo> = [];

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

    const processedItems = await processListFilesEntries(ctx, filePaths, dirPaths);
    items.push(...processedItems);

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

async function processListFilesEntries(ctx: LocalContext, filePaths: string[], dirPaths: string[]) {
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

export async function fetchDirectoryChildren(
  ctx: LocalContext,
  searchPath?: string | null
): Promise<Types.DirectoryInfo[]> {
  try {
    const targetPath = !searchPath || searchPath.length === 0 ? "" : searchPath;
    const absolutePath = getAbsolutePath(ctx.basePath, targetPath);

    const dbDirectories = await StorageDbRepository.directoriesByParentPath(targetPath);
    const dbDirectoriesByPath = new Map(dbDirectories.map(dir => [dir.path, dir]));

    const directories: Types.DirectoryInfo[] = [];

    try {
      const entries = await fs.readdir(absolutePath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const dirPath = targetPath ? `${targetPath}/${entry.name}` : entry.name;
          const absoluteDirPath = getAbsolutePath(ctx.basePath, dirPath);
          const stats = await fs.stat(absoluteDirPath);
          const dbDir = dbDirectoriesByPath.get(dirPath);

          const bucketDir: Types.BucketDirectory = {
            path: dirPath,
            createdAt: stats.birthtime,
            lastModified: stats.mtime,
            isPublic: dirPath.startsWith("public"),
          };

          directories.push(StorageUtils.combineDirectoryData(bucketDir, dbDir));
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
