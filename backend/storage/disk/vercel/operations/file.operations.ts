import { copy, del, head, list } from "@vercel/blob";
import { StorageDbRepository } from "@/backend/db/repo";
import logger from "@/backend/lib/logger";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import { extToMime } from "@/utils/storage.utils";
import type { VercelContext } from "../types";
import { getVercelBlobPath } from "../utils";

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
    const ext = filePath.split(".").pop()?.toLowerCase() || "";
    const contentType = extToMime[ext] || "application/octet-stream";

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
    const ext = dbFile.path.split(".").pop()?.toLowerCase() || "";
    const contentType = extToMime[ext] || "application/octet-stream";

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

export async function renameFile(ctx: VercelContext, input: Types.FileRenameInput): Promise<Types.FileOperationResult> {
  try {
    const pathValidationError = await StorageUtils.validatePath(input.currentPath);
    if (pathValidationError) {
      return { success: false, message: pathValidationError };
    }

    const nameValidationError = await StorageUtils.validateFileName(input.newName);
    if (nameValidationError) {
      return { success: false, message: nameValidationError };
    }

    const directoryPath = StorageUtils.extractDirectoryPath(input.currentPath);
    const newPath = `${directoryPath}/${input.newName}`;

    let originalBlob: Awaited<ReturnType<typeof head>> | undefined;
    try {
      originalBlob = await head(input.currentPath, { token: ctx.token });
    } catch {
      return {
        success: false,
        message: `File not found: ${input.currentPath}`,
      };
    }

    logger.info("📋 renameFile: Copying blob to new path", {
      from: input.currentPath,
      to: newPath,
    });

    const newBlob = await copy(originalBlob.url, newPath, {
      token: ctx.token,
      access: "public",
    });

    logger.info("📋 renameFile: Copy successful", { newUrl: newBlob.url });
    logger.info("🗑️ renameFile: Deleting original blob", {
      path: input.currentPath,
    });

    try {
      await del(originalBlob.url, { token: ctx.token });
      logger.info("🗑️ renameFile: Original blob deleted");
    } catch (deleteError) {
      logger.error("Failed to delete original after copy", deleteError);
      try {
        await del(newBlob.url, { token: ctx.token });
        logger.info("Rollback successful: deleted copied blob");
      } catch (rollbackError) {
        logger.error("Failed to rollback copy", rollbackError);
      }
      throw deleteError;
    }

    let fileEntity: Types.FileEntity | undefined;
    try {
      const dbFile = await StorageDbRepository.fileByPath(input.currentPath);
      if (dbFile) {
        const updatedFile = { ...dbFile, path: newPath };
        fileEntity = await StorageDbRepository.updateFile(updatedFile);
      }
    } catch (error) {
      logger.warn(`Failed to update file in database: ${input.currentPath}`, error);
    }

    const ext = newPath.split(".").pop()?.toLowerCase() || "";
    const contentType = extToMime[ext] || "application/octet-stream";
    const uploadedAt = new Date();

    const bucketFile: Types.BucketFile = {
      path: newPath,
      directoryPath,
      size: BigInt(originalBlob.size),
      contentType,
      contentHash: undefined,
      createdAt: uploadedAt,
      lastModified: uploadedAt,
      url: newBlob.url,
      mediaLink: newBlob.url,
      fileType: StorageUtils.getFileTypeFromContentType(contentType),
      isPublic: newPath.startsWith("public"),
    };

    const fileInfo = StorageUtils.combineFileData(bucketFile, fileEntity);

    return {
      success: true,
      message: "File renamed successfully",
      data: fileInfo,
    };
  } catch (error) {
    logger.error(`Failed to rename file: ${input.currentPath}`, error);
    return {
      success: false,
      message: `Failed to rename file: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
