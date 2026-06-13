import * as fs from "node:fs/promises";
import * as path from "node:path";
import logger from "@/backend/lib/logger";
import type * as Types from "@/backend/types";
import { extToMime } from "@/utils/storage.utils";
import { getStorageService, type StorageService } from "../storage.service";

/**
 * Interface for FileInitializationService
 */
export interface IFileInitializationService {
  /**
   * Initialize required directories and upload demo files
   */
  initializeFileSystem(): Promise<void>;

  /**
   * Create required directories in the storage system
   */
  createRequiredDirectories(): Promise<void>;

  /**
   * Create a directory if it doesn't exist
   */
  createDirectoryIfNotExists(input: Types.FolderCreateInput): Promise<void>;

  /**
   * Upload demo template files from resources
   */
  uploadDemoTemplateFiles(): Promise<void>;

  /**
   * Upload a demo file if it doesn't exist in storage
   */
  uploadDemoFileIfNotExists(fileName: string): Promise<void>;

  /**
   * Verify that all demo files are properly accessible in the bucket
   */
  verifyDemoFilesInDatabase(): Promise<void>;

  /**
   * Get demo files that are available for templates
   * Files are automatically registered in the database when uploaded via StorageService
   * This method retrieves their database IDs for use in templates
   */
  getTemplateCoverDemoFileIds(): Promise<string[]>;

  /**
   * Register file usage for template covers
   */
  registerTemplateFileUsage(templateId: string, fileId: string): Promise<void>;

  /**
   * Get content type from file name
   */
  getContentTypeFromFileName(fileName: string): string;
}

export class FileInitializationService implements IFileInitializationService {
  private readonly storageService: StorageService;

  constructor(storageService: StorageService) {
    this.storageService = storageService;
  }

  /**
   * Create a directory if it doesn't exist
   */
  async createDirectoryIfNotExists(input: Types.FolderCreateInput): Promise<void> {
    try {
      // Check if directory exists in storage
      const directoryInfo = await this.storageService.directoryInfoByPath(input.path);

      if (directoryInfo) {
        logger.info(`   📁 Directory already exists: ${input.path}`);
        return;
      }

      // Create the directory
      const result = await this.storageService.createFolder(input);

      if (result.success) {
        logger.info(`   📁 Created directory: ${input.path}`);
      } else {
        logger.warn(`   ⚠️  Warning: Could not create directory: ${input.path} - ${result.message}`);
      }
    } catch (error) {
      logger.error(`   ❌ Error creating directory ${input.path}:`, error);
      throw error;
    }
  }

  /**
   * Initialize required directories and upload demo files
   */
  async initializeFileSystem(): Promise<void> {
    logger.info("🗂️  Initializing file system...");

    // Create required directories
    await this.createRequiredDirectories();

    // Upload demo template files
    await this.uploadDemoTemplateFiles();

    logger.info("✅ File system initialization completed");
  }

  /**
   * Create required directories in the storage system
   */
  async createRequiredDirectories(): Promise<void> {
    const requiredDirectories: Types.FolderCreateInput[] = [
      { path: "public", protected: true },
      { path: "public/templates", protected: true },
      { path: "public/templates/covers", protected: true },
    ];

    for (const input of requiredDirectories) {
      await this.createDirectoryIfNotExists(input);
    }
  }

  /**
   * Upload demo template files from resources
   */
  async uploadDemoTemplateFiles(): Promise<void> {
    const demoFiles = ["demo1.jpg", "demo2.jpg", "demo3.jpg", "demo4.jpg"];

    for (const fileName of demoFiles) {
      await this.uploadDemoFileIfNotExists(fileName);
    }

    // After processing all files, verify they are in the database
    logger.info("   🔍 Verifying demo files are registered in database...");
    await this.verifyDemoFilesInDatabase();
  }

