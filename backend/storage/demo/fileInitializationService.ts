import * as fs from "node:fs/promises";
import * as path from "node:path";
import { StorageDbRepository } from "@/backend/db/repo";
import logger from "@/backend/lib/logger";
import { getStorageService, type StorageService } from "@/backend/storage/storage.service";
import type { FileOperationResult, FileUploadResult, FolderCreateInput } from "@/backend/types";
import { extToMime } from "@/shared/utils/storage.utils";

export interface FileSeedInput {
  /**
   * The destination path in the storage bucket (e.g. "public/docs/handbook.pdf")
   */
  bucketPath: string;
  /**
   * The absolute path to the local file to upload (or relative to the current execution directory)
   */
  localFilePath: string;
  /**
   * Optional content type. If not provided, it will be inferred from the file extension.
   */
  contentType?: string;
}

export interface IFileSeedingService {
  /**
   * Ensures that a directory exists in the storage system.
   */
  ensureDirectory(path: string, isProtected?: boolean): Promise<FileOperationResult>;

  /**
   * Seeds a single file to storage from a local file path if it doesn't already exist.
   */
  seedFile(input: FileSeedInput): Promise<FileUploadResult>;

  /**
   * Seeds multiple files in sequence.
   */
  seedFiles(inputs: FileSeedInput[]): Promise<FileUploadResult[]>;
}

export class FileSeedingService implements IFileSeedingService {
  private readonly storageService: StorageService;

  constructor(storageService: StorageService) {
    this.storageService = storageService;
  }

  /**
   * Ensures that a directory exists in the storage system.
   */
  async ensureDirectory(path: string, isProtected = true): Promise<FileOperationResult> {
    try {
      const directoryInfo = await this.storageService.directoryInfoByPath(path);
      const dbRecord = await StorageDbRepository.directoryByPath(path);

      if (directoryInfo && dbRecord) {
        return { success: true, message: `Directory already exists: ${path}` };
      }

      if (directoryInfo && !dbRecord) {
        await StorageDbRepository.ensureDirectoryRecord({ path, protected: isProtected });
        logger.info(`   📁 Synced directory DB record: ${path}`);
        return { success: true, message: `Directory DB record synced: ${path}` };
      }

      const input: FolderCreateInput = {
        path,
        protected: isProtected,
      };

      const result = await this.storageService.createFolder(input);
      if (result.success) {
        logger.info(`   📁 Created directory: ${path}`);
      } else {
        logger.warn(`   ⚠️  Could not create directory: ${path} - ${result.message}`);
      }
      return result;
    } catch (error) {
      logger.error(`   ❌ Error ensuring directory ${path}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Seeds a single file to storage from a local file path if it doesn't already exist.
   */
  async seedFile(input: FileSeedInput): Promise<FileUploadResult> {
    const { bucketPath, localFilePath, contentType } = input;

    try {
      // 1. Check if file already exists in storage
      const fileInfo = await this.storageService.fileInfoByPath(bucketPath);
      if (fileInfo?.url) {
        return {
          success: true,
          message: `File already exists in storage: ${bucketPath}`,
        };
      }
    } catch (error) {
      logger.warn(
        `   ⚠️  Could not check storage for ${bucketPath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    try {
      // 2. Read local file from disk
      const resolvedPath = path.resolve(localFilePath);
      const fileBuffer = await fs.readFile(resolvedPath);

      // 3. Detect mime type if not provided
      const finalContentType = contentType || this.getContentTypeFromFileName(bucketPath) || "application/octet-stream";

      // 4. Upload file using StorageService
      const result = await this.storageService.uploadFile(bucketPath, finalContentType, fileBuffer);
      if (result.success) {
        logger.info(`   📄 Seeded file to storage: ${bucketPath}`);
      } else {
        logger.error(`   ❌ Failed to seed file ${bucketPath}: ${result.message}`);
      }
      return result;
    } catch (error) {
      logger.error(`   ❌ Error seeding file ${bucketPath}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Seeds multiple files in sequence.
   */
  async seedFiles(inputs: FileSeedInput[]): Promise<FileUploadResult[]> {
    const results: FileUploadResult[] = [];
    for (const input of inputs) {
      const result = await this.seedFile(input);
      results.push(result);
    }
    return results;
  }

  private getContentTypeFromFileName(fileName: string): string {
    const extension = fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
    return extToMime[extension] || "application/octet-stream";
  }
}

/**
 * Factory function to create FileSeedingService instance
 */
export const createFileSeedingService = async (): Promise<IFileSeedingService> => {
  const storageService = await getStorageService();
  return new FileSeedingService(storageService);
};
