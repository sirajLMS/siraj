import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import * as Pothos from "@/backend/graphql/pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { sanitizeStoragePath, validateStoragePath } from "@/backend/lib/path-validator";
import { StorageService } from "@/backend/services/storage";
import { getStorageService } from "@/backend/storage/storage.service";
import type { ErrorsLabels } from "@/shared/locale";

// IMPORTANT: Every resolver that accepts a user-supplied storage path MUST
// (1) authenticate the caller, (2) sanitize the path, (3) validate the path
// against traversal attacks, and (4) enforce per-user ownership / storage-manage
// scope before delegating to the storage service. The previous implementation
// trusted the raw client-supplied path and relied on a vague "service layer is
// responsible" comment — that allowed any logged-in user to list/fileInfo any
// storage path (BOLA / IDOR).

type StorageAuthMode = "owner" | "admin";

/**
 * Authenticate the caller, sanitize + validate the storage path, and enforce
 * the requested scope.
 *
 * - `"owner"` (user-browsing resolvers): when a path is supplied, the caller
 *   must either hold `STORAGE_MANAGE` or be the file's owner (via file usages).
 *   When the path is empty/omitted (root browse), the caller must hold
 *   `STORAGE_MANAGE` (broad bucket-wide access).
 * - `"admin"` (`storageStats`): the caller must always hold `STORAGE_MANAGE`,
 *   regardless of whether a path was supplied.
 *
 * @returns The sanitized path (empty string when none was supplied) and the
 * localized error labels for downstream use.
 */
async function authorizeStoragePath(
  ctx: BaseContext,
  rawPath: string | undefined | null,
  mode: StorageAuthMode
): Promise<{ sanitizedPath: string; tErrors: ErrorsLabels }> {
  const userId = await requireAuth(ctx);
  const tErrors = ctx.t().errorsTranslations;
  const sanitizedPath = rawPath ? sanitizeStoragePath(rawPath) : "";
  const hasPath = Boolean(rawPath);
  if (hasPath) {
    validateStoragePath(sanitizedPath);
  }
  if (mode === "admin" || !hasPath) {
    // Admin mode always requires STORAGE_MANAGE; owner mode with no path
    // (root/bucket-wide browse) also falls back to STORAGE_MANAGE since there
    // is no specific file to attribute ownership to.
    await StorageService.requireStorageManage(userId, tErrors);
  } else {
    await StorageService.requireStorageManageOrOwner(userId, sanitizedPath, tErrors);
  }
  return { sanitizedPath, tErrors };
}

gqlSchemaBuilder.queryFields(t => ({
  listFiles: t.field({
    authScopes: { loggedIn: true },
    type: Pothos.StorageObjectListPothosObject,
    args: {
      input: t.arg({
        type: Pothos.ListFileInputPothosObject,
        required: true,
      }),
    },
    resolve: async (_parent, { input }, ctx) => {
      const { sanitizedPath } = await authorizeStoragePath(ctx, input.path, "owner");
      const storageService = await getStorageService();
      return await storageService.listFiles({ ...input, path: sanitizedPath });
    },
  }),

  fileInfo: t.field({
    authScopes: { loggedIn: true },
    type: Pothos.FileInfoPothosObject,
    args: {
      path: t.arg.string({ required: true, directives: { constraint: { maxLength: 1024 } } }),
    },
    nullable: true,
    resolve: async (_parent, { path }, ctx) => {
      const { sanitizedPath } = await authorizeStoragePath(ctx, path, "owner");
      const storageService = await getStorageService();
      return await storageService.fileInfoByPath(sanitizedPath);
    },
  }),

  folderInfo: t.field({
    authScopes: { loggedIn: true },
    type: Pothos.DirectoryInfoPothosObject,
    args: {
      path: t.arg.string({ required: true, directives: { constraint: { maxLength: 1024 } } }),
    },
    resolve: async (_parent, { path }, ctx) => {
      const { sanitizedPath } = await authorizeStoragePath(ctx, path, "owner");
      const storageService = await getStorageService();
      return await storageService.directoryInfoByPath(sanitizedPath);
    },
  }),

  searchFiles: t.field({
    authScopes: { loggedIn: true },
    type: Pothos.StorageObjectListPothosObject,
    args: {
      searchTerm: t.arg.string({ required: true, directives: { constraint: { maxLength: 256 } } }),
      fileType: t.arg.string({
        required: false,
        description: "File type filter (optional)",
        directives: { constraint: { maxLength: 50 } },
      }),
      folder: t.arg.string({
        required: false,
        description: "Folder to search in (optional, searches entire bucket if not specified)",
        directives: { constraint: { maxLength: 1024 } },
      }),
      limit: t.arg.int({
        required: false,
        defaultValue: 50,
        description: "Maximum number of results",
        directives: { constraint: { min: 1, max: 200 } },
      }),
    },
    resolve: async (_parent, { searchTerm, fileType, folder, limit }, ctx) => {
      const { sanitizedPath } = await authorizeStoragePath(ctx, folder, "owner");
      const storageService = await getStorageService();
      const input = {
        path: sanitizedPath,
        limit: Math.min(limit ?? 50, 200),
        searchTerm,
        fileType,
      };
      return await storageService.listFiles(input);
    },
  }),

  storageStats: t.field({
    authScopes: { loggedIn: true },
    type: Pothos.StorageStatsPothosObject,
    args: {
      path: t.arg.string({
        required: false,
        description: "Folder path to get stats for (optional, gets stats for entire bucket if not specified)",
        directives: { constraint: { maxLength: 1024 } },
      }),
    },
    resolve: async (_parent, { path }, ctx) => {
      const { sanitizedPath } = await authorizeStoragePath(ctx, path, "admin");
      const storageService = await getStorageService();
      return await storageService.storageStatistics(sanitizedPath);
    },
  }),

  directoryChildren: t.field({
    authScopes: { loggedIn: true },
    type: [Pothos.DirectoryInfoPothosObject],
    args: {
      path: t.arg.string({
        required: false,
        description: "Parent directory path (empty or null for root level)",
        directives: { constraint: { maxLength: 1024 } },
      }),
    },
    resolve: async (_parent, { path }, ctx) => {
      const { sanitizedPath } = await authorizeStoragePath(ctx, path, "owner");
      const storageService = await getStorageService();
      return await storageService.fetchDirectoryChildren(sanitizedPath);
    },
  }),

  fileUsage: t.field({
    authScopes: { loggedIn: true },
    type: Pothos.FileUsageResultPothosObject,
    args: {
      input: t.arg({
        type: Pothos.FileUsageCheckInputPothosObject,
        required: true,
      }),
    },
    resolve: async (_parent, { input }, ctx) => {
      const { sanitizedPath } = await authorizeStoragePath(ctx, input.path, "owner");
      return await StorageService.checkFileUsage({ ...input, path: sanitizedPath });
    },
  }),
}));
