import { StorageDbRepository } from "@/backend/db/repo";
import type * as Types from "@/backend/types";

/**
 * Validates source paths for existence and destination directory for upload permissions
 */
export async function validateBulkOperation<TContext>(
  ctx: TContext,
  sourcePaths: string[],
  destinationPath: string | undefined,
  existsFn: (ctx: TContext, path: string) => Promise<boolean>
): Promise<{
  validSources: string[];
  failures: Array<{ path: string; error: string }>;
  destDirAllowed: boolean;
}> {
  const failures: Array<{ path: string; error: string }> = [];

  const sourceExistenceChecks = await Promise.all(
    sourcePaths.map(async sourcePath => {
      try {
        const exists = await existsFn(ctx, sourcePath);
        return { path: sourcePath, exists };
      } catch {
        return { path: sourcePath, exists: false };
      }
    })
  );

  const validSources = sourceExistenceChecks
    .filter(check => {
      if (!check.exists) {
        failures.push({ path: check.path, error: "Source path not found" });
        return false;
      }
      return true;
    })
    .map(check => check.path);

  let destDirAllowed = true;
  if (destinationPath) {
    const dbDestDir = await StorageDbRepository.directoryByPath(destinationPath);
    if (dbDestDir && !dbDestDir.allowUploads) {
      destDirAllowed = false;
    }
  }

  return { validSources, failures, destDirAllowed };
}

/**
 * Orchestrates a bulk operation (copy, move, etc.) with validation and error handling
 */
export async function executeBulkOperation<TContext, TExtraData = void>(params: {
  ctx: TContext;
  sourcePaths: string[];
  destinationPath: string;
  existsFn: (ctx: TContext, path: string) => Promise<boolean>;
  processFn: (
    ctx: TContext,
    sourcePath: string,
    extraData: TExtraData
  ) => Promise<Types.FileInfo | Types.DirectoryInfo | null>;
  beforeProcess?: (ctx: TContext, validSources: string[]) => Promise<TExtraData>;
  operationName: string;
}): Promise<Types.BulkOperationResult> {
  const { ctx, sourcePaths, destinationPath, existsFn, processFn, beforeProcess, operationName } = params;
  const { validSources, failures, destDirAllowed } = await validateBulkOperation(
    ctx,
    sourcePaths,
    destinationPath,
    existsFn
  );

  const successfulItems: Array<Types.FileInfo | Types.DirectoryInfo> = [];
  let successCount = 0;

  if (validSources.length === 0) {
    return formatBulkOperationResult(successCount, failures, successfulItems, operationName);
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
      successfulItems,
    };
  }

  const extraData = beforeProcess ? await beforeProcess(ctx, validSources) : (undefined as unknown as TExtraData);

  for (const sourcePath of validSources) {
    try {
      const result = await processFn(ctx, sourcePath, extraData);
      if (result) {
        successfulItems.push(result);
      }
      successCount++;
    } catch (error) {
      failures.push({
        path: sourcePath,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return formatBulkOperationResult(successCount, failures, successfulItems, operationName);
}

/**
 * Formats the final result of a bulk operation
 */
export function formatBulkOperationResult(
  successCount: number,
  failures: Array<{ path: string; error: string }>,
  successfulItems: Array<Types.FileInfo | Types.DirectoryInfo>,
  operationName: string
): Types.BulkOperationResult {
  return {
    success: failures.length === 0,
    message:
      failures.length === 0
        ? `All items ${operationName} successfully`
        : `${successCount} items ${operationName}, ${failures.length} failed`,
    successCount,
    failureCount: failures.length,
    failures,
    successfulItems,
  };
}