  /**
   * Upload a demo file if it doesn't exist in storage
   */
  async uploadDemoFileIfNotExists(fileName: string): Promise<void> {
    const bucketPath = `public/img/${fileName}`;

    try {
      // Check if file exists in storage
      const fileInfo = await this.storageService.fileInfoByPath(bucketPath);
      if (fileInfo) {
        logger.info(`   🖼️  Demo file already exists in bucket: ${fileName}`);
        return;
      }
    } catch (error) {
      logger.warn(
        `   ⚠️  Could not check bucket for file: ${fileName} - ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // Upload file from resources using StorageService
    try {
      const resourcePath = path.join(__dirname, "res", fileName);

      // Read file from disk
      const fileBuffer = await fs.readFile(resourcePath);
      const contentType = this.getContentTypeFromFileName(fileName);

      const result = await this.storageService.uploadFile(bucketPath, contentType, fileBuffer);

      if (result.success) {
        logger.info(`   🖼️  Uploaded demo file: ${fileName}`);
      } else {
        logger.error(`   ❌ Failed to upload demo file ${fileName}: ${result.message}`);
      }
    } catch (error) {
      const isNotFound = error instanceof Error && (error as NodeJS.ErrnoException).code === "ENOENT";
      if (isNotFound) {
        logger.error(`   ❌ Resource not found: ${fileName}`);
      } else {
        logger.error(`   ❌ Failed to upload demo file ${fileName}:`, error);
      }
    }
  }

  /**
   * Verify that all demo files are properly accessible in the bucket
   */
  async verifyDemoFilesInDatabase(): Promise<void> {
    const demoFiles = [
      { fileName: "demo1.jpg", bucketPath: "public/img/demo1.jpg" },
      { fileName: "demo2.jpg", bucketPath: "public/img/demo2.jpg" },
      { fileName: "demo3.jpg", bucketPath: "public/img/demo3.jpg" },
      { fileName: "demo4.jpg", bucketPath: "public/img/demo4.jpg" },
    ];

    for (const { fileName, bucketPath } of demoFiles) {
      try {
        const fileInfo = await this.storageService.fileInfoByPath(bucketPath);
        if (fileInfo) {
          logger.info(`   ✅ Demo file exists in bucket: ${fileName}`);
        } else {
          logger.error(`   ❌ Demo file NOT found in bucket: ${fileName}`);
        }
      } catch (error) {
        logger.error(`   ❌ Error checking demo file ${fileName}:`, error);
      }
    }
  }

  /**
   * Get demo files that are available for templates
   */
  async getTemplateCoverDemoFileIds(): Promise<string[]> {
    const demoFiles = ["public/img/demo1.jpg", "public/img/demo2.jpg", "public/img/demo3.jpg", "public/img/demo4.jpg"];

    logger.info("   🔍 Checking for demo files and registering as needed...");

    const fileIds: string[] = [];
    const { StorageDbRepository } = await import("@/backend/db/repo");

    for (const filePath of demoFiles) {
      try {
        // First check if already in DB
        const existingFile = await StorageDbRepository.fileByPath(filePath);

        if (existingFile) {
          logger.info(`   ✅ Found demo file in database: ${filePath} (ID: ${existingFile.id})`);
          fileIds.push(existingFile.id);
          continue;
        }

        // Check if exists in bucket and register it for use
        const fileInfo = await this.storageService.fileInfoByPath(filePath);

        if (fileInfo) {
          // File exists in bucket but not in database - register it
          const fileEntity = await StorageDbRepository.createFile(
            filePath,
            true // isProtected = true for demo files
          );

          logger.info(`   ✅ Registered demo file for use: ${filePath} (ID: ${fileEntity.id})`);
          fileIds.push(fileEntity.id);
        } else {
          logger.error(`   ❌ Demo file NOT found in bucket: ${filePath}`);
        }
      } catch (error) {
        logger.error(`   ❌ Error accessing demo file ${filePath}:`, error);
      }
    }

    logger.info(`   📊 Total demo files available: ${String(fileIds.length)} out of ${String(demoFiles.length)}`);
    return fileIds;
  }

  /**
   * Register file usage for template covers
   */
  async registerTemplateFileUsage(templateId: string, fileId: string): Promise<void> {
    try {
      const fileInfo = await this.storageService.fileInfoByDbFileId(fileId);

      if (fileInfo) {
        logger.info(`   📎 File ${fileId} (${fileInfo.path}) will be used for template ${templateId}`);
        logger.info(`   ℹ️  File usage tracking happens through template-file relationships`);
      } else {
        logger.warn(`   ⚠️  File with ID ${fileId} not found`);
      }
    } catch (error) {
      logger.error(`   ❌ Error accessing file ${fileId}:`, error);
    }
  }

  /**
   * Get content type from file name extension
   */
  getContentTypeFromFileName(fileName: string): string {
    const extension = fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
    return extToMime[extension] || "image/jpeg";
  }
}

/**
 * Factory function to create FileInitializationService instance
 */
export const createFileInitializationService = async (): Promise<FileInitializationService> => {
  const storageService = await getStorageService();
  return new FileInitializationService(storageService);
};
