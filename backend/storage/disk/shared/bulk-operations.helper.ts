import { StorageDbRepository } from "@/backend/db/repo/storage";
import type * as Types from "@/backend/types";
import { type FileErrors, getServerTranslations } from "@/shared/locale";

/**
 * Validates source paths for existence and destination directory for upload permissions
 */
export async function validateBulkOperation<TContext>(
  ctx: TContext,
  sourcePaths: string[],
  destinationPath: string | undefined,
  existsFn: (ctx: TContext, path: string) => Promise<boolean>,
  tFile: FileErrors
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
        failures.push({ path: check.path, error: tFile.sourcePathNotFound });
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
    extraData: TExtraData | undefined
  ) => Promise<Types.FileInfo | Types.DirectoryInfo | null>;
  beforeProcess?: (ctx: TContext, validSources: string[]) => Promise<TExtraData>;
  operationName: string;
  locale?: string;
}): Promise<Types.BulkOperationResult> {
  const { ctx, sourcePaths, destinationPath, existsFn, processFn, beforeProcess, operationName, locale } = params;
  const tFile = getServerTranslations(locale ?? "en").errorsTranslations.file;
  const { validSources, failures, destDirAllowed } = await validateBulkOperation(
    ctx,
    sourcePaths,
    destinationPath,
    existsFn,
    tFile
  );

  const successfulItems: Array<Types.FileInfo | Types.DirectoryInfo> = [];
  let successCount = 0;

  if (validSources.length === 0) {
    return formatBulkOperationResult(successCount, failures, successfulItems, operationName, locale);
  }

  if (!destDirAllowed) {
    return {
      success: false,
      message: tFile.uploadsNotAllowedToDestination,
      successCount: 0,
      failureCount: validSources.length,
      failures: validSources.map(path => ({
        path,
        error: tFile.uploadsNotAllowedToDestination,
      })),
      successfulItems,
    };
  }

  const extraData: TExtraData | undefined = beforeProcess ? await beforeProcess(ctx, validSources) : undefined;

  const results = await Promise.all(
    validSources.map(async sourcePath => {
      try {
        const result = await processFn(ctx, sourcePath, extraData);
        return { ok: true as const, result, sourcePath };
      } catch (error) {
        return {
          ok: false as const,
          sourcePath,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    })
  );

  for (const r of results) {
    if (r.ok) {
      if (r.result) {
        successfulItems.push(r.result);
      }
      successCount++;
    } else {
      failures.push({ path: r.sourcePath, error: r.error });
    }
  }

  return formatBulkOperationResult(successCount, failures, successfulItems, operationName, locale);
}

/**
 * Formats the final result of a bulk operation
 */
export function formatBulkOperationResult(
  successCount: number,
  failures: Array<{ path: string; error: string }>,
  successfulItems: Array<Types.FileInfo | Types.DirectoryInfo>,
  operationName: string,
  locale?: string
): Types.BulkOperationResult {
  const tFile = getServerTranslations(locale ?? "en").errorsTranslations.file;
  return {
    success: failures.length === 0,
    message:
      failures.length === 0
        ? tFile.allItemsProcessedSuccessfully(operationName)
        : tFile.itemsProcessedWithFailures(successCount, failures.length, operationName),
    successCount,
    failureCount: failures.length,
    failures,
    successfulItems,
  };
}
