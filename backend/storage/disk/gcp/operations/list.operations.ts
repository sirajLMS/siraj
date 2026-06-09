import type { GetFilesResponse } from "@google-cloud/storage";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import { loadListEntities, paginateStorageItems } from "../../shared/list-operations.helper";
import { getFolderFileCounts } from "../shared";
import type { GcpContext, GcsApiResponse } from "../types";
import { cleanGcsPath } from "../utils";

export async function listFiles(ctx: GcpContext, input: Types.FilesListSearchInput): Promise<Types.StorageObjectList> {
  const prefix = cleanGcsPath(input.path || "", true);
  const delimiter = "/";

  const response: GetFilesResponse = await ctx.bucket.getFiles({
    prefix,
    delimiter,
    autoPaginate: false,
  });

  const [files] = response;
  const apiResponse = response[2] as GcsApiResponse | undefined;

  const items: Array<Types.FileInfo | Types.DirectoryInfo> = [];

  const filePaths: string[] = [];
  const validFiles = files.filter(file => file.name !== prefix);

  for (const file of validFiles) {
    filePaths.push(file.name);
  }

  const dirPaths: string[] = [];
  if (apiResponse?.prefixes) {
    for (const dirPrefix of apiResponse.prefixes) {
      const dirPath = dirPrefix.replace(/\/$/, "");
      dirPaths.push(dirPath);
    }
  }

  const { dbFileMap, dbDirMap } = await loadListEntities(filePaths, dirPaths);
  const folderFileCountMap = await getFolderFileCounts(ctx, apiResponse?.prefixes || [], dirPaths);

  for (const file of validFiles) {
    const bucketFile = StorageUtils.blobToFileInfo(file.metadata, ctx.gcpBaseUrl);
    const dbFile = dbFileMap.get(file.name);
    const fileInfo = StorageUtils.combineFileData(bucketFile, dbFile);
    items.push(fileInfo);
  }

  if (apiResponse?.prefixes) {
    for (const dirPrefix of apiResponse.prefixes) {
      const dirPath = dirPrefix.replace(/\/$/, "");
      const dbDir = dbDirMap.get(dirPath);

      const bucketDir: Types.BucketDirectory = {
        path: dirPath,
        createdAt: new Date(),
        lastModified: new Date(),
        isPublic: dirPath.startsWith("public"),
      };

      const fileCount = folderFileCountMap.get(dirPath) || 0;
      const dirInfo = StorageUtils.combineDirectoryData(bucketDir, dbDir, fileCount);
      items.push(dirInfo);
    }
  }

  return paginateStorageItems(items, input);
}

export async function fetchDirectoryChildren(ctx: GcpContext, path?: string | null): Promise<Types.DirectoryInfo[]> {
  return originalFetchDirectoryChildren(ctx, path);
}

// Keeping original fetchDirectoryChildren logic as it uses parentPath lookup
import { StorageDbRepository } from "@/backend/db/repo";

async function originalFetchDirectoryChildren(ctx: GcpContext, path?: string | null): Promise<Types.DirectoryInfo[]> {
  const searchPath = !path || path.length === 0 ? "public" : cleanGcsPath(path);
  const prefix = cleanGcsPath(searchPath, true);

  const dbDirectories = await StorageDbRepository.directoriesByParentPath(searchPath);
  const dbDirectoriesByPath = new Map(dbDirectories.map(dir => [dir.path, dir]));

  const responseData: GetFilesResponse = await ctx.bucket.getFiles({
    prefix,
    delimiter: "/",
    autoPaginate: false,
  });

  const directories: Types.DirectoryInfo[] = [];
  const apiResponse = responseData[2] as GcsApiResponse | undefined;

  if (apiResponse?.prefixes) {
    for (const dirPrefix of apiResponse.prefixes) {
      const dirPath = dirPrefix.replace(/\/$/, "");
      const dbDir = dbDirectoriesByPath.get(dirPath);

      const bucketDir: Types.BucketDirectory = {
        path: dirPath,
        createdAt: new Date(),
        lastModified: new Date(),
        isPublic: dirPath.startsWith("public"),
      };

      directories.push(StorageUtils.combineDirectoryData(bucketDir, dbDir));
    }
  }

  return directories;
}
