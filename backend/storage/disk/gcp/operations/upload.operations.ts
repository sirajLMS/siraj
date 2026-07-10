import crypto from "node:crypto";
import { StorageDbRepository } from "@/backend/db/repo";
import logger from "@/backend/lib/logger";
import type { GcpContext } from "@/backend/storage/disk/gcp/types";
import { STORAGE_CONFIG, StorageValidationError } from "@/backend/storage/disk/storage.service.interface";
import * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";

/**
 * Prepares a signed URL for a direct client upload to GCP
 */
export async function prepareUpload(
  ctx: GcpContext,
  input: Types.UploadPreparationInput
): Promise<Types.UploadPreparationResult> {
  try {
    logger.info("Preparing upload", {
      path: input.path,
      fileSize: input.fileSize,
    });

    const uploadErr = StorageUtils.validateUpload({
      path: input.path,
      size: input.fileSize,
      contentType: input.contentType,
    });
    if (uploadErr) {
      throw new StorageValidationError(uploadErr);
    }

    const file = ctx.bucket.file(input.path);

    const result = await file.getSignedUrl({
      version: "v4",
      expires: Date.now() + STORAGE_CONFIG.SIGNED_URL_DURATION * 60 * 1000,
      contentType: input.contentType,
      action: "write",
      contentMd5: input.contentHash,
    });

    const signedUrl = result[0];

    // Generate a unique ID for tracking this upload
    const uploadId = crypto.randomUUID();

    logger.info("Prepared upload successfully", {
      uploadId,
      path: input.path,
      uploadType: Types.UploadType.SIGNED_URL,
    });

    return {
      id: uploadId,
      url: signedUrl,
      uploadType: Types.UploadType.SIGNED_URL,
    };
  } catch (error) {
    logger.error("Failed to prepare upload", {
      path: input.path,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

/**
 * Check if upload is allowed to the specified directory
 */
async function checkUploadPermissions(ctx: GcpContext, directoryPath: string): Promise<string | null> {
  if (directoryPath.length === 0) return null;

  const dbDirectory = await StorageDbRepository.directoryByPath(directoryPath);

  if (dbDirectory) {
    return dbDirectory.allowUploads ? null : "Uploads not allowed in this directory";
  }

  try {
    const folderBlob = `${directoryPath}/`;
    const [exists] = await ctx.bucket.file(folderBlob).exists();
    if (!exists) return "Directory does not exist";
  } catch {
    return "Directory does not exist";
  }

  return null;
}

/**
 * Get FileInfo for a newly uploaded file
 */
async function getUploadedFileInfo(ctx: GcpContext, path: string, dbFile: Types.FileEntity): Promise<Types.FileInfo> {
  const [metadata] = await ctx.bucket.file(path).getMetadata();
  const bucketFile = StorageUtils.blobToFileInfo(metadata, ctx.gcpBaseUrl);
  return StorageUtils.combineFileData(bucketFile, dbFile);
}

/**
 * Upload a file directly to GCP from a buffer
 */
export async function uploadFile(
  ctx: GcpContext,
  path: string,
  contentType: string,
  buffer: Buffer
): Promise<Types.FileUploadResult> {
  try {
    const fileSize = buffer.byteLength;

    const uploadErr = StorageUtils.validateUpload({
      path,
      size: fileSize,
      contentType,
    });
    if (uploadErr) {
      return { success: false, message: uploadErr, data: null };
    }

    const directoryPath = path.substring(0, path.lastIndexOf("/"));
    const permissionErr = await checkUploadPermissions(ctx, directoryPath);
    if (permissionErr) {
      return { success: false, message: permissionErr, data: null };
    }

    const file = ctx.bucket.file(path);
    await file.save(buffer, { contentType });

    const fileEntity = await StorageDbRepository.createFile(path, false);
    const fileInfo = await getUploadedFileInfo(ctx, path, fileEntity);

    return {
      success: true,
      message: "File uploaded successfully",
      data: fileInfo,
    };
  } catch (error) {
    logger.error(`Failed to upload file: ${path}`, error);
    return {
      success: false,
      message: `Failed to upload file: ${error instanceof Error ? error.message : String(error)}`,
      data: null,
    };
  }
}
