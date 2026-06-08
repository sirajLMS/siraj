import logger from "@/backend/lib/logger";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import { extToMime } from "@/utils/storage.utils";
import { getBlobs } from "../shared";
import type { VercelContext } from "../types";

export async function storageStatistics(
	ctx: VercelContext,
	searchPath?: string | null,
): Promise<Types.StorageStats> {
	try {
		const targetPath = searchPath || "";
		const prefix = targetPath ? `${targetPath}/` : "";

		const allBlobs = await getBlobs(ctx, prefix);

		if (allBlobs.length === 0) {
			return {
				totalFiles: 0,
				totalSize: BigInt(0),
				fileTypeBreakdown: [],
				directoryCount: 0,
			};
		}

		const { totalSize, fileTypeMap, directories } =
			processStorageStatisticsBlobs(allBlobs, prefix, targetPath);

		const fileTypeBreakdown = Array.from(fileTypeMap.entries()).map(
			([type, data]) => ({
				type,
				count: data.count,
				size: data.size,
			}),
		);

		const totalFiles = Array.from(fileTypeMap.values()).reduce(
			(sum, data) => sum + data.count,
			0,
		);

		return {
			totalFiles,
			totalSize,
			fileTypeBreakdown,
			directoryCount: directories.size,
		};
	} catch (error) {
		logger.error("Failed to get storage statistics", error);
		return {
			totalFiles: 0,
			totalSize: BigInt(0),
			fileTypeBreakdown: [],
			directoryCount: 0,
		};
	}
}

function processStorageStatisticsBlobs(
	allBlobs: Array<{ size: number | bigint; pathname: string }>,
	prefix: string,
	targetPath: string,
) {
	let totalSize = BigInt(0);
	const fileTypeMap = new Map<
		Types.FileTypes,
		{ count: number; size: bigint }
	>();
	const directories = new Set<string>();

	for (const blob of allBlobs) {
		const size = BigInt(blob.size);
		totalSize += size;

		const ext = blob.pathname.split(".").pop()?.toLowerCase() || "";
		const contentType = extToMime[ext] || "application/octet-stream";

		const fileType = StorageUtils.getFileTypeFromContentType(contentType);
		const current = fileTypeMap.get(fileType) || { count: 0, size: BigInt(0) };
		fileTypeMap.set(fileType, {
			count: current.count + 1,
			size: current.size + size,
		});

		const relativePath = blob.pathname.startsWith(prefix)
			? blob.pathname.slice(prefix.length)
			: blob.pathname;

		const lastSlashIndex = relativePath.lastIndexOf("/");
		if (lastSlashIndex !== -1) {
			const dirPath = relativePath.substring(0, lastSlashIndex);
			const fullDirPath = targetPath ? `${targetPath}/${dirPath}` : dirPath;

			const parts = fullDirPath.split("/");
			let currentPath = "";
			for (const part of parts) {
				currentPath = currentPath ? `${currentPath}/${part}` : part;
				directories.add(currentPath);
			}
		}
	}

	return { totalSize, fileTypeMap, directories };
}
