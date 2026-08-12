import { StorageDbRepository } from "@/backend/db/repo/storage";
import { OrderSortDirection } from "@/backend/enum";
import * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";

/**
 * Common logic for loading database entities for a list of paths
 */
export async function loadListEntities(filePaths: string[], dirPaths: string[]) {
  const [dbFiles, dbDirectories] = await Promise.all([
    filePaths.length > 0 ? StorageDbRepository.filesByPaths(filePaths) : [],
    dirPaths.length > 0 ? StorageDbRepository.directoriesByPaths(dirPaths) : [],
  ]);

  const dbFileMap = new Map<string, Types.FileEntity>();
  for (const dbFile of dbFiles) {
    dbFileMap.set(dbFile.path, dbFile);
  }

  const dbDirMap = new Map<string, Types.DirectoryEntity>();
  for (const dbDir of dbDirectories) {
    dbDirMap.set(dbDir.path, dbDir);
  }

  return { dbFileMap, dbDirMap };
}

/**
 * Common logic for filtering, sorting and paginating storage items
 */
export function paginateStorageItems(
  items: Array<Types.FileInfo | Types.DirectoryInfo>,
  input: Types.FilesListSearchInput
): Types.StorageObjectList {
  let filteredItems = items;

  // Filter by search term
  if (input.searchTerm && input.searchTerm.length > 0) {
    const searchLower = input.searchTerm.toLowerCase();
    filteredItems = items.filter(item => item.name.toLowerCase().includes(searchLower));
  }

  // Filter by storage utils
  filteredItems = StorageUtils.filterStorageItems(filteredItems, {
    includeDirectories: input.includeDirectories ?? null,
    fileType: input.fileType ?? null,
    fileTypes: input.fileTypes ?? null,
    contentTypes: input.contentTypes ?? null,
  });

  // Sort items
  const sortedItems = StorageUtils.sortItems(
    filteredItems,
    input.sortBy || Types.FileSortField.NAME,
    input.sortDirection || OrderSortDirection.ASC
  );

  const totalCount = sortedItems.length;
  const offset = input.offset || 0;
  const limit = input.limit || 50;
  const paginatedItems = sortedItems.slice(offset, offset + limit);
  const hasMore = offset + limit < totalCount;

  return {
    items: paginatedItems,
    totalCount,
    hasMore,
    offset,
    limit,
  };
}
