import { StorageDbRepository } from "@/backend/db/repo";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import { getValidSourcePaths } from "../shared";
import type { GcpContext } from "../types";
import { fileInfoByPath } from "./file.operations";

export async function copyItems(
  ctx: GcpContext,
  input: Types.StorageItemsCopyInput
): Promise<Types.BulkOperationResult> {
  let successCount = 0;
  let failureCount = 0;
  const failures: Array<{ path: string; error: string }> = [];
  const successfulItems: Array<Types.FileInfo | Types.DirectoryInfo> = [];

  const validSourcesResult = await getValidSourcePaths(ctx, input.sourcePaths);
  const validSources = validSourcesResult.validSources;
  failureCount += validSourcesResult.failureCount;
  failures.push(...validSourcesResult.failures);

  if (validSources.length === 0) {
    return {
      success: failureCount === 0,
      message: "No valid source files to copy",
      successCount,
      failureCount,
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
      successfulItems: [],
    };
  }

  for (const sourcePath of validSources) {
    try {
      const fileName = StorageUtils.extractFileName(sourcePath);
      const destPath = `${input.destinationPath.replace(/\/$/, "")}/${fileName}`;

      await ctx.bucket.file(sourcePath).copy(ctx.bucket.file(destPath));

      const fileInfo = await fileInfoByPath(ctx, destPath);
      if (fileInfo) {
        successCount++;
        successfulItems.push(fileInfo);
      }
    } catch (error) {
      failureCount++;
      failures.push({
        path: sourcePath,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    success: failureCount === 0,
    message:
      failureCount === 0 ? "All items copied successfully" : `${successCount} items copied, ${failureCount} failed`,
    successCount,
    failureCount,
    failures,
    successfulItems,
  };
}
