import { StorageDbRepository } from "@/backend/db/repo";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import { createFolderHelper } from "../../shared/folder-operations.helper";
import type { GcpContext } from "../types";

export async function createFolder(
  ctx: GcpContext,
  input: Types.FolderCreateInput
): Promise<Types.FileOperationResult> {
  return createFolderHelper(input, async fullPath => {
    const folderPath = `${fullPath}/`;
    const file = ctx.bucket.file(folderPath);
    await file.save("", {
      contentType: "application/x-directory",
    });
  });
}

export async function directoryInfoByPath(ctx: GcpContext, path: string): Promise<Types.DirectoryInfo | null> {
  const dbDirectory = await StorageDbRepository.directoryByPath(path);

  const folderPath = `${path}/`;
  const [files] = await ctx.bucket.getFiles({
    prefix: folderPath,
    maxResults: 1,
  });

  const folderExists = files.length > 0;

  if (!folderExists && !dbDirectory) {
    return null;
  }

  const bucketDir: Types.BucketDirectory = {
    path,
    createdAt: new Date(),
    lastModified: new Date(),
    isPublic: path.startsWith("public"),
  };

  return StorageUtils.combineDirectoryData(bucketDir, dbDirectory);
}
