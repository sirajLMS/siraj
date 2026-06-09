import fs from "node:fs/promises";
import path from "node:path";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import { executeBulkOperation } from "../../shared/bulk-operations.helper";
import type { LocalContext } from "../types";
import { ensureDirectory, getAbsolutePath } from "../utils";
import { fileExists, fileInfoByPath } from "./file.operations";

export async function copyItems(
  ctx: LocalContext,
  input: Types.StorageItemsCopyInput
): Promise<Types.BulkOperationResult> {
  return executeBulkOperation({
    ctx,
    sourcePaths: input.sourcePaths,
    destinationPath: input.destinationPath,
    existsFn: fileExists,
    operationName: "processed",
    processFn: async (ctx, sourcePath) => {
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

      return await fileInfoByPath(ctx, destPath);
    },
  });
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
