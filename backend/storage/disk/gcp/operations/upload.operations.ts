import { StorageDbRepository } from "@/backend/db/repo/storage";
import { UploadType } from "@/backend/enum/storage";
import { logger } from "@/backend/lib/logger";
import type { GcpContext } from "@/backend/storage/disk/gcp/types";
import { prepareUploadHelper } from "@/backend/storage/disk/shared/upload-operations.helper";
import { STORAGE_CONFIG } from "@/backend/storage/disk/storage.service.interface";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import { type FileErrors, getServerTranslations } from "@/shared/locale";

/**
 * Prepares a signed URL for a direct client upload to GCP
 */
export async function prepareUpload(
  ctx: GcpContext,
  input: Types.UploadPreparationInput
): Promise<Types.UploadPreparationResult> {
  return prepareUploadHelper(input, async (sessionId, cleanedPath) => {
    const file = ctx.bucket.file(cleanedPath);

    const result = await file.getSignedUrl({
      version: "v4",
      expires: Date.now() + STORAGE_CONFIG.SIGNED_URL_DURATION * 60 * 1000,
      contentType: input.contentType,
      action: "write",
      contentMd5: input.contentHash,
    });

    logger.info("Prepared upload successfully", {
      uploadId: sessionId,
      path: cleanedPath,
      uploadType: UploadType.SIGNED_URL,
    });

    return {
      id: sessionId,
      url: result[0],
      uploadType: UploadType.SIGNED_URL,
    };
  });
}

/**
 * Check if upload is allowed to the specified directory
 */
async function checkUploadPermissions(
  ctx: GcpContext,
  directoryPath: string,
  tFile: FileErrors
): Promise<string | null> {
  if (directoryPath.length === 0) return null;

  const dbDirectory = await StorageDbRepository.directoryByPath(directoryPath);

  if (dbDirectory) {
    return dbDirectory.allowUploads ? null : tFile.uploadsNotAllowedInDirectory;
  }

  try {
    const folderBlob = `${directoryPath}/`;
    const [exists] = await ctx.bucket.file(folderBlob).exists();
    if (!exists) return tFile.directoryDoesNotExist;
  } catch {
    return tFile.directoryDoesNotExist;
  }

  return null;
}

/**
 * Get FileInfo for a newly uploaded file
 */
async function getUploadedFileInfo(
  ctx: GcpContext,
  path: string,
  dbFile: Types.FileSelectType
): Promise<Types.FileInfo> {
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
  buffer: Buffer,
  locale?: string
): Promise<Types.FileUploadResult> {
  const tFile = getServerTranslations(locale ?? "en").errorsTranslations.file;
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
    const permissionErr = await checkUploadPermissions(ctx, directoryPath, tFile);
    if (permissionErr) {
      return { success: false, message: permissionErr, data: null };
    }

    const file = ctx.bucket.file(path);
    await file.save(buffer, { contentType });

    const fileEntity = await StorageDbRepository.createFile(path, false);
    const fileInfo = await getUploadedFileInfo(ctx, path, fileEntity);

    return {
      success: true,
      message: tFile.fileUploadedSuccessfully,
      data: fileInfo,
    };
  } catch (error) {
    logger.error(`Failed to upload file: ${path}`, error);
    return {
      success: false,
      message: tFile.failedToUploadFile(error instanceof Error ? error.message : String(error)),
      data: null,
    };
  }
}
