import { copy, head } from "@vercel/blob";
import logger from "@/backend/lib/logger";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import { formatBulkOperationResult, validateBulkOperation } from "../../shared/bulk-operations.helper";
import { getBlobs, isDirectory } from "../shared";
import type { VercelContext } from "../types";
import { fileExists, fileInfoByPath } from "./file.operations";

export async function copyItems(
  ctx: VercelContext,
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
    return formatBulkOperationResult(successCount, failures, successfulItems, "copied");
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

      const isDir = await isDirectory(ctx, sourcePath);

      if (isDir) {
        await copyDirectory(ctx, sourcePath, destPath);
      } else {
        await copySingleFile(ctx, sourcePath, destPath);
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

  return formatBulkOperationResult(successCount, failures, successfulItems, "copied");
}

async function copySingleFile(ctx: VercelContext, sourcePath: string, destPath: string): Promise<void> {
  const sourceBlob = await head(sourcePath, { token: ctx.token });

  const newBlob = await copy(sourceBlob.url, destPath, {
    token: ctx.token,
    access: "public",
  });

  logger.info("📋 copySingleFile: Copied blob", {
    from: sourcePath,
    to: destPath,
    url: newBlob.url,
  });
}

async function copyDirectory(ctx: VercelContext, sourcePath: string, destPath: string): Promise<void> {
  const prefix = `${sourcePath}/`;
  const allBlobs = await getBlobs(ctx, prefix);

  logger.info("📋 copyDirectory: Found files to copy", {
    sourceDir: sourcePath,
    fileCount: allBlobs.length,
  });

  for (const blob of allBlobs) {
    const relativePath = blob.pathname.slice(prefix.length);
    const newFilePath = `${destPath}/${relativePath}`;

    try {
      await copy(blob.url, newFilePath, {
        token: ctx.token,
        access: "public",
      });

      logger.info("📋 copyDirectory: Copied file", {
        from: blob.pathname,
        to: newFilePath,
      });
    } catch (error) {
      logger.error(`Failed to copy file in directory: ${blob.pathname}`, error);
      throw error;
    }
  }

  logger.info("✅ copyDirectory: All files copied", {
    sourceDir: sourcePath,
    destDir: destPath,
    fileCount: allBlobs.length,
  });
}
