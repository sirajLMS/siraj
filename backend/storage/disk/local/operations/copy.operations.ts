import fs from "node:fs/promises";
import path from "node:path";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import { formatBulkOperationResult, validateBulkOperation } from "../../shared/bulk-operations.helper";
import type { LocalContext } from "../types";
import { ensureDirectory, getAbsolutePath } from "../utils";
import { fileExists, fileInfoByPath } from "./file.operations";

export async function copyItems(
  ctx: LocalContext,
  input: Types.StorageItemsCopyInput
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
    return formatBulkOperationResult(successCount, failures, successfulItems, "processed");
  }

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
      successfulItems,
    };
  }

  for (const sourcePath of validSources) {
    try {
      const fileName = StorageUtils.extractFileName(sourcePath);
      const destPath = `${input.destinationPath.replace(/\/$/, "")}/${fileName}`;

      const sourceAbsolutePath = getAbsolutePath(ctx.basePath, sourcePath);
      const destAbsolutePath = getAbsolutePath(ctx.basePath, destPath);

      await ensureDirectory(path.dirname(destAbsolutePath));

      const stats = await fs.stat(sourceAbsolutePath);

      if (stats.isDirectory()) {
        await copyDirectory(sourceAbsolutePath, destAbsolutePath);
      } else {
        await fs.copyFile(sourceAbsolutePath, destAbsolutePath);
      }

      const fileInfo = await fileInfoByPath(ctx, destPath);
      if (fileInfo) {
        successfulItems.push(fileInfo);
      }

      successCount++;
    } catch (error) {
      failures.push({
        path: sourcePath,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return formatBulkOperationResult(successCount, failures, successfulItems, "processed");
}

async function copyDirectory(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true, mode: 0o755 });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}
