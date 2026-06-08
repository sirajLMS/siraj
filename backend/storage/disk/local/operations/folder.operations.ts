import type { Stats } from "node:fs";
import fs from "node:fs/promises";
import { StorageDbRepository } from "@/backend/db/repo";
import logger from "@/backend/lib/logger";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import { StorageValidationError } from "../../storage.service.interface";
import type { LocalContext } from "../types";
import { cleanLocalPath, getAbsolutePath } from "../utils";

export async function createFolder(
	ctx: LocalContext,
	input: Types.FolderCreateInput,
): Promise<Types.FileOperationResult> {
	try {
		const fullPath = cleanLocalPath(input.path);

		const validationError = await StorageUtils.validatePath(fullPath);
		if (validationError) {
			throw new StorageValidationError(validationError);
		}

		const parentPath = fullPath.substring(0, fullPath.lastIndexOf("/"));
		if (parentPath.length > 0) {
			const parentDir = await StorageDbRepository.directoryByPath(parentPath);
			if (parentDir && !parentDir.allowCreateSubDirs) {
				return {
					success: false,
					message: "Creating subdirectories not allowed in parent directory",
				};
			}
		}

		const absolutePath = getAbsolutePath(ctx.basePath, fullPath);
		await fs.mkdir(absolutePath, { recursive: true, mode: 0o755 });

		const hasCustomPermissions =
			input.permissions != null ||
			input.protected === true ||
			input.protectChildren === true;

		let newDirectoryInfo: Types.DirectoryInfo;

		if (hasCustomPermissions) {
			try {
				const directoryEntity = await StorageDbRepository.createDirectory({
					...input,
					path: fullPath,
				});

				const bucketDir: Types.BucketDirectory = {
					path: fullPath,
					createdAt: new Date(),
					lastModified: new Date(),
					isPublic: fullPath.startsWith("public"),
				};

				newDirectoryInfo = StorageUtils.combineDirectoryData(
					bucketDir,
					directoryEntity,
				);
			} catch (error) {
				logger.warn(
					`Failed to save folder permissions in DB: ${error instanceof Error ? error.message : String(error)}`,
				);
				newDirectoryInfo = StorageUtils.createDirectoryFromPath(fullPath);
			}
		} else {
			newDirectoryInfo = StorageUtils.createDirectoryFromPath(fullPath);
		}

		return {
			success: true,
			message: "Folder created successfully",
			data: newDirectoryInfo,
		};
	} catch (error) {
		logger.error(`Failed to create folder: ${input.path}`, error);
		return {
			success: false,
			message: `Failed to create folder: ${error instanceof Error ? error.message : String(error)}`,
		};
	}
}

export async function directoryInfoByPath(
	ctx: LocalContext,
	dirPath: string,
): Promise<Types.DirectoryInfo | null> {
	try {
		const dbDirectory = await StorageDbRepository.directoryByPath(dirPath);

		const absolutePath = getAbsolutePath(ctx.basePath, dirPath);
		let dirExists = false;
		let stats: Stats | null = null;

		try {
			stats = await fs.stat(absolutePath);
			dirExists = stats.isDirectory();
		} catch {
			dirExists = false;
		}

		if (!dirExists && !dbDirectory) {
			return null;
		}

		const bucketDir: Types.BucketDirectory = {
			path: dirPath,
			createdAt: stats?.birthtime || new Date(),
			lastModified: stats?.mtime || new Date(),
			isPublic: dirPath.startsWith("public"),
		};

		return StorageUtils.combineDirectoryData(bucketDir, dbDirectory);
	} catch (error) {
		logger.error(`Failed to get directory info: ${dirPath}`, error);
		return null;
	}
}
