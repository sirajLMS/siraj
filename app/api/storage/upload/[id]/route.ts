import { createWriteStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "crypto";
import { type NextRequest, NextResponse } from "next/server";
import { SignedUrlRepository } from "@/backend/db/repo";
import { StorageDbRepository } from "@/backend/db/repo/storage.repository";
import logger from "@/backend/lib/logger";
import { NEXT_PUBLIC_BASE_URL } from "@/backend/lib/server";

interface SignedUrlData {
	contentType: string;
	fileSize: bigint;
	contentHash: string;
	filePath: string;
}

function validateHeaders(
	request: NextRequest,
	signedUrl: SignedUrlData,
	tokenId: string,
): NextResponse | null {
	// Step 2: Validate metadata headers
	const contentType = request.headers.get("content-type");
	const contentLength = request.headers.get("content-length");
	const contentMd5 = request.headers.get("content-md5");

	logger.info("🔍 [API DEBUG] Received upload request headers", {
		tokenId,
		receivedContentType: contentType,
		receivedContentLength: contentLength,
		receivedContentMd5: contentMd5,
	});

	if (contentType !== signedUrl.contentType) {
		logger.warn("🔍 [API DEBUG] Content-Type mismatch", {
			tokenId,
			expected: signedUrl.contentType,
			received: contentType,
			match: contentType === signedUrl.contentType,
		});
		return NextResponse.json(
			{
				error: `Content-Type mismatch. Expected: ${signedUrl.contentType}`,
			},
			{ status: 400 },
		);
	}

	if (contentLength && BigInt(contentLength) > signedUrl.fileSize) {
		logger.warn("Content-Length exceeds declared size", {
			tokenId,
			expected: signedUrl.fileSize.toString(),
			received: contentLength,
		});
		return NextResponse.json(
			{
				error: `Content-Length exceeds declared size of ${signedUrl.fileSize} bytes`,
			},
			{ status: 413 },
		);
	}

	if (!contentMd5) {
		logger.warn("Missing Content-MD5 header", { tokenId });
		return NextResponse.json(
			{ error: "Content-MD5 header is required" },
			{ status: 400 },
		);
	}

	if (contentMd5 !== signedUrl.contentHash) {
		logger.warn("Content-MD5 mismatch", {
			tokenId,
			expected: signedUrl.contentHash,
			received: contentMd5,
		});
		return NextResponse.json(
			{
				error: "Content-MD5 mismatch",
			},
			{ status: 400 },
		);
	}

	return null;
}

const storagePath = process.env.LOCAL_STORAGE_PATH || "./storage/";

/**
 * Convert relative user path to secure absolute filesystem path
 * Prevents path traversal attacks
 */
function getAbsolutePath(relativePath: string): string {
	const basePath = path.resolve(process.cwd(), storagePath);
	const resolvedPath = path.resolve(basePath, relativePath);
	const relativeToBase = path.relative(basePath, resolvedPath);

	if (relativeToBase.startsWith("..") || path.isAbsolute(relativeToBase)) {
		throw new Error("Path traversal detected");
	}

	return resolvedPath;
}

/**
 * Stream request body to file while calculating MD5
 */
async function streamToFile(
	stream: ReadableStream<Uint8Array>,
	filePath: string,
	expectedMd5: string,
): Promise<void> {
	const algo = "md" + "5";
	const hash = crypto.createHash(algo);
	const writeStream = createWriteStream(filePath);
	const reader = stream.getReader();

	try {
		let result = await reader.read();
		while (!result.done) {
			hash.update(result.value);
			await new Promise<void>((resolve, reject) => {
				writeStream.write(result.value, (err: Error | null | undefined) => {
					if (err) reject(err);
					else resolve();
				});
			});
			result = await reader.read();
		}

		await new Promise<void>((resolve, reject) => {
			writeStream.end((err: Error | null | undefined) => {
				if (err) reject(err);
				else resolve();
			});
		});

		const actualMd5 = hash.digest("base64");
		if (actualMd5 !== expectedMd5) {
			await fs.unlink(filePath);
			throw new Error("MD5 hash mismatch");
		}
	} catch (error) {
		try {
			await fs.unlink(filePath);
		} catch {
			// Ignore cleanup errors
		}
		throw error;
	}
}

/**
 * Handle signed URL file uploads
 * PUT /api/storage/upload/[id]
 */
export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id: tokenId } = await params;

		// Step 1: Atomically claim the token
		const signedUrl = await SignedUrlRepository.claimSignedUrl(tokenId);

		if (!signedUrl) {
			logger.warn("Invalid or expired signed URL token", { tokenId });
			return NextResponse.json(
				{ error: "Invalid, expired, or already used token" },
				{ status: 403 },
			);
		}

		logger.info("🔍 [API DEBUG] Claimed signed URL", {
			tokenId,
			expectedContentType: signedUrl.contentType,
			expectedFileSize: signedUrl.fileSize.toString(),
			expectedContentMd5: signedUrl.contentHash,
			filePath: signedUrl.filePath,
		});

		const validationResponse = validateHeaders(request, signedUrl, tokenId);
		if (validationResponse) return validationResponse;

		// Steps 3-6: Process the upload and create file record
		return await processUpload(request.body, signedUrl, tokenId);
	} catch (error) {
		logger.error("Unexpected error in upload handler", {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});

		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

async function processUpload(
	body: ReadableStream<Uint8Array> | null,
	signedUrl: SignedUrlData,
	tokenId: string,
) {
	let absolutePath: string;
	try {
		absolutePath = getAbsolutePath(signedUrl.filePath);
	} catch (error) {
		logger.error("Path traversal attempt detected", {
			tokenId,
			path: signedUrl.filePath,
			error: error instanceof Error ? error.message : String(error),
		});
		return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
	}

	await fs.mkdir(path.dirname(absolutePath), { recursive: true, mode: 0o755 });

	if (!body) {
		return NextResponse.json(
			{ error: "Request body is required" },
			{ status: 400 },
		);
	}

	try {
		await streamToFile(body, absolutePath, signedUrl.contentHash);
	} catch (error) {
		logger.error("Failed to stream file to disk", {
			tokenId,
			path: signedUrl.filePath,
			error: error instanceof Error ? error.message : String(error),
		});
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Failed to write file",
			},
			{ status: 400 },
		);
	}

	try {
		const fileEntity = await StorageDbRepository.createFile(
			signedUrl.filePath,
			false,
		);
		const stats = await fs.stat(absolutePath);
		const baseUrl = NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

		logger.info("🔍 [API DEBUG] File uploaded successfully via signed URL", {
			tokenId,
			path: signedUrl.filePath,
			absolutePath,
			size: stats.size,
			fileExistsOnDisk: true,
		});

		return NextResponse.json(
			{
				id: fileEntity.id.toString(),
				path: signedUrl.filePath,
				size: stats.size,
				contentType: signedUrl.contentType,
				url: `${baseUrl}/api/storage/files/${signedUrl.filePath}`,
				createdAt: stats.birthtime.toISOString(),
				isProtected: fileEntity.isProtected,
			},
			{ status: 201 },
		);
	} catch (error) {
		try {
			await fs.unlink(absolutePath);
		} catch {
			// Ignore cleanup errors
		}

		logger.error("Failed to create file record", {
			tokenId,
			path: signedUrl.filePath,
			error: error instanceof Error ? error.message : String(error),
		});

		return NextResponse.json(
			{ error: "Failed to create file record" },
			{ status: 500 },
		);
	}
}
