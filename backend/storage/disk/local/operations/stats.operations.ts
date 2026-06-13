import fs from "node:fs/promises";
import path from "node:path";
import logger from "@/backend/lib/logger";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import { extToMime } from "@/utils/storage.utils";
import { calculateTotalFiles, formatFileTypeBreakdown, updateFileTypeMap } from "../../shared/stats-operations.helper";
import type { LocalContext } from "../types";
import { getAbsolutePath } from "../utils";

interface StatsState {
  totalSize: bigint;
  fileTypeMap: Map<Types.FileTypes, { count: number; size: bigint }>;
  directories: Set<string>;
}

/**
 * Process a single file to update statistics state
 */
async function processFileStats(filePath: string, fileName: string, state: StatsState): Promise<void> {
  const stats = await fs.stat(filePath);
  const size = BigInt(stats.size);
  state.totalSize += size;

  const ext = path.extname(fileName).toLowerCase().slice(1);
  const contentType = extToMime[ext] || "application/octet-stream";

  const fileType = StorageUtils.getFileTypeFromContentType(contentType);
  updateFileTypeMap(state.fileTypeMap, fileType, size);
}

/**
 * Recursively walk a directory to collect statistics
 */
async function walkDirectory(dirPath: string, relativePath: string, state: StatsState): Promise<void> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryAbsolutePath = path.join(dirPath, entry.name);
    const entryRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      state.directories.add(entryRelativePath);
      await walkDirectory(entryAbsolutePath, entryRelativePath, state);
    } else if (entry.isFile()) {
      await processFileStats(entryAbsolutePath, entry.name, state);
    }
  }
}

/**
 * Get storage statistics for a local path
 */
export async function storageStatistics(ctx: LocalContext, searchPath?: string | null): Promise<Types.StorageStats> {
  try {
    const targetPath = searchPath || "";
    const absolutePath = getAbsolutePath(ctx.basePath, targetPath);

    const state: StatsState = {
      totalSize: BigInt(0),
      fileTypeMap: new Map<Types.FileTypes, { count: number; size: bigint }>(),
      directories: new Set<string>(),
    };

    try {
      await fs.access(absolutePath);
      const stats = await fs.stat(absolutePath);

      if (stats.isDirectory()) {
        await walkDirectory(absolutePath, "", state);
      } else if (stats.isFile()) {
        await processFileStats(absolutePath, targetPath, state);
      }
    } catch {
      return {
        totalFiles: 0,
        totalSize: BigInt(0),
        fileTypeBreakdown: [],
        directoryCount: 0,
      };
    }

    return {
      totalFiles: calculateTotalFiles(state.fileTypeMap),
      totalSize: state.totalSize,
      fileTypeBreakdown: formatFileTypeBreakdown(state.fileTypeMap),
      directoryCount: state.directories.size,
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
