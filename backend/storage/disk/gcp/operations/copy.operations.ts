import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import { formatBulkOperationResult, validateBulkOperation } from "../../shared/bulk-operations.helper";
import type { GcpContext } from "../types";
import { fileExists, fileInfoByPath } from "./file.operations";

export async function copyItems(
  ctx: GcpContext,
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
      failures.push({
        path: sourcePath,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return formatBulkOperationResult(successCount, failures, successfulItems, "copied");
}
