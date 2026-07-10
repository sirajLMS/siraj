import { StorageDbRepository } from "@/backend/db/repo";
import logger from "@/backend/lib/logger";
import { StorageValidationError } from "@/backend/storage/disk/storage.service.interface";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";

/**
 * Check if the parent directory allows creating subdirectories
 */
async function checkParentPermissions(fullPath: string): Promise<Types.FileOperationResult | null> {
  const parentPath = fullPath.substring(0, fullPath.lastIndexOf("/"));
  if (parentPath.length === 0) return null;

  const parentDir = await StorageDbRepository.directoryByPath(parentPath);
  if (parentDir && !parentDir.allowCreateSubDirs) {
    return {
      success: false,
      message: "Creating subdirectories not allowed in parent directory",
    };
  }

  return null;
}

/**
 * Creates a directory record in the database if needed, or returns a basic info object
 */
async function createDirectoryRecord(fullPath: string, input: Types.FolderCreateInput): Promise<Types.DirectoryInfo> {
  const hasCustomPermissions = input.permissions != null || input.protected === true || input.protectChildren === true;

  if (!hasCustomPermissions) {
    return StorageUtils.createDirectoryFromPath(fullPath);
  }

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

    return StorageUtils.combineDirectoryData(bucketDir, directoryEntity);
  } catch (error) {
    logger.warn(`Failed to save folder permissions in DB: ${error instanceof Error ? error.message : String(error)}`);
    return StorageUtils.createDirectoryFromPath(fullPath);
  }
}

/**
 * Common logic for creating a folder across different storage providers
 */
export async function createFolderHelper(
  input: Types.FolderCreateInput,
  createOnStorageFn: (path: string) => Promise<void>
): Promise<Types.FileOperationResult> {
  try {
    const fullPath = normalizePath(input.path);

    const validationError = StorageUtils.validatePath(fullPath);
    if (validationError) {
      throw new StorageValidationError(validationError);
    }

    const permissionResult = await checkParentPermissions(fullPath);
    if (permissionResult) return permissionResult;

    // Call adapter-specific creation logic
    await createOnStorageFn(fullPath);

    const newDirectoryInfo = await createDirectoryRecord(fullPath, input);

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
