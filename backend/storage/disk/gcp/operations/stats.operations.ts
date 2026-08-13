import type { File, GetFilesResponse } from "@google-cloud/storage";
import { logger } from "@/backend/lib/logger";
import type { GcpContext, GcsApiResponse } from "@/backend/storage/disk/gcp/types";
import { formatFileTypeBreakdown, updateFileTypeMap } from "@/backend/storage/disk/shared/stats-operations.helper";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isGcsApiResponse(value: unknown): value is GcsApiResponse {
  if (!isRecord(value)) return false;
  const prefixes = value.prefixes;
  return prefixes === undefined || Array.isArray(prefixes);
}

/**
 * Get storage statistics for a GCP bucket path
 */
export async function storageStatistics(ctx: GcpContext, path?: string | null): Promise<Types.StorageStats> {
  try {
    const prefix = path ? `${path}/` : "";
    const [files] = await ctx.bucket.getFiles({ prefix });

    const { totalSize, fileTypeMap } = processGcsFiles(files);

    const response: GetFilesResponse = await ctx.bucket.getFiles({
      prefix,
      delimiter: "/",
    });
    const apiResponse = isGcsApiResponse(response[2]) ? response[2] : undefined;
    const directoryCount = apiResponse?.prefixes?.length ?? 0;

    return {
      totalFiles: files.length,
      totalSize,
      fileTypeBreakdown: formatFileTypeBreakdown(fileTypeMap),
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

/**
 * Process GCS files to aggregate size and type statistics
 */
function processGcsFiles(files: File[]) {
  let totalSize = BigInt(0);
  const fileTypeMap = new Map<Types.FileTypes, { count: number; size: bigint }>();

  for (const file of files) {
    const size = BigInt(file.metadata.size ?? 0);
    totalSize += size;

    const fileType = StorageUtils.getFileTypeFromContentType(file.metadata.contentType);
    updateFileTypeMap(fileTypeMap, fileType, size);
  }

  return { totalSize, fileTypeMap };
}
