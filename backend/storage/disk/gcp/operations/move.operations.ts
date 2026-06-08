import { StorageDbRepository } from "@/backend/db/repo";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import { getValidSourcePaths } from "../shared";
import type { GcpContext, GenericOperationResult } from "../types";
import { fileInfoByPath } from "./file.operations";
import { directoryInfoByPath } from "./folder.operations";

export async function moveItems(
	ctx: GcpContext,
	input: Types.StorageItemsMoveInput,
): Promise<Types.BulkOperationResult> {
	let successCount = 0;
	let failureCount = 0;
	const failures: Array<{ path: string; error: string }> = [];
	const successfulItems: Array<Types.FileInfo | Types.DirectoryInfo> = [];

	const validSourcesResult = await getValidSourcePaths(ctx, input.sourcePaths);
	const validSources = validSourcesResult.validSources;
	failureCount += validSourcesResult.failureCount;
	failures.push(...validSourcesResult.failures);

	if (validSources.length === 0) {
		return {
			success: failureCount === 0,
			message: "No valid source files to move",
			successCount,
			failureCount,
			failures,
			successfulItems,
		};
	}

	const sourceDirectories = [
		...new Set(
			validSources.map((path) => path.substring(0, path.lastIndexOf("/"))),
		),
	];

	const [dbFiles, dbDirectories, dbSourceDirs, dbDestDir] = await Promise.all([
		StorageDbRepository.filesByPaths(validSources),
		StorageDbRepository.directoriesByPaths(validSources),
		StorageDbRepository.directoriesByPaths(sourceDirectories),
		StorageDbRepository.directoryByPath(input.destinationPath),
	]);

	const dbFileMap = new Map<string, Types.FileEntity>(
		dbFiles.map((f) => [f.path, f]),
	);
	const dbDirectoryMap = new Map<string, Types.DirectoryEntity>(
		dbDirectories.map((d) => [d.path, d]),
	);
	const dbSourceDirMap = new Map<string, Types.DirectoryEntity>(
		dbSourceDirs.map((d) => [d.path, d]),
	);

	if (dbDestDir && !dbDestDir.allowUploads) {
		return {
			success: false,
			message: "Uploads not allowed to destination directory",
			successCount: 0,
			failureCount: validSources.length,
			failures: validSources.map((path) => ({
				path,
				error: "Uploads not allowed to destination directory",
			})),
			successfulItems: [],
		};
	}

	for (const sourcePath of validSources) {
		const result: GenericOperationResult<Types.FileInfo | Types.DirectoryInfo> =
			await moveSingleItem(
				ctx,
				sourcePath,
				input.destinationPath,
				dbFileMap.get(sourcePath),
				dbDirectoryMap.get(sourcePath),
				dbSourceDirMap.get(
					sourcePath.substring(0, sourcePath.lastIndexOf("/")),
				),
			);

		if (result.success && result.data) {
			successCount++;
			successfulItems.push(result.data);
		} else {
			failureCount++;
			failures.push({
				path: sourcePath,
				error: result.message || "Unknown error",
			});
		}
	}

	return {
		success: failureCount === 0,
		message:
			failureCount === 0
				? "All items moved successfully"
				: `${successCount} items moved, ${failureCount} failed`,
		successCount,
		failureCount,
		failures,
		successfulItems,
	};
}

async function moveSingleItem(
	ctx: GcpContext,
	sourcePath: string,
	destinationPath: string,
	dbFile: Types.FileEntity | undefined,
	dbDirectory: Types.DirectoryEntity | undefined,
	dbSourceDir: Types.DirectoryEntity | undefined,
): Promise<GenericOperationResult<Types.FileInfo | Types.DirectoryInfo>> {
	try {
		const sourceDir = sourcePath.substring(0, sourcePath.lastIndexOf("/"));
		if (dbSourceDir && !dbSourceDir.allowMove) {
			return {
				success: false,
				message: `Move not allowed from directory: ${sourceDir}`,
			};
		}

		const fileName = StorageUtils.extractFileName(sourcePath);
		const newPath = `${destinationPath.replace(/\/$/, "")}/${fileName}`;

		const sourceFile = ctx.bucket.file(sourcePath);
		const destFile = ctx.bucket.file(newPath);
		await sourceFile.copy(destFile);
		await sourceFile.delete();

		let updatedItem: Types.FileInfo | Types.DirectoryInfo | null = null;

		if (dbFile) {
			await StorageDbRepository.updateFile({
				id: dbFile.id,
				path: newPath,
				isProtected: dbFile.isProtected,
			});
			updatedItem = await fileInfoByPath(ctx, newPath);
		} else if (dbDirectory) {
			await StorageDbRepository.updateDirectory({
				...dbDirectory,
				path: newPath,
			});
			updatedItem = await directoryInfoByPath(ctx, newPath);
		} else {
			updatedItem = await fileInfoByPath(ctx, newPath);
		}

		return updatedItem
			? { success: true, data: updatedItem }
			: { success: false, message: "Failed to retrieve moved item info" };
	} catch (error) {
		return {
			success: false,
			message: error instanceof Error ? error.message : String(error),
		};
	}
}
