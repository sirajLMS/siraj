import { StorageDbRepository } from "@/backend/db/repo";
import * as Pothos from "@/backend/graphql/pothos";
import { getStorageService } from "@/backend/storage/storage.service";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

// IMPORTANT: Service layer must verify user has access to the requested storage path
// These queries accept arbitrary path parameters — the service layer is responsible
// for enforcing per-user path access restrictions to prevent IDOR.

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
    resolve: async (_parent, { input }) => {
      const storageService = await getStorageService();
      return await storageService.listFiles(input);
    },
  }),

  fileInfo: t.field({
    authScopes: { loggedIn: true },
    type: Pothos.FileInfoPothosObject,
    args: {
      path: t.arg.string({ required: true }),
    },
    nullable: true,
    resolve: async (_parent, { path }) => {
      const storageService = await getStorageService();
      return await storageService.fileInfoByPath(path);
    },
  }),

  folderInfo: t.field({
    authScopes: { loggedIn: true },
    type: Pothos.DirectoryInfoPothosObject,
    args: {
      path: t.arg.string({ required: true }),
    },
    resolve: async (_parent, { path }) => {
      const storageService = await getStorageService();
      return await storageService.directoryInfoByPath(path);
    },
  }),

  searchFiles: t.field({
    authScopes: { loggedIn: true },
    type: Pothos.StorageObjectListPothosObject,
    args: {
      searchTerm: t.arg.string({ required: true }),
      fileType: t.arg.string({
        required: false,
        description: "File type filter (optional)",
      }),
      folder: t.arg.string({
        required: false,
        description: "Folder to search in (optional, searches entire bucket if not specified)",
      }),
      limit: t.arg.int({
        required: false,
        defaultValue: 50,
        description: "Maximum number of results",
      }),
    },
    resolve: async (_parent, { searchTerm, fileType, folder, limit }) => {
      const storageService = await getStorageService();
      const input = {
        path: folder || "",
        limit: limit || 50,
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
      }),
    },
    resolve: async (_parent, { path }) => {
      const storageService = await getStorageService();
      return await storageService.storageStatistics(path);
    },
  }),

  directoryChildren: t.field({
    authScopes: { loggedIn: true },
    type: [Pothos.DirectoryInfoPothosObject],
    args: {
      path: t.arg.string({
        required: false,
        description: "Parent directory path (empty or null for root level)",
      }),
    },
    resolve: async (_parent, { path }) => {
      const storageService = await getStorageService();
      const children = await storageService.fetchDirectoryChildren(path);
      return children;
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
    resolve: async (_parent, { input }) => await StorageDbRepository.checkFileUsage(input),
  }),
}));
