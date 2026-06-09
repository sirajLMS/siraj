import { list } from "@vercel/blob";
import { StorageDbRepository } from "@/backend/db/repo";
import logger from "@/backend/lib/logger";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import { StorageValidationError } from "../../storage.service.interface";
import type { VercelContext } from "../types";
import { cleanVercelPath } from "../utils";

export async function createFolder(
  _ctx: VercelContext,
  input: Types.FolderCreateInput
): Promise<Types.FileOperationResult> {
  try {
    const fullPath = cleanVercelPath(input.path);

    const validationError = await StorageUtils.validatePath(fullPath);
    if (validationError) {
      throw new StorageValidationError(validationError);
    }

    const parentPath = fullPath.substring(0, fullPath.lastIndexOf("/"));
    if (parentPath.length > 0) {
      const parentDir = await StorageDbRepository.directoryByPath(parentPath);
      if (parentDir && !parentDir.allowCreateSubDirs) {
        return {
          success: false,
          message: "Creating subdirectories not allowed in parent directory",
        };
      }
    }

    const hasCustomPermissions =
      input.permissions != null || input.protected === true || input.protectChildren === true;

    let newDirectoryInfo: Types.DirectoryInfo;

    if (hasCustomPermissions) {
      try {
        const directoryEntity = await StorageDbRepository.createDirectory({
          ...input,
          path: fullPath,
        });

        const bucketDir: Types.BucketDirectory = {
          path: fullPath,
          createdAt: new Date(),
          lastModified: new Date(),
          isPublic: fullPath.startsWith("public"),
        };

        newDirectoryInfo = StorageUtils.combineDirectoryData(bucketDir, directoryEntity);
      } catch (error) {
        logger.warn(
          `Failed to save folder permissions in DB: ${error instanceof Error ? error.message : String(error)}`
        );
        newDirectoryInfo = StorageUtils.createDirectoryFromPath(fullPath);
      }
    } else {
      newDirectoryInfo = StorageUtils.createDirectoryFromPath(fullPath);
    }

    return {
      success: true,
      message: "Folder created successfully",
      data: newDirectoryInfo,
    };
  } catch (error) {
    logger.error(`Failed to create folder: ${input.path}`, error);
    return {
      success: false,
      message: `Failed to create folder: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
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
