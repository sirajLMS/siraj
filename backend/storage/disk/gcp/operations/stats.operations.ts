import type { GetFilesResponse } from "@google-cloud/storage";
import logger from "@/backend/lib/logger";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import type { GcpContext, GcsApiResponse } from "../types";

export async function storageStatistics(ctx: GcpContext, path?: string): Promise<Types.StorageStats> {
  try {
    const prefix = path ? `${path}/` : "";
    const [files] = await ctx.bucket.getFiles({ prefix });

    let totalSize = BigInt(0);
    const fileTypeMap = new Map<Types.FileTypes, { count: number; size: bigint }>();

    for (const file of files) {
      const size = BigInt(file.metadata.size || 0);
      totalSize += size;

      const fileType = StorageUtils.getFileTypeFromContentType(file.metadata.contentType);
      const current = fileTypeMap.get(fileType) || {
        count: 0,
        size: BigInt(0),
      };
      fileTypeMap.set(fileType, {
        count: current.count + 1,
        size: current.size + size,
      });
    }

    const fileTypeBreakdown = Array.from(fileTypeMap.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      size: data.size,
    }));

    const response: GetFilesResponse = await ctx.bucket.getFiles({
      prefix,
      delimiter: "/",
    });
    const apiResponse = response[2] as GcsApiResponse | undefined;
    const directoryCount = apiResponse?.prefixes?.length || 0;

    return {
      totalFiles: files.length,
      totalSize,
      fileTypeBreakdown,
      directoryCount,
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
