import fs from "node:fs/promises";
import path from "node:path";
import { StorageDbRepository } from "@/backend/db/repo";
import logger from "@/backend/lib/logger";
import type * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import type { LocalContext } from "../types";
import { ensureDirectory, getAbsolutePath } from "../utils";
import { fileInfoByPath } from "./file.operations";
import { directoryInfoByPath } from "./folder.operations";

export async function moveItems(
	ctx: LocalContext,
	input: Types.StorageItemsMoveInput,
): Promise<Types.BulkOperationResult> {
	let successCount = 0;
	const failures: Array<{ path: string; error: string }> = [];
	const successfulItems: Array<Types.FileInfo | Types.DirectoryInfo> = [];

	const sourceExistenceChecks = await Promise.all(
		input.sourcePaths.map(async (sourcePath) => {
			try {
				const absolutePath = getAbsolutePath(ctx.basePath, sourcePath);
				await fs.access(absolutePath);
				return { path: sourcePath, exists: true };
			} catch {
				return { path: sourcePath, exists: false };
			}
		}),
	);

	const validSources = sourceExistenceChecks
		.filter((check) => {
			if (!check.exists) {
				failures.push({ path: check.path, error: "Source path not found" });
				return false;
			}
			return true;
		})
		.map((check) => check.path);

	if (validSources.length === 0) {
		return {
			success: failures.length === 0,
			message: "No valid source files to move",
			successCount,
			failureCount: failures.length,
			failures,
			successfulItems,
		};
	}

	const sourceDirectories = [
		...new Set(
			validSources.map((path) => path.substring(0, path.lastIndexOf("/"))),
		),
	];

	logger.info("💾 moveItems: About to batch load DB entities", {
		validSourcesCount: validSources.length,
		sourceDirectoriesCount: sourceDirectories.length,
	});

	const [dbFiles, dbDirectories, dbSourceDirs, dbDestDir] = await Promise.all([
		StorageDbRepository.filesByPaths(validSources),
		StorageDbRepository.directoriesByPaths(validSources),
		StorageDbRepository.directoriesByPaths(sourceDirectories),
		StorageDbRepository.directoryByPath(input.destinationPath),
	]);

	const dbFileMap = new Map<string, Types.FileEntity>();
	for (const file of dbFiles) {
		dbFileMap.set(file.path, file);
	}

	const dbDirectoryMap = new Map<string, Types.DirectoryEntity>();
	for (const dir of dbDirectories) {
		dbDirectoryMap.set(dir.path, dir);
	}

	const dbSourceDirMap = new Map<string, Types.DirectoryEntity>();
	for (const dir of dbSourceDirs) {
		dbSourceDirMap.set(dir.path, dir);
	}

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
			successfulItems,
		};
	}

	for (const sourcePath of validSources) {
		try {
			const sourceDir = sourcePath.substring(0, sourcePath.lastIndexOf("/"));
			const dbSourceDir = dbSourceDirMap.get(sourceDir);
			const dbFile = dbFileMap.get(sourcePath);
			const dbDirectory = dbDirectoryMap.get(sourcePath);

			const result = await moveItem(
				ctx,
				sourcePath,
				input.destinationPath,
				dbSourceDir,
				dbFile,
				dbDirectory,
			);

			if (result) {
				successfulItems.push(result);
			}
			successCount++;
		} catch (error) {
			failures.push({
				path: sourcePath,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	return {
		success: failures.length === 0,
		message:
			failures.length === 0
				? "All items processed successfully"
				: `${successCount} items processed, ${failures.length} failed`,
		successCount,
		failureCount: failures.length,
		failures,
		successfulItems,
	};
}

async function moveItem(
	ctx: LocalContext,
	sourcePath: string,
	destinationPath: string,
	dbSourceDir: Types.DirectoryEntity | undefined,
	dbFile: Types.FileEntity | undefined,
	dbDirectory: Types.DirectoryEntity | undefined,
): Promise<Types.FileInfo | Types.DirectoryInfo | null> {
	const sourceDir = sourcePath.substring(0, sourcePath.lastIndexOf("/"));
	if (dbSourceDir && !dbSourceDir.allowMove) {
		throw new Error(`Move not allowed from directory: ${sourceDir}`);
	}

	const fileName = StorageUtils.extractFileName(sourcePath);
	const newPath = `${destinationPath.replace(/\/$/, "")}/${fileName}`;

	const sourceAbsolutePath = getAbsolutePath(ctx.basePath, sourcePath);
	const destAbsolutePath = getAbsolutePath(ctx.basePath, newPath);

	await ensureDirectory(path.dirname(destAbsolutePath));
	await fs.rename(sourceAbsolutePath, destAbsolutePath);

	if (dbFile) {
		await StorageDbRepository.updateFile({
			id: dbFile.id,
			path: newPath,
			isProtected: dbFile.isProtected,
		});
		return await fileInfoByPath(ctx, newPath);
	}

	if (dbDirectory) {
		await StorageDbRepository.updateDirectory({
			...dbDirectory,
			path: newPath,
		});
		return await directoryInfoByPath(ctx, newPath);
	}

	return await fileInfoByPath(ctx, newPath);
}
