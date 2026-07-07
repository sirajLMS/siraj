import crypto from "node:crypto";
import { createWriteStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { type NextRequest, NextResponse } from "next/server";
import { logger, resolveLocalStoragePath } from "@/backend/lib";
import { StorageService } from "@/backend/services";

interface SignedUrlData {
  contentType: string;
  fileSize: bigint;
  contentHash: string;
  filePath: string;
}

function validateHeaders(request: NextRequest, signedUrl: SignedUrlData): NextResponse | null {
  const contentType = request.headers.get("content-type");
  const contentLength = request.headers.get("content-length");
  const contentMd5 = request.headers.get("content-md5");

  if (contentType !== signedUrl.contentType) {
    return NextResponse.json({ error: `Content-Type mismatch. Expected: ${signedUrl.contentType}` }, { status: 400 });
  }

  if (!contentLength) {
    return NextResponse.json({ error: "Content-Length header is required" }, { status: 411 });
  }

  if (BigInt(contentLength) > signedUrl.fileSize) {
    return NextResponse.json(
      { error: `Content-Length exceeds declared size of ${signedUrl.fileSize} bytes` },
      { status: 413 }
    );
  }

  if (!contentMd5) {
    return NextResponse.json({ error: "Content-MD5 header is required" }, { status: 400 });
  }

  if (contentMd5 !== signedUrl.contentHash) {
    return NextResponse.json({ error: "Content-MD5 mismatch" }, { status: 400 });
  }

  return null;
}

/**
 * Stream request body to file while calculating MD5
 */
async function streamToFile(stream: ReadableStream<Uint8Array>, filePath: string, expectedMd5: string): Promise<void> {
  // Use sha256 for integrity check
  const hash = crypto.createHash("sha256");
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

    const actualHash = hash.digest("base64");
    if (actualHash !== expectedMd5) {
      await fs.unlink(filePath).catch(() => {});
      throw new Error("SHA-256 hash mismatch");
    }
  } catch (error) {
    await fs.unlink(filePath).catch(() => {});
    throw error;
  }
}

/**
 * Finalize the upload by creating a database record and returning the response
 */
async function finalizeUpload(signedUrl: SignedUrlData, absolutePath: string, tokenId: string): Promise<NextResponse> {
  try {
    const fileEntity = await StorageService.createFileAndGet(signedUrl.filePath, false);
    const stats = await fs.stat(absolutePath);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    logger.info("File uploaded successfully via signed URL", { tokenId, path: signedUrl.filePath });

    return NextResponse.json(
      {
        id: fileEntity.id,
        path: signedUrl.filePath,
        size: stats.size,
        contentType: signedUrl.contentType,
        url: `${baseUrl}/api/storage/files/${signedUrl.filePath}`,
        createdAt: stats.birthtime.toISOString(),
        isProtected: fileEntity.isProtected,
      },
      { status: 201 }
    );
  } catch (error) {
    await fs.unlink(absolutePath).catch(() => {});
    logger.error("Failed to create file record", { tokenId, error });
    return NextResponse.json({ error: "Failed to create file record" }, { status: 500 });
  }
}

/**
 * Handle signed URL file uploads
 * PUT /api/storage/upload/[id]
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: tokenId } = await params;
    const signedUrl = await StorageService.claimSignedUrl(tokenId);

    if (!signedUrl) {
      logger.warn("Invalid or expired signed URL token", { tokenId });
      return NextResponse.json({ error: "Invalid, expired, or already used token" }, { status: 403 });
    }

    const validationResponse = validateHeaders(request, signedUrl);
    if (validationResponse) return validationResponse;

    return await processUpload(request.body, signedUrl, tokenId);
  } catch (error) {
    logger.error("Unexpected error in upload handler", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function processUpload(body: ReadableStream<Uint8Array> | null, signedUrl: SignedUrlData, tokenId: string) {
  let absolutePath: string;
  try {
    absolutePath = resolveLocalStoragePath(signedUrl.filePath);
  } catch (error) {
    logger.error("Path traversal attempt detected", { tokenId, path: signedUrl.filePath, error });
    return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
  }

  await fs.mkdir(path.dirname(absolutePath), { recursive: true, mode: 0o755 });

  if (!body) {
    return NextResponse.json({ error: "Request body is required" }, { status: 400 });
  }

  try {
    await streamToFile(body, absolutePath, signedUrl.contentHash);
  } catch (error) {
    logger.error("Failed to stream file to disk", { tokenId, error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to write file" },
      { status: 400 }
    );
  }

  return await finalizeUpload(signedUrl, absolutePath, tokenId);
}
