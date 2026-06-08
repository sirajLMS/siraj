import fs from "node:fs/promises";
import path from "node:path";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import { extToMime } from "@/utils/storage.utils";
import type { LocalContext } from "./types";
import { calculateFileHash, getAbsolutePath } from "./utils";

export async function processFile(
	ctx: LocalContext,
	filePath: string,
	dbFile: Types.FileEntity | undefined,
): Promise<Types.FileInfo> {
	const absoluteFilePath = getAbsolutePath(ctx.basePath, filePath);
	const stats = await fs.stat(absoluteFilePath);
	const contentHash = await calculateFileHash(absoluteFilePath);
	const directoryPath = StorageUtils.extractDirectoryPath(filePath);

	const ext = path.extname(filePath).toLowerCase().slice(1);
	const contentType = extToMime[ext] || "application/octet-stream";

	const bucketFile: Types.BucketFile = {
		path: filePath,
		directoryPath,
		size: BigInt(stats.size),
		contentType,
		contentHash,
		createdAt: stats.birthtime,
		lastModified: stats.mtime,
		url: `${ctx.baseUrl}/api/storage/files/${filePath}`,
		mediaLink: undefined,
		fileType: StorageUtils.getFileTypeFromContentType(contentType),
		isPublic: filePath.startsWith("public"),
	};

	return StorageUtils.combineFileData(bucketFile, dbFile);
}

export async function processDirectory(
	ctx: LocalContext,
	dirPath: string,
	dbDir: Types.DirectoryEntity | undefined,
): Promise<Types.DirectoryInfo> {
	const absoluteDirPath = getAbsolutePath(ctx.basePath, dirPath);
	const stats = await fs.stat(absoluteDirPath);

	let fileCount = 0;
	try {
		const dirEntries = await fs.readdir(absoluteDirPath);
		fileCount = dirEntries.length;
	} catch {
		// Ignore if directory doesn't exist or is inaccessible
	}

	const bucketDir: Types.BucketDirectory = {
		path: dirPath,
		createdAt: stats.birthtime,
		lastModified: stats.mtime,
		isPublic: dirPath.startsWith("public"),
	};

	return StorageUtils.combineDirectoryData(bucketDir, dbDir, fileCount);
}
