import fs from "node:fs/promises";
import path from "node:path";
import logger from "@/backend/lib/logger";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import { extToMime } from "@/utils/storage.utils";
import type { LocalContext } from "../types";
import { getAbsolutePath } from "../utils";

export async function storageStatistics(
	ctx: LocalContext,
	searchPath?: string | null,
): Promise<Types.StorageStats> {
	try {
		const targetPath = searchPath || "";
		const absolutePath = getAbsolutePath(ctx.basePath, targetPath);

		let totalSize = BigInt(0);
		const fileTypeMap = new Map<
			Types.FileTypes,
			{ count: number; size: bigint }
		>();
		const directories = new Set<string>();

		const walkDirectory = async (dirPath: string, relativePath: string) => {
			const entries = await fs.readdir(dirPath, { withFileTypes: true });

			for (const entry of entries) {
				const entryAbsolutePath = path.join(dirPath, entry.name);
				const entryRelativePath = relativePath
					? `${relativePath}/${entry.name}`
					: entry.name;

				if (entry.isDirectory()) {
					directories.add(entryRelativePath);
					await walkDirectory(entryAbsolutePath, entryRelativePath);
				} else if (entry.isFile()) {
					const stats = await fs.stat(entryAbsolutePath);
					const size = BigInt(stats.size);
					totalSize += size;

					const ext = path.extname(entry.name).toLowerCase().slice(1);
					const contentType = extToMime[ext] || "application/octet-stream";

					const fileType = StorageUtils.getFileTypeFromContentType(contentType);
					const current = fileTypeMap.get(fileType) || {
						count: 0,
						size: BigInt(0),
					};
					fileTypeMap.set(fileType, {
						count: current.count + 1,
						size: current.size + size,
					});
				}
			}
		};

		try {
			await fs.access(absolutePath);
			const stats = await fs.stat(absolutePath);

			if (stats.isDirectory()) {
				await walkDirectory(absolutePath, "");
			} else if (stats.isFile()) {
				const size = BigInt(stats.size);
				totalSize = size;

				const ext = path.extname(targetPath).toLowerCase().slice(1);
				const contentType = extToMime[ext] || "application/octet-stream";

				const fileType = StorageUtils.getFileTypeFromContentType(contentType);
				fileTypeMap.set(fileType, { count: 1, size });
			}
		} catch {
			return {
				totalFiles: 0,
				totalSize: BigInt(0),
				fileTypeBreakdown: [],
				directoryCount: 0,
			};
		}

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
