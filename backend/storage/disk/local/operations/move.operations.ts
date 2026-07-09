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

export async function moveItems(
  ctx: LocalContext,
  input: Types.StorageItemsMoveInput
): Promise<Types.BulkOperationResult> {
  return executeBulkOperation({
    ctx,
    sourcePaths: input.sourcePaths,
    destinationPath: input.destinationPath,
    existsFn: fileExists,
    operationName: "processed",
    beforeProcess: async (_, validSources) => {
      return await loadMoveEntities(validSources);
    },
    processFn: async (ctx, sourcePath, entities: MoveEntities) => {
      return await moveItem(ctx, sourcePath, input.destinationPath, entities);
    },
  });
}

async function moveItem(
  ctx: LocalContext,
  sourcePath: string,
  destinationPath: string,
  { dbFileMap, dbDirectoryMap, dbSourceDirMap }: MoveEntities
): Promise<Types.FileInfo | Types.DirectoryInfo | null> {
  const newPath = validateAndCalculateNewPath(sourcePath, destinationPath, dbSourceDirMap);

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
