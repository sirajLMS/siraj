import { OrderSortDirection } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { STORAGE_CONFIG } from "@/backend/storage/disk/storage.service.interface";
import * as Types from "@/backend/types";
import { isAllowedMimeType, validateFileName as sharedValidateFileName } from "@/shared/utils/storage.utils";

export namespace StorageUtils {
  const PATH_PATTERN = /^[a-zA-Z0-9._/\- ()]+$/;
  export const validatePath = (path: string): string | null => {
    if (!path || path.trim().length === 0) {
      return "Path cannot be empty";
    }
    if (path.includes("..") || path.includes("//")) {
      return "Path contains invalid directory traversal patterns";
    }
    if (/^[/\\]/.test(path)) {
      return "Absolute paths are not allowed";
    }
    if (path.includes("\0")) {
      return "Path contains null bytes";
    }
    if (!PATH_PATTERN.test(path)) {
      return "Path contains invalid characters";
    }
    if (path.length > 1024) {
      return "Path is too long (max 1024 characters)";
    }
    return null;
  };

  // Allow common file name characters: letters, numbers, spaces, parentheses, brackets, underscores, hyphens, periods
  export const validateFileName = sharedValidateFileName;

  export const validateFileSize = (size: number): string | null => {
    if (size > STORAGE_CONFIG.MAX_FILE_SIZE) {
      return `File size exceeds maximum allowed size (${STORAGE_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB)`;
    }
    return null;
  };

  export interface UploadValidationOptions {
    path: string;
    size: number;
    contentType: string;
  }

  export const validateUpload = (options: UploadValidationOptions): string | null => {
    const { path, size, contentType } = options;
    const errors: string[] = [];

    const fileName = path.slice(path.lastIndexOf("/") + 1);
    const fileNameErr = validateFileName(fileName);
    if (fileNameErr) errors.push(fileNameErr);

    const pathErr = validatePath(path);
    if (pathErr) errors.push(pathErr);

    const sizeErr = validateFileSize(size);
    if (sizeErr) errors.push(sizeErr);

    if (!isAllowedMimeType(contentType)) {
      errors.push(`${contentType} is not a allowed MIME type`);
    }

    return errors.length > 0 ? errors.join("\n") : null;
  };

  export const getFileTypeFromContentType = (contentType?: string): Types.FileTypes => {
    if (!contentType) return Types.FileTypes.OTHER;

    if (contentType.startsWith("image/")) return Types.FileTypes.IMAGE;
    if (contentType.startsWith("video/")) return Types.FileTypes.VIDEO;
    if (contentType.startsWith("audio/")) return Types.FileTypes.AUDIO;
    if (contentType.includes("pdf") || contentType.includes("document") || contentType.includes("text"))
      return Types.FileTypes.DOCUMENT;
    if (contentType.includes("zip") || contentType.includes("rar")) return Types.FileTypes.ARCHIVE;

    // fonts
    if (contentType.includes("font")) return Types.FileTypes.FONT;

    return Types.FileTypes.OTHER;
  };

  export const extractDirectoryPath = (filePath: string): string => {
    const lastSlashIndex = filePath.lastIndexOf("/");
    return lastSlashIndex > 0 ? filePath.substring(0, lastSlashIndex) : "";
  };

  export const extractFileName = (filePath: string): string => {
    const lastSlashIndex = filePath.lastIndexOf("/");
    return lastSlashIndex >= 0 ? filePath.substring(lastSlashIndex + 1) : filePath;
  };

  export const sanitizePath = (path: string): string => {
    return path
      .replaceAll("\0", "")
      .replaceAll("\\", "/")
      .replaceAll(/\/\/+/g, "/")
      .replaceAll(/(?:^\/|\/(?=$))/g, "");
  };

  export const blobToFileInfo = (blob: Types.BlobMetadata, baseUrl: string): Types.BucketFile => {
    const path = blob.name ?? "";
    const size = BigInt(blob.size ?? 0);
    const contentType = blob.contentType;
    const createdAt = blob.timeCreated ? new Date(blob.timeCreated) : new Date();
    const lastModified = blob.updated ? new Date(blob.updated) : new Date();
    const url = `${baseUrl}${path}`;
    const mediaLink = blob.mediaLink;
    const fileType = getFileTypeFromContentType(contentType);
    const isPublic = path.startsWith("public");

    return {
      path,
      directoryPath: extractDirectoryPath(path),
      size,
      contentType,
      contentHash: blob.contentHash,
      createdAt,
      lastModified,
      url,
      mediaLink,
      fileType,
      isPublic,
    };
  };

  export const blobToDirectoryInfo = (blob: Types.BlobMetadata): Types.BucketDirectory => {
    const path = (blob.name ?? "").replace(/\/$/, "");
    const createdAt = blob.timeCreated ? new Date(blob.timeCreated) : new Date();
    const lastModified = blob.updated ? new Date(blob.updated) : new Date();
    const isPublic = path.startsWith("public");

    return {
      path,
      createdAt,
      lastModified,
      isPublic,
    };
  };

