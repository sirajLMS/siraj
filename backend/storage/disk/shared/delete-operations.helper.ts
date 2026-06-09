import { StorageDbRepository } from "@/backend/db/repo";
import type * as Types from "@/backend/types";

/**
 * Validates if an item can be deleted based on usage and protection status
 */
export function validateDeletePermissions(
  force: boolean,
  usageCheck: { isInUse: boolean; deleteBlockReason: string | null | undefined } | undefined,
  dbFile: Types.FileEntity | undefined,
  dbDirectory: Types.DirectoryEntity | undefined,
  parentDir: Types.DirectoryEntity | undefined
): void {
  if (!force && usageCheck?.isInUse) {
    throw new Error(usageCheck.deleteBlockReason || "File is currently in use");
  }

  if (dbFile?.isProtected === true || dbDirectory?.isProtected === true) {
    throw new Error("Item is protected from deletion");
  }

  if (parentDir) {
    const isFile = dbFile != null;
    const canDelete = isFile ? parentDir.allowDeleteFiles : parentDir.allowDelete;
    if (!canDelete) {
      throw new Error(`Deletion not allowed in parent directory: ${parentDir.path}`);
    }
  }
}

/**
 * Loads all necessary database entities for bulk delete operations
 */
export async function loadDeleteEntities(paths: string[], force: boolean) {
  const parentDirectories = [...new Set(paths.map(path => path.substring(0, path.lastIndexOf("/"))))];

  const [dbFiles, dbDirectories, dbParentDirs, usageChecks] = await Promise.all([
    StorageDbRepository.filesByPaths(paths),
    StorageDbRepository.directoriesByPaths(paths),
    StorageDbRepository.directoriesByPaths(parentDirectories),
    force ? Promise.resolve([]) : checkFileUsages(paths),
  ]);

  const dbFileMap = new Map<string, Types.FileEntity>();
  for (const file of dbFiles) {
    dbFileMap.set(file.path, file);
  }

  const dbDirectoryMap = new Map<string, Types.DirectoryEntity>();
  for (const dir of dbDirectories) {
    dbDirectoryMap.set(dir.path, dir);
  }

  const dbParentDirMap = new Map<string, Types.DirectoryEntity>();
  for (const dir of dbParentDirs) {
    dbParentDirMap.set(dir.path, dir);
  }

  const usageCheckMap = new Map<string, { isInUse: boolean; deleteBlockReason: string | null | undefined }>();
  for (const check of usageChecks) {
    usageCheckMap.set(check.path, check);
  }

  return { dbFileMap, dbDirectoryMap, dbParentDirMap, usageCheckMap };
}

async function checkFileUsages(paths: string[]) {
  return Promise.all(
    paths.map(filePath =>
      StorageDbRepository.checkFileUsage({ path: filePath })
        .then(result => ({
          path: filePath,
          isInUse: result.isInUse,
          deleteBlockReason: result.deleteBlockReason ?? null,
        }))
        .catch(() => ({
          path: filePath,
          isInUse: false,
          deleteBlockReason: null,
        }))
    )
  );
}
