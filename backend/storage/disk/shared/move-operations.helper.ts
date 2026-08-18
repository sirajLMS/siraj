import { StorageDbRepository } from "@/backend/db/repo/storage";
import { logger } from "@/backend/lib/logger";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";

export interface MoveEntities {
  dbFileMap: Map<string, Types.FileSelectType>;
  dbDirectoryMap: Map<string, Types.DirectorySelectType>;
  dbSourceDirMap: Map<string, Types.DirectorySelectType>;
}

/**
 * Common batch loading logic for move operations
 */
export async function loadMoveEntities(sources: string[]): Promise<MoveEntities> {
  const sourceDirectories = [...new Set(sources.map(path => path.substring(0, path.lastIndexOf("/"))))];

  logger.info("💾 loadMoveEntities: About to batch load DB entities", {
    validSourcesCount: sources.length,
    sourceDirectoriesCount: sourceDirectories.length,
  });

  const [dbFiles, dbDirectories, dbSourceDirs] = await Promise.all([
    StorageDbRepository.filesByPaths(sources),
    StorageDbRepository.directoriesByPaths(sources),
    StorageDbRepository.directoriesByPaths(sourceDirectories),
  ]);

  const dbFileMap = new Map<string, Types.FileSelectType>();
  for (const file of dbFiles) {
    dbFileMap.set(file.path, file);
  }

  const dbDirectoryMap = new Map<string, Types.DirectorySelectType>();
  for (const dir of dbDirectories) {
    dbDirectoryMap.set(dir.path, dir);
  }

  const dbSourceDirMap = new Map<string, Types.DirectorySelectType>();
  for (const dir of dbSourceDirs) {
    dbSourceDirMap.set(dir.path, dir);
  }

  return { dbFileMap, dbDirectoryMap, dbSourceDirMap };
}

/**
 * Validates if move is allowed and calculates the destination path
 */
export function validateAndCalculateNewPath(
  sourcePath: string,
  destinationPath: string,
  dbSourceDirMap: Map<string, Types.DirectorySelectType>
): string {
  const sourceDir = sourcePath.substring(0, sourcePath.lastIndexOf("/"));
  const dbSourceDir = dbSourceDirMap.get(sourceDir);

  if (dbSourceDir && !dbSourceDir.allowMove) {
    throw new Error(`Move not allowed from directory: ${sourceDir}`);
  }

  const fileName = StorageUtils.extractFileName(sourcePath);
  return `${destinationPath.replace(/\/$/, "")}/${fileName}`;
}

/**
 * Shared database update logic after move
 */
export async function updateDbAfterMove(
  dbFile: Types.FileSelectType | undefined,
  dbDirectory: Types.DirectorySelectType | undefined,
  newPath: string
): Promise<void> {
  if (dbFile) {
    await StorageDbRepository.updateFile({
      id: dbFile.id,
      path: newPath,
      isProtected: dbFile.isProtected,
    });
  } else if (dbDirectory) {
    await StorageDbRepository.updateDirectory({
      ...dbDirectory,
      path: newPath,
    });
  }
}
