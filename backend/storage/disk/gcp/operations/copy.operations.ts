import { fileExists, fileInfoByPath } from "@/backend/storage/disk/gcp/operations/file.operations";
import type { GcpContext } from "@/backend/storage/disk/gcp/types";
import { executeBulkOperation } from "@/backend/storage/disk/shared/bulk-operations.helper";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";

export async function copyItems(
  ctx: GcpContext,
  input: Types.StorageItemsCopyInput
): Promise<Types.BulkOperationResult> {
  return executeBulkOperation({
    ctx,
    sourcePaths: input.sourcePaths,
    destinationPath: input.destinationPath,
    existsFn: fileExists,
    operationName: "copied",
    processFn: async (ctx, sourcePath) => {
      const fileName = StorageUtils.extractFileName(sourcePath);
      const destPath = `${input.destinationPath.replace(/\/$/, "")}/${fileName}`;

      await ctx.bucket.file(sourcePath).copy(ctx.bucket.file(destPath));

      return await fileInfoByPath(ctx, destPath);
    },
  });
}
