import { StorageDbRepository } from "@/backend/db/repo/storage";
import { fileExists, fileInfoByPath } from "@/backend/storage/disk/gcp/operations/file.operations";
import { directoryInfoByPath } from "@/backend/storage/disk/gcp/operations/folder.operations";
import type { GcpContext, GenericOperationResult } from "@/backend/storage/disk/gcp/types";
import { formatBulkOperationResult, validateBulkOperation } from "@/backend/storage/disk/shared/bulk-operations.helper";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";

/**
 * Move multiple items in GCP storage
 */
export async function moveItems(
  ctx: GcpContext,
  input: Types.StorageItemsMoveInput
): Promise<Types.BulkOperationResult> {
  const { validSources, failures, destDirAllowed } = await validateBulkOperation(
    ctx,
    input.sourcePaths,
    input.destinationPath,
    fileExists
  );

  let successCount = 0;
  const successfulItems: Array<Types.FileInfo | Types.DirectoryInfo> = [];

  if (validSources.length === 0) {
    return formatBulkOperationResult(successCount, failures, successfulItems, "moved");
  }

  const sourceDirectories = [...new Set(validSources.map(path => path.substring(0, path.lastIndexOf("/"))))];

  const [dbFiles, dbDirectories, dbSourceDirs] = await Promise.all([
    StorageDbRepository.filesByPaths(validSources),
    StorageDbRepository.directoriesByPaths(validSources),
    StorageDbRepository.directoriesByPaths(sourceDirectories),
  ]);

  const dbFileMap = new Map<string, Types.FileSelectType>(dbFiles.map(f => [f.path, f]));
  const dbDirectoryMap = new Map<string, Types.DirectorySelectType>(dbDirectories.map(d => [d.path, d]));
  const dbSourceDirMap = new Map<string, Types.DirectorySelectType>(dbSourceDirs.map(d => [d.path, d]));

  if (!destDirAllowed) {
    return {
      success: false,
      message: "Uploads not allowed to destination directory",
      successCount: 0,
      failureCount: validSources.length,
      failures: validSources.map(path => ({
        path,
        error: "Uploads not allowed to destination directory",
      })),
      successfulItems: [],
    };
  }

  const results = await Promise.all(
    validSources.map(async sourcePath => {
      const result = await moveSingleItem(ctx, {
        sourcePath,
        destinationPath: input.destinationPath,
        dbFile: dbFileMap.get(sourcePath),
        dbDirectory: dbDirectoryMap.get(sourcePath),
        dbSourceDir: dbSourceDirMap.get(sourcePath.substring(0, sourcePath.lastIndexOf("/"))),
      });
      return { sourcePath, result };
    })
  );

  for (const { sourcePath, result } of results) {
    if (result.success && result.data) {
      successCount++;
      successfulItems.push(result.data);
    } else {
      failures.push({
        path: sourcePath,
        error: result.message ?? "Unknown error",
      });
    }
  }

  return formatBulkOperationResult(successCount, failures, successfulItems, "moved");
}

/**
 * Options for moving a single item
 */
interface MoveSingleItemOptions {
  sourcePath: string;
  destinationPath: string;
  dbFile?: Types.FileSelectType;
  dbDirectory?: Types.DirectorySelectType;
  dbSourceDir?: Types.DirectorySelectType;
}

/**
 * Move a single file or directory in GCS and update database
 */
async function moveSingleItem(
  ctx: GcpContext,
  options: MoveSingleItemOptions
): Promise<GenericOperationResult<Types.FileInfo | Types.DirectoryInfo>> {
  const { sourcePath, destinationPath, dbFile, dbDirectory, dbSourceDir } = options;

  try {
    const sourceDir = sourcePath.substring(0, sourcePath.lastIndexOf("/"));
    if (dbSourceDir && !dbSourceDir.allowMove) {
      return {
        success: false,
        message: `Move not allowed from directory: ${sourceDir}`,
      };
    }

    const fileName = StorageUtils.extractFileName(sourcePath);
    const newPath = `${destinationPath.replace(/\/$/, "")}/${fileName}`;

    const sourceFile = ctx.bucket.file(sourcePath);
    const destFile = ctx.bucket.file(newPath);
    await sourceFile.copy(destFile);
    await sourceFile.delete();

    let updatedItem: Types.FileInfo | Types.DirectoryInfo | null = null;

    if (dbFile) {
      await StorageDbRepository.updateFile({
        id: dbFile.id,
        path: newPath,
        isProtected: dbFile.isProtected,
      });
      updatedItem = await fileInfoByPath(ctx, newPath);
    } else if (dbDirectory) {
      await StorageDbRepository.updateDirectory({
        ...dbDirectory,
        path: newPath,
      });
      updatedItem = await directoryInfoByPath(ctx, newPath);
    } else {
      updatedItem = await fileInfoByPath(ctx, newPath);
    }

    return updatedItem
      ? { success: true, data: updatedItem }
      : { success: false, message: "Failed to retrieve moved item info" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
