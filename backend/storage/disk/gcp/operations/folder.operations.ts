import { StorageDbRepository } from "@/backend/db/repo";
import logger from "@/backend/lib/logger";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import { StorageValidationError } from "../../storage.service.interface";
import type { GcpContext } from "../types";
import { cleanGcsPath } from "../utils";

export async function createFolder(
	ctx: GcpContext,
	input: Types.FolderCreateInput,
): Promise<Types.FileOperationResult> {
	try {
		const pathErr = await StorageUtils.validatePath(input.path);
		if (pathErr) {
			throw new StorageValidationError(pathErr);
		}

		const fullPath = cleanGcsPath(input.path);

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

		const folderPath = `${fullPath}/`;
		const file = ctx.bucket.file(folderPath);
		await file.save("", {
			contentType: "application/x-directory",
		});

		const hasCustomPermissions =
			input.permissions != null ||
			input.protected === true ||
			input.protectChildren === true;

		let newDirectoryInfo: Types.DirectoryInfo;

		if (hasCustomPermissions) {
			try {
				const directoryEntity =
					await StorageDbRepository.createDirectory(input);

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
	ctx: GcpContext,
	path: string,
): Promise<Types.DirectoryInfo | null> {
	const dbDirectory = await StorageDbRepository.directoryByPath(path);

	const folderPath = `${path}/`;
	const [files] = await ctx.bucket.getFiles({
		prefix: folderPath,
		maxResults: 1,
	});

	const folderExists = files.length > 0;

	if (!folderExists && !dbDirectory) {
		return null;
	}

	const bucketDir: Types.BucketDirectory = {
		path,
		createdAt: new Date(),
		lastModified: new Date(),
		isPublic: path.startsWith("public"),
	};

	return StorageUtils.combineDirectoryData(bucketDir, dbDirectory);
}
