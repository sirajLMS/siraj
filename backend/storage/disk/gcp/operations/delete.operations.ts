import { StorageDbRepository } from "@/backend/db/repo";
import { logger } from "@/backend/lib/logger";
import { fileInfoByPath } from "@/backend/storage/disk/gcp/operations/file.operations";
import { directoryInfoByPath } from "@/backend/storage/disk/gcp/operations/folder.operations";
import type { GcpContext, GenericOperationResult } from "@/backend/storage/disk/gcp/types";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";

export async function deleteFile(ctx: GcpContext, path: string): Promise<Types.FileOperationResult> {
  try {
    const pathErr = StorageUtils.validatePath(path);
    if (pathErr) {
      return {
        success: false,
        message: pathErr,
      };
    }

    const usageCheck = await StorageDbRepository.checkFileUsage({ path: path });
    if (usageCheck.isInUse) {
      return {
        success: false,
        message: usageCheck.deleteBlockReason || "File is in use",
      };
    }

    const dbFile = await StorageDbRepository.fileByPath(path);
    if (dbFile?.isProtected === true) {
      return {
        success: false,
        message: "File is protected from deletion",
      };
    }

    const parentPath = path.substring(0, path.lastIndexOf("/"));
    const parentDir = await StorageDbRepository.directoryByPath(parentPath);
    if (parentDir && !parentDir.allowDeleteFiles) {
      return {
        success: false,
        message: "File deletion not allowed in this directory",
      };
    }

    const file = ctx.bucket.file(path);
    await file.delete();

    try {
      await StorageDbRepository.deleteFile(path);
    } catch {
      // Ignore DB deletion errors
    }

    return {
      success: true,
      message: "File deleted successfully",
    };
  } catch (error) {
    logger.error(`Failed to delete file: ${path}`, error);
    return {
      success: false,
      message: `Failed to delete file: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function deleteItems(
  ctx: GcpContext,
  input: Types.StorageItemsDeleteInput
): Promise<Types.BulkOperationResult> {
  let successCount = 0;
  let failureCount = 0;
  const failures: Array<{ path: string; error: string }> = [];
  const successfulItems: Array<Types.FileInfo | Types.DirectoryInfo> = [];

  const context = await getDeleteContext(input.paths, input.force || false);

  for (const path of input.paths) {
    const result: GenericOperationResult<Types.FileInfo | Types.DirectoryInfo> = await deleteSingleItem(ctx, {
      path,
      force: input.force || false,
      dbFile: context.dbFileMap.get(path),
      dbDirectory: context.dbDirectoryMap.get(path),
      parentDir: context.dbParentDirMap.get(path.substring(0, path.lastIndexOf("/"))),
      usageCheck: context.usageCheckMap.get(path),
    });

    if (result.success && result.data) {
      successCount++;
      successfulItems.push(result.data);
    } else {
      failureCount++;
      failures.push({ path, error: result.message || "Unknown error" });
    }
  }

  return {
    success: failureCount === 0,
    message:
      failureCount === 0 ? "All items deleted successfully" : `${successCount} items deleted, ${failureCount} failed`,
    successCount,
    failureCount,
    failures,
    successfulItems,
  };
}

async function getDeleteContext(paths: string[], force: boolean) {
  const parentDirectories = [...new Set(paths.map(path => path.substring(0, path.lastIndexOf("/"))))];

  const [dbFiles, dbDirectories, dbParentDirs, usageChecks] = await Promise.all([
    StorageDbRepository.filesByPaths(paths),
    StorageDbRepository.directoriesByPaths(paths),
    StorageDbRepository.directoriesByPaths(parentDirectories),
    force
      ? Promise.resolve([] as Array<Types.FileUsageResult & { path: string }>)
      : Promise.all(
          paths.map(path =>
            StorageDbRepository.checkFileUsage({ path })
              .then(result => ({ path, ...result }))
              .catch(() => ({
                path,
                isInUse: false,
                deleteBlockReason: undefined,
                usages: [],
                canDelete: true,
              }))
          )
        ),
  ]);

  return {
    dbFileMap: new Map<string, Types.FileEntity>(dbFiles.map(f => [f.path, f])),
    dbDirectoryMap: new Map<string, Types.DirectoryEntity>(dbDirectories.map(d => [d.path, d])),
    dbParentDirMap: new Map<string, Types.DirectoryEntity>(dbParentDirs.map(d => [d.path, d])),
    usageCheckMap: new Map<string, Types.FileUsageResult>(usageChecks.map(c => [c.path, c])),
  };
}

async function deleteSingleItem(
  ctx: GcpContext,
  params: {
    path: string;
    force: boolean;
    dbFile?: Types.FileEntity;
    dbDirectory?: Types.DirectoryEntity;
    parentDir?: Types.DirectoryEntity;
    usageCheck?: Types.FileUsageResult;
  }
): Promise<GenericOperationResult<Types.FileInfo | Types.DirectoryInfo>> {
  const { path, force, dbFile, dbDirectory, parentDir, usageCheck } = params;

  try {
    if (!force && usageCheck?.isInUse) {
      return {
        success: false,
        message: usageCheck.deleteBlockReason || "File is currently in use",
      };
    }

    if (dbFile?.isProtected === true || dbDirectory?.isProtected === true) {
      return { success: false, message: "Item is protected from deletion" };
    }

    if (parentDir) {
      const isFile = dbFile != null;
      const canDelete = isFile ? parentDir.allowDeleteFiles : parentDir.allowDelete;
      if (!canDelete) {
        return {
          success: false,
          message: "Deletion not allowed in parent directory",
        };
      }
    }

    const fileEntity = await fileInfoByPath(ctx, path);
    const folderEntity = fileEntity ? null : await directoryInfoByPath(ctx, path);
    const resultEntity = fileEntity ?? folderEntity;

    if (!resultEntity) {
      return { success: false, message: "Item not found in bucket" };
    }

    await ctx.bucket.file(path).delete();
    if (dbFile) {
      await StorageDbRepository.deleteFile(path);
    } else if (dbDirectory) {
      await StorageDbRepository.deleteDirectory(path);
    }

    return { success: true, data: resultEntity };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
