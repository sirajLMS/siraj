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
