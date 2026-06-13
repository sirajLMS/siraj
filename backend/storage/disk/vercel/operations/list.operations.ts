import { StorageDbRepository } from "@/backend/db/repo";
import logger from "@/backend/lib/logger";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import { extToMime } from "@/utils/storage.utils";
import { loadListEntities, paginateStorageItems } from "../../shared/list-operations.helper";
import { getBlobs } from "../shared";
import type { VercelContext } from "../types";
import { cleanVercelPath } from "../utils";

export async function listFiles(
  ctx: VercelContext,
  input: Types.FilesListSearchInput
): Promise<Types.StorageObjectList> {
  try {
    const searchPath = cleanVercelPath(input.path || "");
    const prefix = searchPath ? `${searchPath}/` : "";
    const allBlobs = await getBlobs(ctx, prefix);

    if (allBlobs.length === 0) {
      return {
        items: [],
        totalCount: 0,
        hasMore: false,
        offset: input.offset || 0,
        limit: input.limit || 50,
      };
    }

    const { filePaths, dirPaths } = identifyChildren(allBlobs, prefix, searchPath);
    const { dbFileMap, dbDirMap } = await loadListEntities(filePaths, dirPaths);
    const blobMap = createBlobMap(allBlobs);

    const items: Array<Types.FileInfo | Types.DirectoryInfo> = [
      ...processFiles(filePaths, blobMap, dbFileMap),
      ...processDirectories(dirPaths, allBlobs, dbDirMap),
    ];

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
 * Creates a map of pathnames to blob metadata for efficient lookup
 */
function createBlobMap(
  allBlobs: Array<{ pathname: string; size: number; uploadedAt: Date; url: string }>
): Map<string, { pathname: string; size: number; uploadedAt: Date; url: string }> {
  const blobMap = new Map<string, { pathname: string; size: number; uploadedAt: Date; url: string }>();
  for (const blob of allBlobs) {
    blobMap.set(blob.pathname, blob);
  }
  return blobMap;
}

function identifyChildren(
  allBlobs: Array<{ pathname: string }>,
  prefix: string,
  searchPath: string
): { filePaths: string[]; dirPaths: string[] } {
  const filePaths: string[] = [];
  const dirPathsSet = new Set<string>();

  for (const blob of allBlobs) {
    const relativePath = blob.pathname.startsWith(prefix) ? blob.pathname.slice(prefix.length) : blob.pathname;
    const slashIndex = relativePath.indexOf("/");

    if (slashIndex === -1) {
      filePaths.push(blob.pathname);
    } else {
      const dirName = relativePath.substring(0, slashIndex);
      const dirPath = searchPath ? `${searchPath}/${dirName}` : dirName;
      dirPathsSet.add(dirPath);
    }
  }

  return {
    filePaths,
    dirPaths: Array.from(dirPathsSet),
  };
}

function processFiles(
  filePaths: string[],
  blobMap: Map<string, { size: number; uploadedAt: Date; url: string }>,
  dbFileMap: Map<string, Types.FileEntity>
): Types.FileInfo[] {
  const items: Types.FileInfo[] = [];

  for (const filePath of filePaths) {
    try {
      const blob = blobMap.get(filePath);
      if (!blob) continue;

      const directoryPath = StorageUtils.extractDirectoryPath(filePath);
      const ext = filePath.split(".").pop()?.toLowerCase() || "";
      const contentType = extToMime[ext] || "application/octet-stream";

      const bucketFile: Types.BucketFile = {
        path: filePath,
        directoryPath,
        size: BigInt(blob.size),
        contentType,
        contentHash: undefined,
        createdAt: blob.uploadedAt,
        lastModified: blob.uploadedAt,
        url: blob.url,
        mediaLink: blob.url,
        fileType: StorageUtils.getFileTypeFromContentType(contentType),
        isPublic: filePath.startsWith("public"),
      };

      const dbFile = dbFileMap.get(filePath);
      items.push(StorageUtils.combineFileData(bucketFile, dbFile));
    } catch (error) {
      logger.warn(`Failed to process file: ${filePath}`, error);
    }
  }

  return items;
}

function processDirectories(
  dirPaths: string[],
  allBlobs: Array<{ pathname: string; uploadedAt: Date }>,
  dbDirMap: Map<string, Types.DirectoryEntity>
): Types.DirectoryInfo[] {
  const items: Types.DirectoryInfo[] = [];

  for (const dirPath of dirPaths) {
    try {
      const dbDir = dbDirMap.get(dirPath);
      const dirPrefix = `${dirPath}/`;
      const filesInDir = allBlobs.filter(blob => blob.pathname.startsWith(dirPrefix));

      const uploadDates = filesInDir.map(b => b.uploadedAt);
      const createdAt = uploadDates.length > 0 ? new Date(Math.min(...uploadDates.map(d => d.getTime()))) : new Date();
      const lastModified =
        uploadDates.length > 0 ? new Date(Math.max(...uploadDates.map(d => d.getTime()))) : new Date();

      const bucketDir: Types.BucketDirectory = {
        path: dirPath,
        createdAt,
        lastModified,
        isPublic: dirPath.startsWith("public"),
      };

      items.push(StorageUtils.combineDirectoryData(bucketDir, dbDir, filesInDir.length));
    } catch (error) {
      logger.warn(`Failed to process directory: ${dirPath}`, error);
    }
  }

  return items;
}

export async function fetchDirectoryChildren(
  ctx: VercelContext,
  searchPath?: string | null
): Promise<Types.DirectoryInfo[]> {
  try {
    const targetPath = searchPath || "";
    const prefix = targetPath ? `${targetPath}/` : "";

    const dbDirectories = await StorageDbRepository.directoriesByParentPath(targetPath);
    const dbDirectoriesByPath = new Map(dbDirectories.map(dir => [dir.path, dir]));

    const allBlobs = await getBlobs(ctx, prefix);
    const childDirPaths = identifyChildDirectories(allBlobs, prefix, targetPath);

    const directories: Types.DirectoryInfo[] = [];
    for (const dirPath of childDirPaths) {
      try {
        directories.push(processChildDirectory(dirPath, allBlobs, dbDirectoriesByPath));
      } catch (error) {
        logger.warn(`Failed to process directory: ${dirPath}`, error);
      }
    }

    return directories;
  } catch (error) {
    logger.error(`Failed to fetch directory children: ${searchPath}`, error);
    return [];
  }
}

/**
 * Identifies immediate child directories from a list of blobs
 */
function identifyChildDirectories(
  allBlobs: Array<{ pathname: string }>,
  prefix: string,
  targetPath: string
): Set<string> {
  const childDirPaths = new Set<string>();

  for (const blob of allBlobs) {
    const relativePath = blob.pathname.startsWith(prefix) ? blob.pathname.slice(prefix.length) : blob.pathname;
    const firstSlashIndex = relativePath.indexOf("/");

    if (firstSlashIndex !== -1) {
      const childDirName = relativePath.substring(0, firstSlashIndex);
      const childDirPath = targetPath ? `${targetPath}/${childDirName}` : childDirName;
      childDirPaths.add(childDirPath);
    }
  }

  return childDirPaths;
}

function processChildDirectory(
  dirPath: string,
  allBlobs: Array<{ pathname: string; uploadedAt: Date }>,
  dbDirectoriesByPath: Map<string, Types.DirectoryEntity>
): Types.DirectoryInfo {
  const dbDir = dbDirectoriesByPath.get(dirPath);
  const dirPrefix = `${dirPath}/`;
  const filesInDir = allBlobs.filter(blob => blob.pathname.startsWith(dirPrefix));

  const uploadDates = filesInDir.map(b => b.uploadedAt);
  const createdAt = uploadDates.length > 0 ? new Date(Math.min(...uploadDates.map(d => d.getTime()))) : new Date();
  const lastModified = uploadDates.length > 0 ? new Date(Math.max(...uploadDates.map(d => d.getTime()))) : new Date();

  const bucketDir: Types.BucketDirectory = {
    path: dirPath,
    createdAt,
    lastModified,
    isPublic: dirPath.startsWith("public"),
  };

  return StorageUtils.combineDirectoryData(bucketDir, dbDir, filesInDir.length);
}
