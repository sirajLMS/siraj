import { StorageDbRepository } from "@/backend/db/repo/storage";
import { logger } from "@/backend/lib/logger";
import { fileInfoByPath } from "@/backend/storage/disk/gcp/operations/file.operations";
import { directoryInfoByPath } from "@/backend/storage/disk/gcp/operations/folder.operations";
import type { GcpContext, GenericOperationResult } from "@/backend/storage/disk/gcp/types";
import { formatBulkOperationResult } from "@/backend/storage/disk/shared/bulk-operations.helper";
import { validateDeletePermissions } from "@/backend/storage/disk/shared/delete-operations.helper";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import { type FileErrors, getServerTranslations } from "@/shared/locale";

export async function deleteFile(ctx: GcpContext, path: string, locale?: string): Promise<Types.FileOperationResult> {
  const tFile = getServerTranslations(locale ?? "en").errorsTranslations.file;
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
        message: usageCheck.deleteBlockReason ?? tFile.fileIsInUse,
      };
    }

    const dbFile = await StorageDbRepository.fileByPath(path);
    if (dbFile?.isProtected === true) {
      return {
        success: false,
        message: tFile.fileProtectedFromDeletion,
      };
    }

    const parentPath = path.substring(0, path.lastIndexOf("/"));
    const parentDir = await StorageDbRepository.directoryByPath(parentPath);
    if (parentDir && !parentDir.allowDeleteFiles) {
      return {
        success: false,
        message: tFile.fileDeletionNotAllowedInDirectory,
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
      message: tFile.fileDeletedSuccessfully,
    };
  } catch (error) {
    logger.error(`Failed to delete file: ${path}`, error);
    return {
      success: false,
      message: tFile.failedToDeleteFile(error instanceof Error ? error.message : String(error)),
    };
  }
}

export async function deleteItems(
  ctx: GcpContext,
  input: Types.StorageItemsDeleteInput,
  locale?: string
): Promise<Types.BulkOperationResult> {
  const tFile = getServerTranslations(locale ?? "en").errorsTranslations.file;
  let successCount = 0;
  const failures: Array<{ path: string; error: string }> = [];
  const successfulItems: Array<Types.FileInfo | Types.DirectoryInfo> = [];

  const context = await getDeleteContext(input.paths, input.force ?? false);

  const results = await Promise.all(
    input.paths.map(path =>
      deleteSingleItem(
        ctx,
        {
          path,
          force: input.force ?? false,
          dbFile: context.dbFileMap.get(path),
          dbDirectory: context.dbDirectoryMap.get(path),
          parentDir: context.dbParentDirMap.get(path.substring(0, path.lastIndexOf("/"))),
          usageCheck: context.usageCheckMap.get(path),
        },
        tFile
      )
    )
  );

  input.paths.forEach((path, index) => {
    const result = results[index];
    if (result.success && result.data) {
      successCount++;
      successfulItems.push(result.data);
    } else {
      failures.push({ path, error: result.message ?? tFile.unknownError });
    }
  });

  return formatBulkOperationResult(successCount, failures, successfulItems, "deleted", locale);
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
    dbFileMap: new Map<string, Types.FileSelectType>(dbFiles.map(f => [f.path, f])),
    dbDirectoryMap: new Map<string, Types.DirectorySelectType>(dbDirectories.map(d => [d.path, d])),
    dbParentDirMap: new Map<string, Types.DirectorySelectType>(dbParentDirs.map(d => [d.path, d])),
    usageCheckMap: new Map<string, Types.FileUsageResult>(usageChecks.map(c => [c.path, c])),
  };
}

async function deleteSingleItem(
  ctx: GcpContext,
  params: {
    path: string;
    force: boolean;
    dbFile?: Types.FileSelectType;
    dbDirectory?: Types.DirectorySelectType;
    parentDir?: Types.DirectorySelectType;
    usageCheck?: Types.FileUsageResult;
  },
  tFile: FileErrors
): Promise<GenericOperationResult<Types.FileInfo | Types.DirectoryInfo>> {
  const { path, force, dbFile, dbDirectory, parentDir, usageCheck } = params;

  try {
    validateDeletePermissions(
      {
        force,
        usageCheck: usageCheck
          ? {
              isInUse: usageCheck.isInUse,
              deleteBlockReason: usageCheck.deleteBlockReason,
            }
          : undefined,
        dbFile,
        dbDirectory,
        parentDir,
      },
      tFile
    );

    const fileEntity = await fileInfoByPath(ctx, path);
    const folderEntity = fileEntity ? null : await directoryInfoByPath(ctx, path);
    const resultEntity = fileEntity ?? folderEntity;

    if (!resultEntity) {
      return { success: false, message: tFile.itemNotFoundInBucket };
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
