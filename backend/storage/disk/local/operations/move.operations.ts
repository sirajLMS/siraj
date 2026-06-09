import fs from "node:fs/promises";
import path from "node:path";
import type * as Types from "@/backend/types";
import { executeBulkOperation } from "../../shared/bulk-operations.helper";
import {
  loadMoveEntities,
  type MoveEntities,
  updateDbAfterMove,
  validateAndCalculateNewPath,
} from "../../shared/move-operations.helper";
import type { LocalContext } from "../types";
import { ensureDirectory, getAbsolutePath } from "../utils";
import { fileExists, fileInfoByPath } from "./file.operations";
import { directoryInfoByPath } from "./folder.operations";

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
