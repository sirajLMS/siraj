import { copy, del, head, list } from "@vercel/blob";
import { StorageDbRepository } from "@/backend/db/repo/storage";
import { logger } from "@/backend/lib/logger";
import type { VercelContext } from "@/backend/storage/disk/vercel/types";
import { getVercelBlobPath } from "@/backend/storage/disk/vercel/utils";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import { extToMime } from "@/shared/utils/storage.utils";

export async function fileExists(ctx: VercelContext, filePath: string): Promise<boolean> {
  try {
    const cleanedPath = getVercelBlobPath(filePath);

    try {
      await head(cleanedPath, { token: ctx.token });

      const dbFile = await StorageDbRepository.fileByPath(filePath);
      if (!dbFile) {
        try {
          await StorageDbRepository.createFile(filePath, false);
          logger.info(`Created database record for existing file: ${filePath}`);
        } catch (error) {
          logger.warn(`Failed to create database record for file: ${filePath}`, error);
        }
      }

      return true;
    } catch {
      // Blob doesn't exist as a file, check if it's a directory below
    }

    const prefix = cleanedPath.endsWith("/") ? cleanedPath : `${cleanedPath}/`;
    const { blobs } = await list({
      token: ctx.token,
      prefix: prefix,
      limit: 1,
    });

    if (blobs.length > 0) {
      const dbDirectory = await StorageDbRepository.directoryByPath(filePath);
      if (!dbDirectory) {
        logger.info(`Directory exists in Vercel Blob without DB record: ${filePath}`);
      }
      return true;
    }

    return false;
  } catch (error) {
    logger.error(`Error checking file existence: ${filePath}`, error);
    return false;
  }
}

export async function fileInfoByPath(ctx: VercelContext, filePath: string): Promise<Types.FileInfo | null> {
  try {
    let blobInfo: Awaited<ReturnType<typeof head>> | undefined;
    try {
      blobInfo = await head(filePath, { token: ctx.token });
    } catch {
      return null;
    }

    const directoryPath = StorageUtils.extractDirectoryPath(filePath);
    const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
    const contentType = extToMime[ext] ?? "application/octet-stream";

    const bucketFile: Types.BucketFile = {
      path: filePath,
      directoryPath,
      size: BigInt(blobInfo.size),
      contentType,
      contentHash: undefined,
      createdAt: blobInfo.uploadedAt,
      lastModified: blobInfo.uploadedAt,
      url: blobInfo.url,
      mediaLink: blobInfo.url,
      fileType: StorageUtils.getFileTypeFromContentType(contentType),
      isPublic: filePath.startsWith("public"),
    };

    const dbFile = await StorageDbRepository.fileByPath(filePath);
    return StorageUtils.combineFileData(bucketFile, dbFile);
  } catch (error) {
    logger.error(`Failed to get file info: ${filePath}`, error);
    return null;
  }
}

export async function fileInfoByDbFileId(ctx: VercelContext, id: string): Promise<Types.FileInfo | null> {
  try {
    const dbFile = await StorageDbRepository.fileById(id);
    if (!dbFile) {
      return null;
    }

    let blobInfo: Awaited<ReturnType<typeof head>> | undefined;
    try {
      blobInfo = await head(dbFile.path, { token: ctx.token });
    } catch (error) {
      logger.warn(`File in DB but not in Vercel Blob: ${dbFile.path}`, error);
      return null;
    }

    const directoryPath = StorageUtils.extractDirectoryPath(dbFile.path);
    const ext = dbFile.path.split(".").pop()?.toLowerCase() ?? "";
    const contentType = extToMime[ext] ?? "application/octet-stream";

    const bucketFile: Types.BucketFile = {
      path: dbFile.path,
      directoryPath,
      size: BigInt(blobInfo.size),
      contentType,
      contentHash: undefined,
      createdAt: blobInfo.uploadedAt,
      lastModified: blobInfo.uploadedAt,
      url: blobInfo.url,
      mediaLink: blobInfo.url,
      fileType: StorageUtils.getFileTypeFromContentType(contentType),
      isPublic: dbFile.path.startsWith("public"),
    };

    return StorageUtils.combineFileData(bucketFile, dbFile);
  } catch (error) {
    logger.error(`Failed to get file info by id: ${id}`, error);
    return null;
  }
}

/**
 * Move a Vercel blob from one path to another by copying and then deleting
 */
async function moveVercelBlob(ctx: VercelContext, fromUrl: string, toPath: string): Promise<{ url: string }> {
  const newBlob = await copy(fromUrl, toPath, {
    token: ctx.token,
    access: "public",
  });

  try {
    await del(fromUrl, { token: ctx.token });
    return newBlob;
  } catch (error) {
    logger.error("Failed to delete original after copy, rolling back", error);
    await del(newBlob.url, { token: ctx.token }).catch((rollbackError: unknown) => {
      logger.error("Rollback of copied blob failed", rollbackError);
    });
    throw error;
  }
}

/**
 * Update file path in the database
 */
async function updateDbFilePath(oldPath: string, newPath: string): Promise<Types.FileEntity | undefined> {
  try {
    const dbFile = await StorageDbRepository.fileByPath(oldPath);
    if (!dbFile) return undefined;

    return await StorageDbRepository.updateFile({
      ...dbFile,
      path: newPath,
    });
  } catch (error) {
    logger.warn(`Failed to update file in database: ${oldPath}`, error);
    return undefined;
  }
}

export async function renameFile(ctx: VercelContext, input: Types.FileRenameInput): Promise<Types.FileOperationResult> {
  try {
    const pathErr = StorageUtils.validatePath(input.currentPath);
    if (pathErr) return { success: false, message: pathErr };

    const nameErr = StorageUtils.validateFileName(input.newName);
    if (nameErr) return { success: false, message: nameErr };

    const directoryPath = StorageUtils.extractDirectoryPath(input.currentPath);
    const newPath = `${directoryPath}/${input.newName}`;

    let originalBlob: Awaited<ReturnType<typeof head>>;
    try {
      originalBlob = await head(input.currentPath, { token: ctx.token });
    } catch {
      return { success: false, message: `File not found: ${input.currentPath}` };
    }

    logger.info(`Renaming blob: ${input.currentPath} -> ${newPath}`);
    const newBlob = await moveVercelBlob(ctx, originalBlob.url, newPath);

    const fileEntity = await updateDbFilePath(input.currentPath, newPath);

    const ext = newPath.split(".").pop()?.toLowerCase() ?? "";
    const contentType = extToMime[ext] ?? "application/octet-stream";
    const now = new Date();

    const bucketFile: Types.BucketFile = {
      path: newPath,
      directoryPath,
      size: BigInt(originalBlob.size),
      contentType,
      contentHash: undefined,
      createdAt: now,
      lastModified: now,
      url: newBlob.url,
      mediaLink: newBlob.url,
      fileType: StorageUtils.getFileTypeFromContentType(contentType),
      isPublic: newPath.startsWith("public"),
    };

    return {
      success: true,
      message: "File renamed successfully",
      data: StorageUtils.combineFileData(bucketFile, fileEntity),
    };
  } catch (error) {
    logger.error(`Failed to rename file: ${input.currentPath}`, error);
    return {
      success: false,
      message: `Failed to rename file: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
