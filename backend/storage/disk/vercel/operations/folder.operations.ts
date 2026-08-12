import { list } from "@vercel/blob";
import { StorageDbRepository } from "@/backend/db/repo/storage";
import { logger } from "@/backend/lib/logger";
import { createFolderHelper } from "@/backend/storage/disk/shared/folder-operations.helper";
import type { VercelContext } from "@/backend/storage/disk/vercel/types";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";

export async function createFolder(
  _ctx: VercelContext,
  input: Types.FolderCreateInput
): Promise<Types.FileOperationResult> {
  return createFolderHelper(input, _fullPath => {
    // Vercel Blob doesn't have a specific "create directory" operation
    // as it is a flat structure. We just need to handle the DB entry if needed.
    return Promise.resolve();
  });
}

export async function directoryInfoByPath(ctx: VercelContext, dirPath: string): Promise<Types.DirectoryInfo | null> {
  try {
    const dbDirectory = await StorageDbRepository.directoryByPath(dirPath);

    const prefix = dirPath ? `${dirPath}/` : "";
    let dirExists = false;
    let createdAt = new Date();
    let lastModified = new Date();
    let fileCount = 0;

    try {
      const result = await list({
        token: ctx.token,
        prefix: prefix,
        limit: 1000,
      });

      if (result.blobs.length > 0) {
        dirExists = true;
        fileCount = result.blobs.length;

        const uploadDates = result.blobs.map(b => b.uploadedAt);
        createdAt = new Date(Math.min(...uploadDates.map(d => d.getTime())));
        lastModified = new Date(Math.max(...uploadDates.map(d => d.getTime())));
      }
    } catch (error) {
      logger.warn(`Failed to check directory in Vercel Blob: ${dirPath}`, error);
      dirExists = false;
    }

    if (!dirExists && !dbDirectory) {
      return null;
    }

    const bucketDir: Types.BucketDirectory = {
      path: dirPath,
      createdAt,
      lastModified,
      isPublic: dirPath.startsWith("public"),
    };

    return StorageUtils.combineDirectoryData(bucketDir, dbDirectory, fileCount);
  } catch (error) {
    logger.error(`Failed to get directory info: ${dirPath}`, error);
    return null;
  }
}
