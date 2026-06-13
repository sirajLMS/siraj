import fs from "node:fs/promises";
import { StorageDbRepository } from "@/backend/db/repo";
import type * as Types from "@/backend/types";
import {
  type DeleteFnParams,
  executeBulkDelete,
  executeDeleteFile,
  validateDeletePermissions,
} from "../../shared/delete-operations.helper";
import type { LocalContext } from "../types";
import { getAbsolutePath } from "../utils";
import { fileInfoByPath } from "./file.operations";
import { directoryInfoByPath } from "./folder.operations";

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
