import type { GetFilesResponse } from "@google-cloud/storage";
import { StorageDbRepository } from "@/backend/db/repo";
import * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import { OrderSortDirection } from "@/lib/enum";
import { getFolderFileCounts } from "../shared";
import type { GcpContext, GcsApiResponse } from "../types";
import { cleanGcsPath } from "../utils";

export async function listFiles(
	ctx: GcpContext,
	input: Types.FilesListSearchInput,
): Promise<Types.StorageObjectList> {
	const prefix = cleanGcsPath(input.path || "", true);
	const delimiter = "/";

	const response: GetFilesResponse = await ctx.bucket.getFiles({
		prefix,
		delimiter,
		autoPaginate: false,
	});

	const [files] = response;
	const apiResponse = response[2] as GcsApiResponse | undefined;

	const items: Array<Types.FileInfo | Types.DirectoryInfo> = [];

	const filePaths: string[] = [];
	const validFiles = files.filter((file) => file.name !== prefix);

	for (const file of validFiles) {
		filePaths.push(file.name);
	}

	const dirPaths: string[] = [];
	if (apiResponse?.prefixes) {
		for (const dirPrefix of apiResponse.prefixes) {
			const dirPath = dirPrefix.replace(/\/$/, "");
			dirPaths.push(dirPath);
		}
	}

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

	const folderFileCountMap = await getFolderFileCounts(
		ctx,
		apiResponse?.prefixes || [],
		dirPaths,
	);

	for (const file of validFiles) {
		const bucketFile = StorageUtils.blobToFileInfo(
			file.metadata,
			ctx.gcpBaseUrl,
		);
		const dbFile = dbFileMap.get(file.name);
		const fileInfo = StorageUtils.combineFileData(bucketFile, dbFile);
		items.push(fileInfo);
	}

	if (apiResponse?.prefixes) {
		for (const dirPrefix of apiResponse.prefixes) {
			const dirPath = dirPrefix.replace(/\/$/, "");
			const dbDir = dbDirMap.get(dirPath);

			const bucketDir: Types.BucketDirectory = {
				path: dirPath,
				createdAt: new Date(),
				lastModified: new Date(),
				isPublic: dirPath.startsWith("public"),
			};

			const fileCount = folderFileCountMap.get(dirPath) || 0;
			const dirInfo = StorageUtils.combineDirectoryData(
				bucketDir,
				dbDir,
				fileCount,
			);
			items.push(dirInfo);
		}
	}

	let filteredItems = items;
	if (input.searchTerm && input.searchTerm.length > 0) {
		const searchLower = input.searchTerm.toLowerCase();
		filteredItems = items.filter((item) =>
			item.name.toLowerCase().includes(searchLower),
		);
	}

	filteredItems = StorageUtils.filterStorageItems(filteredItems, {
		includeDirectories: input.includeDirectories ?? null,
		fileType: input.fileType ?? null,
		fileTypes: input.fileTypes ?? null,
		contentTypes: input.contentTypes ?? null,
	});

	const sortedItems = StorageUtils.sortItems(
		filteredItems,
		input.sortBy || Types.FileSortField.NAME,
		input.sortDirection || OrderSortDirection.ASC,
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

export async function fetchDirectoryChildren(
	ctx: GcpContext,
	path?: string,
): Promise<Types.DirectoryInfo[]> {
	const searchPath = !path || path.length === 0 ? "public" : cleanGcsPath(path);
	const prefix = cleanGcsPath(searchPath, true);

	const dbDirectories =
		await StorageDbRepository.directoriesByParentPath(searchPath);
	const dbDirectoriesByPath = new Map(
		dbDirectories.map((dir) => [dir.path, dir]),
	);

	const responseData: GetFilesResponse = await ctx.bucket.getFiles({
		prefix,
		delimiter: "/",
		autoPaginate: false,
	});

	const directories: Types.DirectoryInfo[] = [];
	const apiResponse = responseData[2] as GcsApiResponse | undefined;

	if (apiResponse?.prefixes) {
		for (const dirPrefix of apiResponse.prefixes) {
			const dirPath = dirPrefix.replace(/\/$/, "");
			const dbDir = dbDirectoriesByPath.get(dirPath);

			const bucketDir: Types.BucketDirectory = {
				path: dirPath,
				createdAt: new Date(),
				lastModified: new Date(),
				isPublic: dirPath.startsWith("public"),
			};

			directories.push(StorageUtils.combineDirectoryData(bucketDir, dbDir));
		}
	}

	return directories;
}
