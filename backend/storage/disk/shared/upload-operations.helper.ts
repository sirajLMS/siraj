import { SignedUrlRepository } from "@/backend/db/repo/shared";
import { StorageDbRepository } from "@/backend/db/repo/storage";
import { getStringEnv } from "@/backend/lib/env";
import { logger } from "@/backend/lib/logger";
import { STORAGE_CONFIG, StorageValidationError } from "@/backend/storage/disk/storage.service.interface";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";

/**
 * Common logic for preparing an upload across different storage providers
 */
export async function prepareUploadHelper(
  input: Types.UploadPreparationInput,
  onPrepareFn: (sessionId: string, cleanedPath: string) => Types.UploadPreparationResult
): Promise<Types.UploadPreparationResult> {
  try {
    const cleanedPath = normalizePath(input.path);
    const mimeType = input.contentType;

    const validationError = StorageUtils.validateUpload({
      path: cleanedPath,
      size: input.fileSize,
      contentType: mimeType,
    });
    if (validationError) {
      throw new StorageValidationError(validationError);
    }

    const cleanupStrategy = getStringEnv("SIGNED_URL_CLEANUP_STRATEGY", "lazy");
    if (cleanupStrategy === "lazy" || cleanupStrategy === "both") {
      try {
        await SignedUrlRepository.deleteExpired();
      } catch (error) {
        logger.error("Lazy cleanup failed during upload preparation", error);
      }
    }

    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + STORAGE_CONFIG.SIGNED_URL_DURATION * 60 * 1000);

    await SignedUrlRepository.createSignedUrl({
      id: sessionId,
      filePath: cleanedPath,
      contentType: mimeType,
      fileSize: BigInt(input.fileSize),
      contentHash: input.contentHash,
      expiresAt,
      createdAt: new Date(),
      used: false,
    });

    return onPrepareFn(sessionId, cleanedPath);
  } catch (error) {
    logger.error("Failed to prepare upload", {
      path: input.path,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Common logic for uploading a file across different storage providers
 */
export async function uploadFileHelper(
  filePath: string,
  contentType: string,
  buffer: Buffer,
  uploadToStorageFn: (cleanedPath: string) => Promise<{ url: string; mediaLink?: string; hash?: string }>
): Promise<Types.FileUploadResult> {
  try {
    const cleanedFilePath = normalizePath(filePath);
    const fileSize = buffer.byteLength;

    const validationError = StorageUtils.validateUpload({
      path: filePath,
      size: fileSize,
      contentType,
    });
    if (validationError) {
      return { success: false, message: validationError, data: null };
    }

    const directoryPath = cleanedFilePath.substring(0, cleanedFilePath.lastIndexOf("/"));
    const dbDirectory = await StorageDbRepository.directoryByPath(directoryPath);

    if (dbDirectory && !dbDirectory.allowUploads) {
      return {
        success: false,
        message: "Uploads not allowed in this directory",
        data: null,
      };
    }

    const { url, mediaLink, hash } = await uploadToStorageFn(cleanedFilePath);

    const fileEntity = await StorageDbRepository.createFile(cleanedFilePath, false);

    const bucketFile: Types.BucketFile = {
      path: cleanedFilePath,
      directoryPath,
      size: BigInt(fileSize),
      contentType: contentType,
      contentHash: hash,
      createdAt: new Date(),
      lastModified: new Date(),
      url,
      mediaLink,
      fileType: StorageUtils.getFileTypeFromContentType(contentType),
      isPublic: cleanedFilePath.startsWith("public"),
    };

    return {
      success: true,
      message: "File uploaded successfully",
      data: StorageUtils.combineFileData(bucketFile, fileEntity),
    };
  } catch (error) {
    logger.error(`Failed to upload file: ${filePath}`, error);
    return {
      success: false,
      message: `Failed to upload file: ${error instanceof Error ? error.message : String(error)}`,
      data: null,
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
