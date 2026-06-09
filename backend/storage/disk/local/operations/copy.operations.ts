import fs from "node:fs/promises";
import path from "node:path";
import { StorageDbRepository } from "@/backend/db/repo";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import type { LocalContext } from "../types";
import { ensureDirectory, getAbsolutePath } from "../utils";
import { fileInfoByPath } from "./file.operations";

export async function copyItems(
  ctx: LocalContext,
  input: Types.StorageItemsCopyInput
): Promise<Types.BulkOperationResult> {
  let successCount = 0;
  const failures: Array<{ path: string; error: string }> = [];
  const successfulItems: Array<Types.FileInfo | Types.DirectoryInfo> = [];

  const sourceExistenceChecks = await Promise.all(
    input.sourcePaths.map(async sourcePath => {
      try {
        const absolutePath = getAbsolutePath(ctx.basePath, sourcePath);
        await fs.access(absolutePath);
        return { path: sourcePath, exists: true };
      } catch {
        return { path: sourcePath, exists: false };
      }
    })
  );

  const validSources = sourceExistenceChecks
    .filter(check => {
      if (!check.exists) {
        failures.push({ path: check.path, error: "Source path not found" });
        return false;
      }
      return true;
    })
    .map(check => check.path);

  if (validSources.length === 0) {
    return {
      success: failures.length === 0,
      message: "No valid source files to copy",
      successCount,
      failureCount: failures.length,
      failures,
      successfulItems,
    };
  }

  const dbDestDir = await StorageDbRepository.directoryByPath(input.destinationPath);
  if (dbDestDir && !dbDestDir.allowUploads) {
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

  return {
    success: failures.length === 0,
    message:
      failures.length === 0
        ? "All items processed successfully"
        : `${successCount} items processed, ${failures.length} failed`,
    successCount,
    failureCount: failures.length,
    failures,
    successfulItems,
  };
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
