import fs from "node:fs/promises";
import path from "node:path";
import { fileExists, fileInfoByPath } from "@/backend/storage/disk/local/operations/file.operations";
import { directoryInfoByPath } from "@/backend/storage/disk/local/operations/folder.operations";
import type { LocalContext } from "@/backend/storage/disk/local/types";
import { ensureDirectory, getAbsolutePath } from "@/backend/storage/disk/local/utils";
import { executeBulkOperation } from "@/backend/storage/disk/shared/bulk-operations.helper";
import {
  loadMoveEntities,
  type MoveEntities,
  updateDbAfterMove,
  validateAndCalculateNewPath,
} from "@/backend/storage/disk/shared/move-operations.helper";
import type * as Types from "@/backend/types";
import { type FileErrors, getServerTranslations } from "@/shared/locale";

export async function moveItems(
  ctx: LocalContext,
  input: Types.StorageItemsMoveInput,
  locale?: string
): Promise<Types.BulkOperationResult> {
  const tFile = getServerTranslations(locale ?? "en").errorsTranslations.file;
  return executeBulkOperation({
    ctx,
    sourcePaths: input.sourcePaths,
    destinationPath: input.destinationPath,
    existsFn: fileExists,
    operationName: "processed",
    locale,
    beforeProcess: async (_, validSources) => {
      return await loadMoveEntities(validSources);
    },
    processFn: async (opCtx, sourcePath, entities) => {
      if (!entities) throw new Error("Move entities not loaded");
      return await moveItem(opCtx, sourcePath, input.destinationPath, entities, tFile);
    },
  });
}

async function moveItem(
  ctx: LocalContext,
  sourcePath: string,
  destinationPath: string,
  { dbFileMap, dbDirectoryMap, dbSourceDirMap }: MoveEntities,
  tFile: FileErrors
): Promise<Types.FileInfo | Types.DirectoryInfo | null> {
  const newPath = validateAndCalculateNewPath(sourcePath, destinationPath, dbSourceDirMap, tFile);

  const sourceAbsolutePath = getAbsolutePath(ctx.basePath, sourcePath);
  const destAbsolutePath = getAbsolutePath(ctx.basePath, newPath);

  await ensureDirectory(path.dirname(destAbsolutePath));
  await fs.rename(sourceAbsolutePath, destAbsolutePath);

  const dbFile = dbFileMap.get(sourcePath);
  const dbDirectory = dbDirectoryMap.get(sourcePath);

  await updateDbAfterMove(dbFile, dbDirectory, newPath);

  if (dbDirectory) {
    return await directoryInfoByPath(ctx, newPath);
  }

  return await fileInfoByPath(ctx, newPath);
}
