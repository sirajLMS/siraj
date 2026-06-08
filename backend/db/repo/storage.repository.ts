import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import {
	fileUsages,
	storageDirectories,
	storageFiles,
} from "@/backend/db/schema/storage";
import logger from "@/backend/lib/logger";
import type * as StorageTypes from "@/backend/types";

export namespace StorageDbRepository {
	// File operations
	export const fileById = async (
		id: bigint,
	): Promise<StorageTypes.FileEntity | undefined> => {
		const result = await db
			.select()
			.from(storageFiles)
			.where(eq(storageFiles.id, id))
			.limit(1);
		return result[0];
	};

	export const fileByPath = async (
		path: string,
	): Promise<StorageTypes.FileEntity | undefined> => {
		const result = await db
			.select()
			.from(storageFiles)
			.where(eq(storageFiles.path, path))
			.limit(1);
		return result[0];
	};

	export const filesByIds = async (
		ids: bigint[],
	): Promise<StorageTypes.FileEntity[]> => {
		if (ids.length === 0) return [];
		return await db
			.select()
			.from(storageFiles)
			.where(inArray(storageFiles.id, ids));
	};

	export const filesByPaths = async (
		paths: string[],
	): Promise<StorageTypes.FileEntity[]> => {
		if (paths.length === 0) return [];
		return await db
			.select()
			.from(storageFiles)
			.where(inArray(storageFiles.path, paths));
	};
	export const createFile = async (
		path: string,
		isProtected: boolean = false,
	): Promise<StorageTypes.FileEntity> => {
		const [file] = await db
			.insert(storageFiles)
			.values({
				path,
				isProtected,
			})
			.onConflictDoUpdate({
				target: storageFiles.path,
				set: {
					isProtected,
				},
			})
			.returning();
		return file;
	};

	export const updateFile = async (
		file: StorageTypes.FileEntityInput & {
			id: bigint;
		},
	): Promise<StorageTypes.FileEntity | undefined> => {
		const [updatedFile] = await db
			.update(storageFiles)
			.set({
				path: file.path,
				isProtected: file.isProtected,
			})
			.where(eq(storageFiles.id, file.id))
			.returning();
		return updatedFile;
	};

	export const deleteFile = async (path: string): Promise<boolean> => {
		try {
			await db.delete(storageFiles).where(eq(storageFiles.path, path));
			return true;
		} catch (error) {
			logger.error("Failed to delete file:", error);
			return false;
		}
	};

	// Directory operations
	export const directoryByPath = async (
		path: string,
	): Promise<StorageTypes.DirectoryEntity | null> => {
		try {
			const result = await db
				.select()
				.from(storageDirectories)
				.where(eq(storageDirectories.path, path))
				.limit(1);
			if (result.length === 0 || !result[0]) {
				return null;
			}
			return result[0];
		} catch (err) {
			logger.error("Failed to find directory by path:", err);
			return null;
		}
	};

	export const directoriesByParentPath = async (
		parentPath?: string,
	): Promise<StorageTypes.DirectoryEntity[]> => {
		if (parentPath) {
			return await db
				.select()
				.from(storageDirectories)
				.where(sql`${storageDirectories.path} LIKE ${parentPath + "/%"}`);
		}
		return await db.select().from(storageDirectories);
	};

	export const directoriesByPaths = async (
		paths: string[],
	): Promise<StorageTypes.DirectoryEntity[]> => {
		if (paths.length === 0) return [];
		return await db
			.select()
			.from(storageDirectories)
			.where(inArray(storageDirectories.path, paths));
	};

	export const createDirectory = async (
		input: StorageTypes.FolderCreateInput,
	): Promise<StorageTypes.DirectoryEntity> => {
		const permissions = input.permissions || {
			allowUploads: true,
			allowDelete: true,
			allowMove: true,
			allowCreateSubDirs: true,
			allowDeleteFiles: true,
			allowMoveFiles: true,
		};

		const [directory] = await db
			.insert(storageDirectories)
			.values({
				path: input.path,
				allowUploads: permissions.allowUploads,
				allowDelete: permissions.allowDelete,
				allowMove: permissions.allowMove,
				allowCreateSubDirs: permissions.allowCreateSubDirs,
				allowDeleteFiles: permissions.allowDeleteFiles,
				allowMoveFiles: permissions.allowMoveFiles,
				isProtected: input.protected || false,
				protectChildren: input.protectChildren || false,
			})
			.returning();
		return directory;
	};

	export const updateDirectory = async (
		directory: StorageTypes.DirectoryEntity,
	): Promise<StorageTypes.DirectoryEntity | undefined> => {
		const [updatedDirectory] = await db
			.update(storageDirectories)
			.set({
				path: directory.path,
				allowUploads: directory.allowUploads,
				allowDelete: directory.allowDelete,
				allowMove: directory.allowMove,
				allowCreateSubDirs: directory.allowCreateSubDirs,
				allowDeleteFiles: directory.allowDeleteFiles,
				allowMoveFiles: directory.allowMoveFiles,
				isProtected: directory.isProtected,
				protectChildren: directory.protectChildren,
			})
			.where(eq(storageDirectories.id, directory.id))
			.returning();
		return updatedDirectory;
	};

