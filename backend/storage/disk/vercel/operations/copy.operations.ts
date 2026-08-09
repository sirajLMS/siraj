import { copy, head } from "@vercel/blob";
import { logger } from "@/backend/lib/logger";
import { executeBulkOperation } from "@/backend/storage/disk/shared/bulk-operations.helper";
import { fileExists, fileInfoByPath } from "@/backend/storage/disk/vercel/operations/file.operations";
import { getBlobs, isDirectory } from "@/backend/storage/disk/vercel/shared";
import type { VercelContext } from "@/backend/storage/disk/vercel/types";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";

export async function copyItems(
  ctx: VercelContext,
  input: Types.StorageItemsCopyInput
): Promise<Types.BulkOperationResult> {
  return executeBulkOperation({
    ctx,
    sourcePaths: input.sourcePaths,
    destinationPath: input.destinationPath,
    existsFn: fileExists,
    operationName: "copied",
    processFn: async (opCtx, sourcePath) => {
      const fileName = StorageUtils.extractFileName(sourcePath);
      const destPath = `${input.destinationPath.replace(/\/$/, "")}/${fileName}`;

      const isDir = await isDirectory(opCtx, sourcePath);

      if (isDir) {
        await copyDirectory(opCtx, sourcePath, destPath);
      } else {
        await copySingleFile(opCtx, sourcePath, destPath);
      }

      return await fileInfoByPath(opCtx, destPath);
    },
  });
}

async function copySingleFile(ctx: VercelContext, sourcePath: string, destPath: string): Promise<void> {
  const sourceBlob = await head(sourcePath, { token: ctx.token });

  const newBlob = await copy(sourceBlob.url, destPath, {
    token: ctx.token,
    access: ctx.access,
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
        access: ctx.access,
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
