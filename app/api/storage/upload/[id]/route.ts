import crypto from "node:crypto";
import { createWriteStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { type NextRequest, NextResponse } from "next/server";
import { getServerUserContext, logger, resolveLocalStoragePath } from "@/backend/lib";
import { extractTokenFromHeader, verifyToken } from "@/backend/lib/auth/jwt";
import { isAllowedMimeType } from "@/backend/lib/storage/mime-allowlist";
import { StorageService } from "@/backend/services";
import { getServerTranslations } from "@/shared/locale";
import type { ErrorsLabels } from "@/shared/locale/types";

/**
 * Bridge DOM ReadableStream to a Node Readable via async iteration.
 */
function toNodeReadable(stream: ReadableStream): Readable {
  return Readable.from(stream);
}

interface SignedUrlData {
  contentType: string;
  fileSize: bigint;
  contentHash: string;
  filePath: string;
  uploadedByUserId?: string | null;
}

function resolveLocaleFromRequest(request: NextRequest): string {
  return request.headers.get("accept-language")?.split(",")[0]?.split("-")[0] ?? "ar";
}

function validateHeaders(request: NextRequest, signedUrl: SignedUrlData, tErrors: ErrorsLabels): NextResponse | null {
  const contentType = request.headers.get("content-type");
  const contentLength = request.headers.get("content-length");
  const contentMd5 = request.headers.get("content-md5");

  if (contentType !== signedUrl.contentType) {
    return NextResponse.json({ error: tErrors.file.contentTypeMismatch(signedUrl.contentType) }, { status: 400 });
  }

  if (!isAllowedMimeType(signedUrl.contentType)) {
    return NextResponse.json({ error: tErrors.file.invalidFileType }, { status: 400 });
  }

  if (!contentLength) {
    return NextResponse.json({ error: tErrors.file.contentLengthRequired }, { status: 411 });
  }

  if (BigInt(contentLength) > signedUrl.fileSize) {
    return NextResponse.json(
      { error: tErrors.file.contentLengthExceedsSize(signedUrl.fileSize.toString()) },
      { status: 413 }
    );
  }

  if (!contentMd5) {
    return NextResponse.json({ error: tErrors.file.contentMd5Required }, { status: 400 });
  }

  if (contentMd5 !== signedUrl.contentHash) {
    return NextResponse.json({ error: tErrors.file.contentMd5Mismatch }, { status: 400 });
  }

  return null;
}

/**
 * Stream request body to file while calculating SHA-256
 */
async function streamToFile(
  stream: ReadableStream,
  filePath: string,
  expectedMd5: string,
  hashMismatchMessage: string
): Promise<void> {
  const hash = crypto.createHash("sha256");
  const writeStream = createWriteStream(filePath);

  const hashTransform = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      hash.update(chunk);
      callback(null, chunk);
    },
  });

  try {
    await pipeline(toNodeReadable(stream), hashTransform, writeStream);

    const actualHash = hash.digest("base64");
    if (actualHash !== expectedMd5) {
      await fs.unlink(filePath).catch(() => {});
      throw new Error(hashMismatchMessage);
    }
  } catch (error) {
    await fs.unlink(filePath).catch(() => {});
    throw error;
  }
}

/**
 * Finalize the upload by creating a database record and returning the response
 */
async function finalizeUpload(
  signedUrl: SignedUrlData,
  absolutePath: string,
  tokenId: string,
  tErrors: ErrorsLabels
): Promise<NextResponse> {
  try {
    const fileEntity = await StorageService.createFileAndGet(signedUrl.filePath, false);
    const stats = await fs.stat(absolutePath);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

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
    return NextResponse.json({ error: tErrors.file.failedToCreateFileRecord }, { status: 500 });
  }
}

/**
 * Resolve the uploading user's ID from the request. Tries cookie-based
 * session first (via `getServerUserContext`), then falls back to the
 * `Authorization: Bearer <token>` header — mirroring the GraphQL context
 * factory's auth resolution so that both browser uploads (cookies) and
 * API/test uploads (Bearer token) are supported.
 */
async function resolveUploadUserId(request: NextRequest): Promise<string | null> {
  const cookieResult = await getServerUserContext();
  if (cookieResult.userId) return cookieResult.userId;

  const authHeader = request.headers.get("authorization");
  const bearerToken = extractTokenFromHeader(authHeader);
  if (!bearerToken) return null;

  const payload = await verifyToken(bearerToken);
  if (payload?.type === "access" && typeof payload.userId === "string") {
    return payload.userId;
  }
  return null;
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
      const locale = resolveLocaleFromRequest(request);
      const tErrors = getServerTranslations(locale).errorsTranslations;
      return NextResponse.json({ error: tErrors.file.invalidOrExpiredToken }, { status: 403 });
    }

    const locale = resolveLocaleFromRequest(request);
    const tErrors = getServerTranslations(locale).errorsTranslations;

    // M2 fix: if the signed URL has an uploadedByUserId, verify the current
    // session user matches. Prevents token-sharing attacks where anyone who
    // obtains the token can write the file.
    if (signedUrl.uploadedByUserId) {
      const sessionUserId = await resolveUploadUserId(request);
      if (!sessionUserId || sessionUserId !== signedUrl.uploadedByUserId) {
        logger.warn("Signed URL user mismatch", {
          tokenId,
          signedUrlUserId: signedUrl.uploadedByUserId,
          sessionUserId,
        });
        return NextResponse.json({ error: tErrors.file.invalidOrExpiredToken }, { status: 403 });
      }
    }

    const validationResponse = validateHeaders(request, signedUrl, tErrors);
    if (validationResponse) return validationResponse;

    return await processUpload(request, signedUrl, tokenId, tErrors);
  } catch (error) {
    logger.error("Unexpected error in upload handler", error);
    const locale = resolveLocaleFromRequest(request);
    const tErrors = getServerTranslations(locale).errorsTranslations;
    return NextResponse.json({ error: tErrors.internalServerError }, { status: 500 });
  }
}

async function processUpload(
  request: NextRequest,
  signedUrl: SignedUrlData,
  tokenId: string,
  tErrors: ErrorsLabels
): Promise<NextResponse> {
  let absolutePath: string;
  try {
    absolutePath = resolveLocalStoragePath(signedUrl.filePath);
  } catch (error) {
    logger.error("Path traversal attempt detected", { tokenId, path: signedUrl.filePath, error });
    return NextResponse.json({ error: tErrors.file.invalidFilePath }, { status: 400 });
  }

  await fs.mkdir(path.dirname(absolutePath), { recursive: true, mode: 0o755 });

  if (!request.body) {
    return NextResponse.json({ error: tErrors.file.requestBodyRequired }, { status: 400 });
  }

  try {
    await streamToFile(request.body, absolutePath, signedUrl.contentHash, tErrors.file.sha256HashMismatch);
  } catch (error) {
    logger.error("Failed to stream file to disk", { tokenId, error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : tErrors.file.failedToWriteFile },
      { status: 400 }
    );
  }

  return await finalizeUpload(signedUrl, absolutePath, tokenId, tErrors);
}
