import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import * as Pothos from "@/backend/graphql/pothos";
import { authorizeStoragePath } from "@/backend/graphql/query/storage/storage.query.helpers";
import { StorageService } from "@/backend/services/storage";
import { getStorageService } from "@/backend/storage/storage.service";

// Every resolver that accepts a user-supplied storage path delegates its
// authentication, sanitization, traversal validation, and scope enforcement to
// `authorizeStoragePath` before it reaches the storage service.

gqlSchemaBuilder.queryField("listFiles", t =>
  t.field({
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
  })
);

gqlSchemaBuilder.queryField("fileInfo", t =>
  t.field({
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
  })
);

gqlSchemaBuilder.queryField("folderInfo", t =>
  t.field({
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
  })
);

gqlSchemaBuilder.queryField("searchFiles", t =>
  t.field({
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
  })
);

gqlSchemaBuilder.queryField("storageStats", t =>
  t.field({
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
  })
);

gqlSchemaBuilder.queryField("directoryChildren", t =>
  t.field({
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
  })
);

gqlSchemaBuilder.queryField("fileUsage", t =>
  t.field({
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
  })
);