  export const combineDirectoryData = (
    bucketDir: Types.BucketDirectory,
    dbEntity?: Types.DirectoryEntity | null,
    fileCount: number = 0
  ): Types.DirectoryInfo => {
    const permissions: Types.DirectoryPermissions = dbEntity
      ? {
          allowUploads: dbEntity.allowUploads,
          allowDelete: dbEntity.allowDelete,
          allowMove: dbEntity.allowMove,
          allowCreateSubDirs: dbEntity.allowCreateSubDirs,
          allowDeleteFiles: dbEntity.allowDeleteFiles,
          allowMoveFiles: dbEntity.allowMoveFiles,
        }
      : {
          allowUploads: true,
          allowDelete: true,
          allowMove: true,
          allowCreateSubDirs: true,
          allowDeleteFiles: true,
          allowMoveFiles: true,
        };

    const result: Types.DirectoryInfo = {
      dbId: dbEntity?.id,
      path: bucketDir.path,
      name: extractFileName(bucketDir.path),
      isProtected: dbEntity?.isProtected ?? false,
      permissions: permissions,
      protectChildren: dbEntity?.protectChildren ?? false,
      createdAt: bucketDir.createdAt,
      lastModified: bucketDir.lastModified,
      fileCount: fileCount,
      isFromBucket: true,
      isPublic: bucketDir.isPublic,
      // Future: Implement recursive folder count and total size calculation for directories
      folderCount: 0,
      totalSize: 0,
    };
    return result;
  };

  export const combineFileData = (bucketFile: Types.BucketFile, dbEntity?: Types.FileEntity | null): Types.FileInfo => {
    const usages: Types.FileUsageInfo[] = [];
    const isProtected = dbEntity?.isProtected ?? false;

    const result: Types.FileInfo = {
      dbId: dbEntity?.id,
      path: bucketFile.path,
      name: extractFileName(bucketFile.path),
      isProtected,
      directoryPath: bucketFile.directoryPath,
      size: bucketFile.size,
      contentType: bucketFile.contentType,
      contentHash: bucketFile.contentHash,
      createdAt: bucketFile.createdAt,
      lastModified: bucketFile.lastModified,
      url: bucketFile.url,
      mediaLink: bucketFile.mediaLink,
      fileType: bucketFile.fileType,
      isPublic: bucketFile.isPublic,
      isFromBucket: true,
      usages: usages,
      isInUse: usages.length > 0,
    };

    return result;
  };

  export const createDirectoryFromPath = (path: string): Types.DirectoryInfo => {
    const now = new Date();
    const result: Types.DirectoryInfo = {
      path: path,
      name: extractFileName(path),
      isProtected: false,
      permissions: {
        allowUploads: true,
        allowDelete: true,
        allowMove: true,
        allowCreateSubDirs: true,
        allowDeleteFiles: true,
        allowMoveFiles: true,
      },
      protectChildren: false,
      createdAt: now,
      lastModified: now,
      fileCount: 0,
      isFromBucket: false,
      isPublic: path.startsWith("public"),
      // Future: Implement recursive folder count and total size calculation for new directory objects
      folderCount: 0,
      totalSize: 0,
    };

    return result;
  };

  /**
   * Filter storage items by file types and content types
   */
  export const filterStorageItems = (
    items: Array<Types.FileInfo | Types.DirectoryInfo>,
    filters: {
      includeDirectories?: boolean | null;
      fileType?: string | null;
      fileTypes?: string[] | null;
      contentTypes?: string[] | null;
    }
  ): Array<Types.FileInfo | Types.DirectoryInfo> => {
    logger.info("[StorageUtils] filterStorageItems", { filters });
    logger.info("[StorageUtils] items", { items });
    const itemTypes = new Set<string>();

    let filtered = items;

    // Filter directories if includeDirectories is explicitly false
    if (filters.includeDirectories === false) {
      filtered = filtered.filter(item => "fileType" in item);
    }

    // Filter by multiple file types (NEW)
    if (filters.fileTypes && filters.fileTypes.length > 0) {
      filtered = filtered.filter(item => {
        if ("fileType" in item) {
          itemTypes.add(item.fileType);
          return filters.fileTypes?.includes(item.fileType);
        }
        // If includeDirectories is true, allow directories to pass through
        return filters.includeDirectories === true;
      });
    }

    // Filter by multiple content types (NEW)
    if (filters.contentTypes && filters.contentTypes.length > 0) {
      filtered = filtered.filter(item => {
        if ("contentType" in item && item.contentType) {
          itemTypes.add(item.contentType);
          return filters.contentTypes?.includes(item.contentType);
        }
        // If includeDirectories is true, allow directories to pass through
        return filters.includeDirectories === true;
      });
    }

    // Keep backward compatibility with single fileType
    if (filters.fileType) {
      filtered = filtered.filter(item => {
        if ("fileType" in item) {
          itemTypes.add(item.fileType);
          return item.fileType === filters.fileType;
        }
        // If includeDirectories is true, allow directories to pass through
        return filters.includeDirectories === true;
      });
    }

    logger.info("[StorageUtils] itemTypes", { itemTypes });

    logger.info("[StorageUtils] filtered", { filtered });

    return filtered;
  };

  export const sortItems = (
    items: Array<Types.FileInfo | Types.DirectoryInfo>,
    sortBy: Types.FileSortField,
    direction: OrderSortDirection
  ): Array<Types.FileInfo | Types.DirectoryInfo> => {
    const sorted = [...items].toSorted((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case Types.FileSortField.NAME:
          comparison = a.name.localeCompare(b.name);
          break;
        case Types.FileSortField.SIZE: {
          const sizeA = "size" in a ? Number(a.size) : 0;
          const sizeB = "size" in b ? Number(b.size) : 0;
          comparison = sizeA - sizeB;
          break;
        }
        case Types.FileSortField.TYPE: {
          const typeA = "fileType" in a ? a.fileType : "DIRECTORY";
          const typeB = "fileType" in b ? b.fileType : "DIRECTORY";
          comparison = typeA.localeCompare(typeB);
          break;
        }
        case Types.FileSortField.CREATED:
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case Types.FileSortField.MODIFIED:
          comparison = a.lastModified.getTime() - b.lastModified.getTime();
          break;
      }

      return direction === OrderSortDirection.ASC ? comparison : -comparison;
    });

    return sorted;
  };
}
