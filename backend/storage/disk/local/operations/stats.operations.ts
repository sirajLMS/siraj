import fs from "node:fs/promises";
import path from "node:path";
import logger from "@/backend/lib/logger";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import { extToMime } from "@/utils/storage.utils";
import { calculateTotalFiles, formatFileTypeBreakdown, updateFileTypeMap } from "../../shared/stats-operations.helper";
import type { LocalContext } from "../types";
import { getAbsolutePath } from "../utils";

export async function storageStatistics(ctx: LocalContext, searchPath?: string | null): Promise<Types.StorageStats> {
  try {
    const targetPath = searchPath || "";
    const absolutePath = getAbsolutePath(ctx.basePath, targetPath);

    let totalSize = BigInt(0);
    const fileTypeMap = new Map<Types.FileTypes, { count: number; size: bigint }>();
    const directories = new Set<string>();

    const walkDirectory = async (dirPath: string, relativePath: string) => {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const entryAbsolutePath = path.join(dirPath, entry.name);
        const entryRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

        if (entry.isDirectory()) {
          directories.add(entryRelativePath);
          await walkDirectory(entryAbsolutePath, entryRelativePath);
        } else if (entry.isFile()) {
          const stats = await fs.stat(entryAbsolutePath);
          const size = BigInt(stats.size);
          totalSize += size;

          const ext = path.extname(entry.name).toLowerCase().slice(1);
          const contentType = extToMime[ext] || "application/octet-stream";

          const fileType = StorageUtils.getFileTypeFromContentType(contentType);
          updateFileTypeMap(fileTypeMap, fileType, size);
        }
      }
    };

    try {
      await fs.access(absolutePath);
      const stats = await fs.stat(absolutePath);

      if (stats.isDirectory()) {
        await walkDirectory(absolutePath, "");
      } else if (stats.isFile()) {
        const size = BigInt(stats.size);
        totalSize = size;

        const ext = path.extname(targetPath).toLowerCase().slice(1);
        const contentType = extToMime[ext] || "application/octet-stream";

        const fileType = StorageUtils.getFileTypeFromContentType(contentType);
        updateFileTypeMap(fileTypeMap, fileType, size);
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
