import { StorageDbRepository } from "@/backend/db/repo";
import logger from "@/backend/lib/logger";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import type { GcpContext } from "../types";

export async function fileExists(ctx: GcpContext, path: string): Promise<boolean> {
  try {
    const file = ctx.bucket.file(path);
    const [exists] = await file.exists();
    return exists;
  } catch (error) {
    logger.error(`Error checking file existence: ${path}`, error);
    return false;
  }
}

export async function fileInfoByPath(ctx: GcpContext, path: string): Promise<Types.FileInfo | null> {
  try {
    const file = ctx.bucket.file(path);
    const [exists] = await file.exists();

    if (!exists) {
      return null;
    }

    const [metadata] = await file.getMetadata();
    const bucketFile = StorageUtils.blobToFileInfo(metadata, ctx.gcpBaseUrl);
    const dbFile = await StorageDbRepository.fileByPath(path);

    return StorageUtils.combineFileData(bucketFile, dbFile);
  } catch (error) {
    logger.error(`Failed to get file info: ${path}`, error);
    return null;
  }
}

export async function fileInfoByDbFileId(ctx: GcpContext, id: string): Promise<Types.FileInfo | null> {
  try {
    const dbFile = await StorageDbRepository.fileById(id);
    if (!dbFile) {
      return null;
    }

    const file = ctx.bucket.file(dbFile.path);
    const [exists] = await file.exists();

    if (!exists) {
      return null;
    }

    const [metadata] = await file.getMetadata();
    const bucketFile = StorageUtils.blobToFileInfo(metadata, ctx.gcpBaseUrl);

    return StorageUtils.combineFileData(bucketFile, dbFile);
  } catch (error) {
    logger.error(`Failed to get file info by id: ${id}`, error);
    return null;
  }
}

export async function renameFile(ctx: GcpContext, input: Types.FileRenameInput): Promise<Types.FileOperationResult> {
  try {
    const pathErr = StorageUtils.validatePath(input.currentPath);
    if (pathErr) {
      return {
        success: false,
        message: pathErr,
      };
    }

    const nameErr = StorageUtils.validateFileName(input.newName);
    if (nameErr) {
      return {
        success: false,
        message: nameErr,
      };
    }

    const directoryPath = StorageUtils.extractDirectoryPath(input.currentPath);

    const newPath = `${directoryPath}/${input.newName}`;

    // Copy to new location
    const sourceFile = ctx.bucket.file(input.currentPath);
    const destFile = ctx.bucket.file(newPath);
    await sourceFile.move(destFile);

    // Update database
    let fileEntity: Types.FileEntity | undefined;
    try {
      const dbFile = await StorageDbRepository.fileByPath(input.currentPath);
      if (dbFile) {
        const updatedFile = { ...dbFile, path: newPath };
        fileEntity = await StorageDbRepository.updateFile(updatedFile);
      }
    } catch {
      // Ignore DB update errors
    }

    const [metadata] = await destFile.getMetadata();
    const bucketFile = StorageUtils.blobToFileInfo(metadata, ctx.gcpBaseUrl);

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
