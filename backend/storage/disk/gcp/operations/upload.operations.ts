import crypto from "crypto";
import { StorageDbRepository } from "@/backend/db/repo";
import logger from "@/backend/lib/logger";
import * as Types from "@/backend/types";
import { StorageUtils } from "@/backend/utils";
import {
	STORAGE_CONFIG,
	StorageValidationError,
} from "../../storage.service.interface";
import type { GcpContext } from "../types";

export async function prepareUpload(
	ctx: GcpContext,
	input: Types.UploadPreparationInput,
): Promise<Types.UploadPreparationResult> {
	try {
		logger.info("Preparing upload", {
			path: input.path,
			fileSize: input.fileSize,
		});

		const uploadErr = await StorageUtils.validateUpload(
			input.path,
			input.fileSize,
			input.contentType,
		);
		if (uploadErr) {
			throw new StorageValidationError(uploadErr);
		}

		const file = ctx.bucket.file(input.path);

		const result = await file.getSignedUrl({
			version: "v4",
			expires: Date.now() + STORAGE_CONFIG.SIGNED_URL_DURATION * 60 * 1000,
			contentType: input.contentType,
			action: "write",
			contentMd5: input.contentHash,
		});

		const signedUrl = result[0];

		// Generate a unique ID for tracking this upload
		const uploadId = crypto.randomUUID();

		logger.info("Prepared upload successfully", {
			uploadId,
			path: input.path,
			uploadType: Types.UploadType.SIGNED_URL,
		});

		return {
			id: uploadId,
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
	ctx: GcpContext,
	path: string,
	contentType: string,
	buffer: Buffer,
): Promise<Types.FileUploadResult> {
	try {
		const fileSize = buffer.byteLength;

		const uploadErr = await StorageUtils.validateUpload(
			path,
			fileSize,
			contentType,
		);
		if (uploadErr) {
			return {
				success: false,
				message: uploadErr,
				data: null,
			};
		}

		const directoryPath = path.substring(0, path.lastIndexOf("/"));

		const dbDirectory =
			await StorageDbRepository.directoryByPath(directoryPath);

		if (dbDirectory) {
			if (!dbDirectory.allowUploads) {
				return {
					success: false,
					message: "Uploads not allowed in this directory",
					data: null,
				};
			}
		} else {
			let bucketDirExists = false;
			try {
				const folderBlob = `${directoryPath}/`;
				const file = ctx.bucket.file(folderBlob);
				const [exists] = await file.exists();
				bucketDirExists = exists;
			} catch {
				bucketDirExists = false;
			}

			if (!bucketDirExists && directoryPath.length > 0) {
				return {
					success: false,
					message: "Directory does not exist",
					data: null,
				};
			}
		}

		const file = ctx.bucket.file(path);
		await file.save(buffer, {
			contentType: contentType,
		});

		const fileEntity = await StorageDbRepository.createFile(path, false);

		const [metadata] = await file.getMetadata();
		const bucketFile = StorageUtils.blobToFileInfo(metadata, ctx.gcpBaseUrl);
		const fileInfo = StorageUtils.combineFileData(bucketFile, fileEntity);

		return {
			success: true,
			message: "File uploaded successfully",
			data: fileInfo,
		};
	} catch (error) {
		logger.error(`Failed to upload file: ${path}`, error);
		return {
			success: false,
			message: `Failed to upload file: ${error instanceof Error ? error.message : String(error)}`,
			data: null,
		};
	}
}
