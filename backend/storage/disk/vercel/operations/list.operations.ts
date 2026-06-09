import { StorageDbRepository } from "@/backend/db/repo";
import logger from "@/backend/lib/logger";
import * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import { OrderSortDirection } from "@/lib/enum";
import { extToMime } from "@/utils/storage.utils";
import { getBlobs } from "../shared";
import type { VercelContext } from "../types";
import { cleanVercelPath } from "../utils";

export async function listFiles(
  ctx: VercelContext,
  input: Types.FilesListSearchInput
): Promise<Types.StorageObjectList> {
  try {
    const searchPath = cleanVercelPath(input.path || "");
    const items: Array<Types.FileInfo | Types.DirectoryInfo> = [];

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

    const [dbFiles, dbDirectories] = await Promise.all([
      filePaths.length > 0 ? StorageDbRepository.filesByPaths(filePaths) : [],
      dirPaths.length > 0 ? StorageDbRepository.directoriesByPaths(dirPaths) : [],
    ]);

    const dbFileMap = new Map<string, Types.FileEntity>();
    for (const dbFile of dbFiles) {
      dbFileMap.set(dbFile.path, dbFile);
    }

    const dbDirMap = new Map<string, Types.DirectoryEntity>();
    for (const dbDir of dbDirectories) {
      dbDirMap.set(dbDir.path, dbDir);
    }

    const blobMap = new Map<string, { size: number; uploadedAt: Date; url: string }>();
    for (const blob of allBlobs) {
      blobMap.set(blob.pathname, blob);
    }

    items.push(...processFiles(filePaths, blobMap, dbFileMap), ...processDirectories(dirPaths, allBlobs, dbDirMap));

    const filteredItems = filterAndSortItems(items, input);

    const totalCount = filteredItems.length;
    const offset = input.offset || 0;
    const limit = input.limit || 50;
    const paginatedItems = filteredItems.slice(offset, offset + limit);
    const hasMore = offset + limit < totalCount;

    return {
      items: paginatedItems,
      totalCount,
      hasMore,
      offset,
      limit,
    };
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
      const fileInfo = StorageUtils.combineFileData(bucketFile, dbFile);
      items.push(fileInfo);
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
      const fileCount = filesInDir.length;

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

      const dirInfo = StorageUtils.combineDirectoryData(bucketDir, dbDir, fileCount);
      items.push(dirInfo);
    } catch (error) {
      logger.warn(`Failed to process directory: ${dirPath}`, error);
    }
  }

  return items;
}

function filterAndSortItems(
  items: Array<Types.FileInfo | Types.DirectoryInfo>,
  input: Types.FilesListSearchInput
): Array<Types.FileInfo | Types.DirectoryInfo> {
  let filteredItems = items;

  if (input.searchTerm && input.searchTerm.length > 0) {
    const searchLower = input.searchTerm.toLowerCase();
    filteredItems = items.filter(item => item.name.toLowerCase().includes(searchLower));
  }

  filteredItems = StorageUtils.filterStorageItems(filteredItems, {
    includeDirectories: input.includeDirectories ?? null,
    fileType: input.fileType ?? null,
    fileTypes: input.fileTypes ?? null,
    contentTypes: input.contentTypes ?? null,
  });

  return StorageUtils.sortItems(
    filteredItems,
    input.sortBy || Types.FileSortField.NAME,
    input.sortDirection || OrderSortDirection.ASC
  );
}

export async function fetchDirectoryChildren(
  ctx: VercelContext,
  searchPath?: string | null
): Promise<Types.DirectoryInfo[]> {
  try {
    const targetPath = !searchPath || searchPath.length === 0 ? "" : searchPath;
    const prefix = targetPath ? `${targetPath}/` : "";

    const dbDirectories = await StorageDbRepository.directoriesByParentPath(targetPath);
    const dbDirectoriesByPath = new Map<string, Types.DirectoryEntity>();
    for (const dir of dbDirectories) {
      dbDirectoriesByPath.set(dir.path, dir);
    }

    const directories: Types.DirectoryInfo[] = [];
    const allBlobs = await getBlobs(ctx, prefix);
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

  const fileCount = filesInDir.length;
  return StorageUtils.combineDirectoryData(bucketDir, dbDir, fileCount);
}
