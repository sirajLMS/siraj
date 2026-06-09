import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import { executeBulkOperation } from "../../shared/bulk-operations.helper";
import type { GcpContext } from "../types";
import { fileExists, fileInfoByPath } from "./file.operations";

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