	export const deleteDirectory = async (path: string): Promise<boolean> => {
		try {
			await db
				.delete(storageDirectories)
				.where(eq(storageDirectories.path, path));
			return true;
		} catch (error) {
			logger.error("Failed to delete directory:", error);
			return false;
		}
	};

	// File usage operations
	export const getFileUsages = async (
		filePath: string,
	): Promise<StorageTypes.FileUsageEntity[]> => {
		return await db
			.select()
			.from(fileUsages)
			.where(eq(fileUsages.filePath, filePath));
	};

	export const isFileInUse = async (filePath: string): Promise<boolean> => {
		const usages = await getFileUsages(filePath);
		return usages.length > 0;
	};

	export const registerFileUsage = async (
		input: StorageTypes.FileUsageRegisterInput,
	): Promise<StorageTypes.FileOperationResult> => {
		try {
			// Check if file exists in DB, if not, add it
			const fileEntity = await fileByPath(input.filePath);
			if (!fileEntity) {
				try {
					await createFile(input.filePath);
					logger.info(
						`📁 Registered file in DB upon first usage: ${input.filePath}`,
					);
				} catch (error) {
					return {
						success: false,
						message: `Failed to register file from bucket: ${error}`,
					};
				}
			}

			await db.insert(fileUsages).values({
				filePath: input.filePath,
				usageType: input.usageType,
				referenceId: input.referenceId,
				referenceTable: input.referenceTable,
				createdAt: new Date(),
			});

			return {
				success: true,
				message: "File usage registered successfully",
			};
		} catch (error) {
			return {
				success: false,
				message: `Failed to register file usage: ${error}`,
			};
		}
	};

	export const unregisterFileUsage = async (
		filePath: string,
		usageType: string,
		referenceId: bigint,
	): Promise<boolean> => {
		try {
			await db
				.delete(fileUsages)
				.where(
					and(
						eq(fileUsages.filePath, filePath),
						eq(fileUsages.usageType, usageType),
						eq(fileUsages.referenceId, referenceId),
					),
				);
			return true;
		} catch (error) {
			logger.error("Failed to unregister file usage:", error);
			return false;
		}
	};

	// Business logic methods
	export const checkFileUsage = async (
		input: StorageTypes.FileUsageCheckInput,
	): Promise<StorageTypes.FileUsageResult> => {
		try {
			const isInUse = await isFileInUse(input.path);
			const usages = isInUse ? await getFileUsages(input.path) : [];

			return {
				isInUse,
				usages: usages.map((usage) => ({
					id: usage.id,
					filePath: usage.filePath,
					usageType: usage.usageType,
					referenceId: usage.referenceId,
					referenceTable: usage.referenceTable,
					createdAt: usage.createdAt,
				})),
				canDelete: !isInUse,
				deleteBlockReason: isInUse ? "File is currently being used" : undefined,
			};
		} catch {
			return {
				isInUse: false,
				usages: [],
				canDelete: false,
				deleteBlockReason: "Unable to check file usage",
			};
		}
	};

	export const updateDirectoryPermissions = async (
		input: StorageTypes.DirectoryPermissionsUpdateInput,
	): Promise<StorageTypes.FileOperationResult> => {
		try {
			const directory = await directoryByPath(input.path);
			if (!directory) {
				return {
					success: false,
					message: "Directory not found",
				};
			}

			const updatedDirectory = {
				...directory,
				allowUploads: input.permissions.allowUploads,
				allowDelete: input.permissions.allowDelete,
				allowMove: input.permissions.allowMove,
				allowCreateSubDirs: input.permissions.allowCreateSubDirs,
				allowDeleteFiles: input.permissions.allowDeleteFiles,
				allowMoveFiles: input.permissions.allowMoveFiles,
			};

			const updated = await updateDirectory(updatedDirectory);

			return {
				success: !!updated,
				message: updated
					? "Directory permissions updated successfully"
					: "Failed to update directory permissions",
			};
		} catch (error) {
			return {
				success: false,
				message: `Failed to update permissions: ${error}`,
			};
		}
	};

	export const setProtection = async (
		input: StorageTypes.StorageItemProtectionUpdateInput,
	): Promise<StorageTypes.FileOperationResult> => {
		try {
			// Check if it's a file
			const file = await fileByPath(input.path);
			if (file) {
				const updatedFile = {
					...file,
					isProtected: input.isProtected,
				};
				const updated = await updateFile(updatedFile);
				return {
					success: !!updated,
					message: updated
						? "File protection updated successfully"
						: "Failed to update file protection",
				};
			}

			// Check if it's a directory
			const directory = await directoryByPath(input.path);
			if (directory) {
				const updatedDirectory = {
					...directory,
					isProtected: input.isProtected,
					protectChildren: input.protectChildren || false,
				};
				const updated = await updateDirectory(updatedDirectory);
				return {
					success: !!updated,
					message: updated
						? "Directory protection updated successfully"
						: "Failed to update directory protection",
				};
			}

			return {
				success: false,
				message: "File or directory not found",
			};
		} catch (error) {
			return {
				success: false,
				message: `Failed to set protection: ${error}`,
			};
		}
	};
}
