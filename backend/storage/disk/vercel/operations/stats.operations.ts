import { logger } from "@/backend/lib/logger";
import {
  calculateTotalFiles,
  formatFileTypeBreakdown,
  updateFileTypeMap,
} from "@/backend/storage/disk/shared/stats-operations.helper";
import { getBlobs } from "@/backend/storage/disk/vercel/shared";
import type { VercelContext } from "@/backend/storage/disk/vercel/types";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import { extToMime } from "@/shared/utils/storage.utils";

export async function storageStatistics(ctx: VercelContext, searchPath?: string | null): Promise<Types.StorageStats> {
  try {
    const targetPath = searchPath ?? "";
    const prefix = targetPath ? `${targetPath}/` : "";

    const allBlobs = await getBlobs(ctx, prefix);

    if (allBlobs.length === 0) {
      return {
        totalFiles: 0,
        totalSize: BigInt(0),
        fileTypeBreakdown: [],
        directoryCount: 0,
      };
    }

    const { totalSize, fileTypeMap, directories } = processStorageStatisticsBlobs(allBlobs, prefix, targetPath);

    return {
      totalFiles: calculateTotalFiles(fileTypeMap),
      totalSize,
      fileTypeBreakdown: formatFileTypeBreakdown(fileTypeMap),
      directoryCount: directories.size,
    };
  } catch (error) {
    logger.error("Failed to get storage statistics", error);
    return {
      totalFiles: 0,
      totalSize: BigInt(0),
      fileTypeBreakdown: [],
      directoryCount: 0,
    };
  }
}

/**
 * Infer content type from file path extension
 */
function getContentTypeFromPath(pathname: string): string {
  const ext = pathname.split(".").pop()?.toLowerCase() ?? "";
  return extToMime[ext] || "application/octet-stream";
}

/**
 * Add all parent directories of a file path to the set of directories
 */
function aggregateDirectories(directories: Set<string>, pathname: string, prefix: string, targetPath: string): void {
  const relativePath = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname;
  const lastSlashIndex = relativePath.lastIndexOf("/");

  if (lastSlashIndex === -1) return;

  const dirPath = relativePath.substring(0, lastSlashIndex);
  const fullDirPath = targetPath ? `${targetPath}/${dirPath}` : dirPath;

  const parts = fullDirPath.split("/");
  let currentPath = "";
  for (const part of parts) {
    currentPath = currentPath ? `${currentPath}/${part}` : part;
    directories.add(currentPath);
  }
}

function processStorageStatisticsBlobs(
  allBlobs: Array<{ size: number | bigint; pathname: string }>,
  prefix: string,
  targetPath: string
) {
  let totalSize = BigInt(0);
  const fileTypeMap = new Map<Types.FileTypes, { count: number; size: bigint }>();
  const directories = new Set<string>();

  for (const blob of allBlobs) {
    const size = BigInt(blob.size);
    totalSize += size;

    const contentType = getContentTypeFromPath(blob.pathname);
    const fileType = StorageUtils.getFileTypeFromContentType(contentType);
    updateFileTypeMap(fileTypeMap, fileType, size);

    aggregateDirectories(directories, blob.pathname, prefix, targetPath);
  }

  return { totalSize, fileTypeMap, directories };
}
