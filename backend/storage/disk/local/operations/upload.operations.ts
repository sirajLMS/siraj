import fs from "node:fs/promises";
import path from "node:path";
import crypto from "crypto";
import { SignedUrlRepository, StorageDbRepository } from "@/backend/db/repo";
import logger from "@/backend/lib/logger";
import * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import {
	STORAGE_CONFIG,
	StorageValidationError,
} from "../../storage.service.interface";
import type { LocalContext } from "../types";
import {
	calculateFileHash,
	cleanLocalPath,
	ensureDirectory,
	getAbsolutePath,
} from "../utils";

export async function prepareUpload(
	ctx: LocalContext,
	input: Types.UploadPreparationInput,
): Promise<Types.UploadPreparationResult> {
	try {
		const cleanedPath = cleanLocalPath(input.path);
		const mimeType = input.contentType;

		logger.info("🔍 [SERVER DEBUG] Preparing upload", {
			path: cleanedPath,
			fileSize: input.fileSize,
			contentType: mimeType,
			contentHash: input.contentHash,
		});

		const validationError = await StorageUtils.validateUpload(
			cleanedPath,
			input.fileSize,
			mimeType,
		);
		if (validationError) {
			throw new StorageValidationError(validationError);
		}

		const cleanupStrategy = process.env.SIGNED_URL_CLEANUP_STRATEGY || "lazy";
		if (cleanupStrategy === "lazy" || cleanupStrategy === "both") {
			try {
				await SignedUrlRepository.deleteExpired();
			} catch (error) {
				logger.error("Lazy cleanup failed during signed URL generation", error);
			}
		}

		const tokenId = crypto.randomUUID();
		const expiresAt = new Date(
			Date.now() + STORAGE_CONFIG.SIGNED_URL_DURATION * 60 * 1000,
		);

		await SignedUrlRepository.createSignedUrl({
			id: tokenId,
			filePath: cleanedPath,
			contentType: mimeType,
			fileSize: BigInt(input.fileSize),
			contentHash: input.contentHash,
			expiresAt,
			createdAt: new Date(),
			used: false,
		});

		logger.info("🔍 [SERVER DEBUG] Stored signed URL in database", {
			tokenId,
			filePath: cleanedPath,
			storedContentType: mimeType,
			storedFileSize: input.fileSize,
			storedContentHash: input.contentHash,
			expiresAt,
		});

		const signedUrl = `${ctx.baseUrl}/api/storage/upload/${tokenId}`;

		logger.info("Prepared upload successfully", {
			tokenId,
			path: cleanedPath,
			expiresAt,
			uploadType: Types.UploadType.SIGNED_URL,
		});

		return {
			id: tokenId,
			url: signedUrl,
			uploadType: Types.UploadType.SIGNED_URL,
		};
	} catch (error) {
		logger.error("Failed to prepare upload", {
			path: input.path,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});
		throw error;
	}
}

export async function uploadFile(
	ctx: LocalContext,
	filePath: string,
	contentType: string,
	buffer: Buffer,
): Promise<Types.FileUploadResult> {
	try {
		const cleanedFilePath = cleanLocalPath(filePath);
		const fileSize = buffer.byteLength;

		const validationError = await StorageUtils.validateUpload(
			filePath,
			fileSize,
			contentType,
		);
		if (validationError) {
			return { success: false, message: validationError, data: null };
		}

		const directoryPath = cleanedFilePath.substring(
			0,
			cleanedFilePath.lastIndexOf("/"),
		);
		const dbDirectory =
			await StorageDbRepository.directoryByPath(directoryPath);

		if (dbDirectory && !dbDirectory.allowUploads) {
			return {
				success: false,
				message: "Uploads not allowed in this directory",
				data: null,
			};
		}

		const absolutePath = getAbsolutePath(ctx.basePath, cleanedFilePath);
		await ensureDirectory(path.dirname(absolutePath));
		await fs.writeFile(absolutePath, buffer);

		logger.info("💾 uploadFile: Creating file entity in database", {
			filePath: cleanedFilePath,
		});
		const fileEntity = await StorageDbRepository.createFile(
			cleanedFilePath,
			false,
		);
		logger.info("💾 uploadFile: File entity created successfully", {
			fileEntity,
		});

		const stats = await fs.stat(absolutePath);
		const contentHash = await calculateFileHash(absolutePath);

		const bucketFile: Types.BucketFile = {
			path: cleanedFilePath,
			directoryPath,
			size: BigInt(stats.size),
			contentType: contentType,
			contentHash,
			createdAt: stats.birthtime,
			lastModified: stats.mtime,
			url: `${ctx.baseUrl}/api/storage/files/${cleanedFilePath}`,
			mediaLink: undefined,
			fileType: StorageUtils.getFileTypeFromContentType(contentType),
			isPublic: cleanedFilePath.startsWith("public"),
		};

		const fileInfo = StorageUtils.combineFileData(bucketFile, fileEntity);

		return {
			success: true,
			message: "File uploaded successfully",
			data: fileInfo,
		};
	} catch (error) {
		const errorPath = filePath;
		logger.error(`Failed to upload file: ${errorPath}`, error);
		return {
			success: false,
			message: `Failed to upload file: ${error instanceof Error ? error.message : String(error)}`,
			data: null,
		};
	}
}
