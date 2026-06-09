import crypto from "node:crypto";
import { put } from "@vercel/blob";
import { SignedUrlRepository, StorageDbRepository } from "@/backend/db/repo";
import logger from "@/backend/lib/logger";
import * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import { STORAGE_CONFIG, StorageValidationError } from "../../storage.service.interface";
import type { VercelContext } from "../types";
import { calculateHash, cleanVercelPath } from "../utils";

export async function prepareUpload(
  ctx: VercelContext,
  input: Types.UploadPreparationInput
): Promise<Types.UploadPreparationResult> {
  try {
    const cleanedPath = cleanVercelPath(input.path);
    const mimeType = input.contentType;

    logger.info("🔍 [VERCEL DEBUG] Preparing upload", {
      path: cleanedPath,
      fileSize: input.fileSize,
      contentType: mimeType,
      contentHash: input.contentHash,
    });

    const validationError = await StorageUtils.validateUpload(cleanedPath, input.fileSize, mimeType);
    if (validationError) {
      throw new StorageValidationError(validationError);
    }

    const cleanupStrategy = process.env.SIGNED_URL_CLEANUP_STRATEGY || "lazy";
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

    logger.info("🔍 [VERCEL DEBUG] Stored upload session in database", {
      sessionId,
      filePath: cleanedPath,
      storedContentType: mimeType,
      storedFileSize: input.fileSize,
      storedContentMd5: input.contentHash,
      expiresAt,
    });

    const result: Types.UploadPreparationResult = {
      id: sessionId,
      url: `${ctx.baseUrl}/api/storage/vercel-upload`,
      uploadType: Types.UploadType.VERCEL_BLOB_CLIENT,
    };

    logger.info("Prepared Vercel upload successfully", {
      sessionId,
      path: cleanedPath,
      uploadType: "VERCEL",
      expiresAt,
    });

    return result;
  } catch (error) {
    logger.error("Failed to prepare Vercel upload", {
      path: input.path,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

export async function uploadFile(
  ctx: VercelContext,
  filePath: string,
  contentType: string,
  buffer: Buffer
): Promise<Types.FileUploadResult> {
  try {
    const cleanedFilePath = cleanVercelPath(filePath);
    const fileSize = buffer.byteLength;

    const validationError = await StorageUtils.validateUpload(filePath, fileSize, contentType);
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

    logger.info("📤 uploadFile: Uploading to Vercel Blob", {
      filePath: cleanedFilePath,
      size: fileSize,
      contentType,
    });

    const blob = await put(cleanedFilePath, buffer, {
      token: ctx.token,
      contentType: contentType,
      access: "public",
    });

    logger.info("📤 uploadFile: Upload to Vercel Blob successful", {
      url: blob.url,
      pathname: blob.pathname,
    });

    logger.info("💾 uploadFile: Creating file entity in database", {
      filePath: cleanedFilePath,
    });
    const fileEntity = await StorageDbRepository.createFile(cleanedFilePath, false);
    logger.info("💾 uploadFile: File entity created successfully", {
      fileEntity,
    });

    const fileHash = calculateHash(buffer);
    const uploadedAt = new Date();

    const bucketFile: Types.BucketFile = {
      path: cleanedFilePath,
      directoryPath,
      size: BigInt(fileSize),
      contentType: contentType,
      contentHash: fileHash,
      createdAt: uploadedAt,
      lastModified: uploadedAt,
      url: blob.url,
      mediaLink: blob.url,
      fileType: StorageUtils.getFileTypeFromContentType(contentType),
      isPublic: cleanedFilePath.startsWith("public"),
    };

    const fileInfo = StorageUtils.combineFileData(bucketFile, fileEntity);

    return {
      success: true,
      message: "File uploaded successfully",
      data: fileInfo,
    };
  } catch (error) {
    const errorPath = filePath;
    logger.error(`Failed to upload file: ${errorPath}`, error);
    return {
      success: false,
      message: `Failed to upload file: ${error instanceof Error ? error.message : String(error)}`,
      data: null,
    };
  }
}
