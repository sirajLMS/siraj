import type { File, GetFilesResponse } from "@google-cloud/storage";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import { loadListEntities, paginateStorageItems } from "../../shared/list-operations.helper";
import { getFolderFileCounts } from "../shared";
import type { GcpContext, GcsApiResponse } from "../types";
import { cleanGcsPath } from "../utils";

/**
 * List files and directories in a GCP bucket path
 */
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

  const validFiles = files.filter(file => file.name !== prefix);
  const filePaths = validFiles.map(f => f.name);
  const dirPaths = (apiResponse?.prefixes || []).map(p => p.replace(/\/$/, ""));

  const { dbFileMap, dbDirMap } = await loadListEntities(filePaths, dirPaths);
  const folderFileCountMap = await getFolderFileCounts(ctx, apiResponse?.prefixes || [], dirPaths);

  const items: Array<Types.FileInfo | Types.DirectoryInfo> = [
    ...mapGcsFiles(validFiles, dbFileMap, ctx.gcpBaseUrl),
    ...mapGcsDirectories(apiResponse?.prefixes || [], dbDirMap, folderFileCountMap),
  ];

  return paginateStorageItems(items, input);
}

/**
 * Map GCS File objects to FileInfo
 */
function mapGcsFiles(files: File[], dbFileMap: Map<string, Types.FileEntity>, gcpBaseUrl: string): Types.FileInfo[] {
  return files.map(file => {
    const bucketFile = StorageUtils.blobToFileInfo(file.metadata, gcpBaseUrl);
    const dbFile = dbFileMap.get(file.name);
    return StorageUtils.combineFileData(bucketFile, dbFile);
  });
}

/**
 * Map GCS prefixes to DirectoryInfo
 */
function mapGcsDirectories(
  prefixes: string[],
  dbDirMap: Map<string, Types.DirectoryEntity>,
  folderFileCountMap: Map<string, number>
): Types.DirectoryInfo[] {
  return prefixes.map(dirPrefix => {
    const dirPath = dirPrefix.replace(/\/$/, "");
    const dbDir = dbDirMap.get(dirPath);

    const bucketDir: Types.BucketDirectory = {
      path: dirPath,
      createdAt: new Date(),
      lastModified: new Date(),
      isPublic: dirPath.startsWith("public"),
    };

    const fileCount = folderFileCountMap.get(dirPath) || 0;
    return StorageUtils.combineDirectoryData(bucketDir, dbDir, fileCount);
  });
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

  const apiResponse = responseData[2] as GcsApiResponse | undefined;
  return mapGcsDirectories(apiResponse?.prefixes || [], dbDirectoriesByPath, new Map());
}
