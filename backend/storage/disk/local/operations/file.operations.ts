import fs from "node:fs/promises";
import path from "node:path";
import { StorageDbRepository } from "@/backend/db/repo";
import logger from "@/backend/lib/logger";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import { extToMime } from "@/utils/storage.utils";
import { processFile } from "../shared";
import type { LocalContext } from "../types";
import { calculateFileHash, ensureDirectory, getAbsolutePath } from "../utils";

export async function fileExists(ctx: LocalContext, filePath: string): Promise<boolean> {
  try {
    const absolutePath = getAbsolutePath(ctx.basePath, filePath);
    await fs.access(absolutePath);
    const stats = await fs.stat(absolutePath);

    if (stats.isFile()) {
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
    }

    if (stats.isDirectory()) {
      const dbDirectory = await StorageDbRepository.directoryByPath(filePath);
      if (!dbDirectory) {
        logger.info(`Directory exists on disk without DB record: ${filePath}`);
      }
      return true;
    }

    return false;
  } catch (error) {
    logger.error(`Error checking file existence: ${filePath}`, error);
    return false;
  }
}

export async function fileInfoByPath(ctx: LocalContext, filePath: string): Promise<Types.FileInfo | null> {
  try {
    const absolutePath = getAbsolutePath(ctx.basePath, filePath);
    try {
      await fs.access(absolutePath);
    } catch {
      return null;
    }

    const stats = await fs.stat(absolutePath);
    if (!stats.isFile()) {
      return null;
    }

    const dbFile = await StorageDbRepository.fileByPath(filePath);
    return await processFile(ctx, filePath, dbFile ?? undefined);
  } catch (error) {
    logger.error(`Failed to get file info: ${filePath}`, error);
    return null;
  }
}

export async function fileInfoByDbFileId(ctx: LocalContext, id: bigint): Promise<Types.FileInfo | null> {
  try {
    const dbFile = await StorageDbRepository.fileById(id);
    if (!dbFile) {
      return null;
    }

    const absolutePath = getAbsolutePath(ctx.basePath, dbFile.path);
    try {
      await fs.access(absolutePath);
    } catch {
      return null;
    }

    const stats = await fs.stat(absolutePath);
    if (!stats.isFile()) {
      return null;
    }

    return await processFile(ctx, dbFile.path, dbFile);
  } catch (error) {
    logger.error(`Failed to get file info by id: ${id}`, error);
    return null;
  }
}

export async function renameFile(ctx: LocalContext, input: Types.FileRenameInput): Promise<Types.FileOperationResult> {
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

    const currentAbsolutePath = getAbsolutePath(ctx.basePath, input.currentPath);
    const newAbsolutePath = getAbsolutePath(ctx.basePath, newPath);

    await ensureDirectory(path.dirname(newAbsolutePath));
    await fs.rename(currentAbsolutePath, newAbsolutePath);

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

    const stats = await fs.stat(newAbsolutePath);
    const contentHash = await calculateFileHash(newAbsolutePath);

    const ext = path.extname(newPath).toLowerCase().slice(1);
    const contentType = extToMime[ext] || "application/octet-stream";

    const bucketFile: Types.BucketFile = {
      path: newPath,
      directoryPath,
      size: BigInt(stats.size),
      contentType,
      contentHash,
      createdAt: stats.birthtime,
      lastModified: stats.mtime,
      url: `${ctx.baseUrl}/api/storage/files/${newPath}`,
      mediaLink: undefined,
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
