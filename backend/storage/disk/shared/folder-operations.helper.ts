import { StorageDbRepository } from "@/backend/db/repo";
import logger from "@/backend/lib/logger";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import { StorageValidationError } from "../storage.service.interface";

/**
 * Common logic for creating a folder across different storage providers
 */
export async function createFolderHelper(
  input: Types.FolderCreateInput,
  createOnStorageFn: (path: string) => Promise<void>
): Promise<Types.FileOperationResult> {
  try {
    const fullPath = normalizePath(input.path);

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

    // Call adapter-specific creation logic
    await createOnStorageFn(fullPath);

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

/**
 * Normalize path by removing leading and trailing slashes
 */
function normalizePath(path: string): string {
  if (!path || path.length === 0) {
    return "";
  }
  return path.replace(/^\/+/, "").replace(/\/$/, "");
}
