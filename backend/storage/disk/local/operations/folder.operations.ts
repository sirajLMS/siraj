import type { Stats } from "node:fs";
import fs from "node:fs/promises";
import { StorageDbRepository } from "@/backend/db/repo";
import { logger } from "@/backend/lib/logger";
import type { LocalContext } from "@/backend/storage/disk/local/types";
import { getAbsolutePath } from "@/backend/storage/disk/local/utils";
import { createFolderHelper } from "@/backend/storage/disk/shared/folder-operations.helper";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";

export async function createFolder(
  ctx: LocalContext,
  input: Types.FolderCreateInput
): Promise<Types.FileOperationResult> {
  return createFolderHelper(input, async fullPath => {
    const absolutePath = getAbsolutePath(ctx.basePath, fullPath);
    await fs.mkdir(absolutePath, { recursive: true, mode: 0o755 });
  });
}

export async function directoryInfoByPath(ctx: LocalContext, dirPath: string): Promise<Types.DirectoryInfo | null> {
  try {
    const dbDirectory = await StorageDbRepository.directoryByPath(dirPath);

    const absolutePath = getAbsolutePath(ctx.basePath, dirPath);
    let dirExists = false;
    let stats: Stats | null = null;

    try {
      stats = await fs.stat(absolutePath);
      dirExists = stats.isDirectory();
    } catch {
      dirExists = false;
    }

    if (!dirExists && !dbDirectory) {
      return null;
    }

    const bucketDir: Types.BucketDirectory = {
      path: dirPath,
      createdAt: stats?.birthtime || new Date(),
      lastModified: stats?.mtime || new Date(),
      isPublic: dirPath.startsWith("public"),
    };

    return StorageUtils.combineDirectoryData(bucketDir, dbDirectory);
  } catch (error) {
    logger.error(`Failed to get directory info: ${dirPath}`, error);
    return null;
  }
}
