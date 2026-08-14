import fs from "node:fs/promises";
import { StorageDbRepository } from "@/backend/db/repo/storage";
import { fileInfoByPath } from "@/backend/storage/disk/local/operations/file.operations";
import { directoryInfoByPath } from "@/backend/storage/disk/local/operations/folder.operations";
import type { LocalContext } from "@/backend/storage/disk/local/types";
import { getAbsolutePath } from "@/backend/storage/disk/local/utils";
import {
  type DeleteFnParams,
  executeBulkDelete,
  executeDeleteFile,
  validateDeletePermissions,
} from "@/backend/storage/disk/shared/delete-operations.helper";
import type * as Types from "@/backend/types";

export async function deleteFile(ctx: LocalContext, filePath: string): Promise<Types.FileOperationResult> {
  return executeDeleteFile(filePath, async () => {
    const absolutePath = getAbsolutePath(ctx.basePath, filePath);
    await fs.unlink(absolutePath);
  });
}

export async function deleteItems(
  ctx: LocalContext,
  input: Types.StorageItemsDeleteInput
): Promise<Types.BulkOperationResult> {
  return executeBulkDelete(ctx, input, processDelete);
}

async function processDelete(
  ctx: LocalContext,
  params: DeleteFnParams
): Promise<Types.FileInfo | Types.DirectoryInfo | null> {
  const { itemPath, force, dbFile, dbDirectory, parentDir, usageCheck } = params;

  validateDeletePermissions({ force, usageCheck, dbFile, dbDirectory, parentDir });

  const fileEntity = await fileInfoByPath(ctx, itemPath);
  const folderEntity = fileEntity ? null : await directoryInfoByPath(ctx, itemPath);

  const absolutePath = getAbsolutePath(ctx.basePath, itemPath);
  const stats = await fs.stat(absolutePath);

  if (stats.isDirectory()) {
    await fs.rm(absolutePath, { recursive: true, force: true });
  } else {
    await fs.unlink(absolutePath);
  }

  if (dbFile) {
    await StorageDbRepository.deleteFile(itemPath);
    if (fileEntity) return fileEntity;
  } else if (dbDirectory) {
    await StorageDbRepository.deleteDirectory(itemPath);
    if (folderEntity) return folderEntity;
  } else if (fileEntity) {
    return fileEntity;
  } else if (folderEntity) {
    return folderEntity;
  }

  return null;
}
