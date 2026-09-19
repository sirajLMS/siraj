import crypto from "node:crypto";
import { createWriteStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { type NextRequest, NextResponse } from "next/server";
import { getServerUserContext, logger, rateLimitLogId, resolveLocalStoragePath } from "@/backend/lib";
import { extractTokenFromHeader, verifyToken } from "@/backend/lib/auth/jwt";
import { checkRateLimit, getClientIdentifier, storageUploadRateLimiter } from "@/backend/lib/ratelimit";
import { isAllowedMimeType, verifyImageMagicBytes } from "@/backend/lib/storage/mime-allowlist";
import { StorageService } from "@/backend/services";
import { getServerTranslations } from "@/shared/locale";
import type { ErrorsLabels } from "@/shared/locale/types";

/**
 * Error thrown while streaming an upload body to disk. Carries the HTTP
 * status the route should respond with.
 */
class UploadStreamError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

const MAGIC_HEADER_BYTES = 16;
const STREAM_SIZE_SLACK_BYTES = 1024n;

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
 * Header checks that do not depend on the signed-URL row. Runs before the
 * token is claimed so malformed requests do not burn the one-shot token.
 */
function validateRequestHeaders(request: NextRequest, tErrors: ErrorsLabels): NextResponse | null {
  const contentType = request.headers.get("content-type");
  const contentLength = request.headers.get("content-length");
  const contentMd5 = request.headers.get("content-md5");

  if (!request.body) {
    return NextResponse.json({ error: tErrors.file.requestBodyRequired }, { status: 400 });
  }

  if (!contentType || !isAllowedMimeType(contentType)) {
    return NextResponse.json({ error: tErrors.file.invalidFileType }, { status: 400 });
  }

  if (!contentLength || !/^\d+$/.test(contentLength) || BigInt(contentLength) === 0n) {
    return NextResponse.json({ error: tErrors.file.contentLengthRequired }, { status: 411 });
  }

  if (!contentMd5) {
    return NextResponse.json({ error: tErrors.file.contentMd5Required }, { status: 400 });
  }

  return null;
}

/**
 * Stream request body to file while calculating SHA-256. Enforces the
 * server-side byte cap on the actual streamed payload (the client's
 * Content-Length is not trusted) and verifies the magic bytes of the first
 * bytes for image content types.
 */
async function streamToFile(
  stream: ReadableStream,
  filePath: string,
  expectedMd5: string,
  options: {
    maxSizeBytes: bigint;
    contentType: string;
    hashMismatchMessage: string;
    magicMismatchMessage: string;
    sizeExceededMessage: string;
  }
): Promise<void> {
  const hash = crypto.createHash("sha256");
  const writeStream = createWriteStream(filePath);

  let receivedBytes = 0n;
  let headerBytes = Buffer.alloc(0);

  const hashTransform = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      receivedBytes += BigInt(chunk.length);

      if (receivedBytes > options.maxSizeBytes + STREAM_SIZE_SLACK_BYTES) {
        callback(new UploadStreamError(413, options.sizeExceededMessage));
        return;
      }

      if (headerBytes.length < MAGIC_HEADER_BYTES) {
        headerBytes = Buffer.concat([headerBytes, chunk.subarray(0, MAGIC_HEADER_BYTES - headerBytes.length)]);
      }

      hash.update(chunk);
      callback(null, chunk);
    },
  });

  try {
    await pipeline(toNodeReadable(stream), hashTransform, writeStream);

    if (headerBytes.length > 0 && !verifyImageMagicBytes(options.contentType, headerBytes)) {
      throw new UploadStreamError(400, options.magicMismatchMessage);
    }

    const actualHash = hash.digest("base64");
    if (actualHash !== expectedMd5) {
      throw new Error(options.hashMismatchMessage);
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
    const locale = resolveLocaleFromRequest(request);
    const tErrors = getServerTranslations(locale).errorsTranslations;

    // Rate limit keyed on the uploading user (IP fallback) before the
    // one-shot token is touched.
    const sessionUserId = await resolveUploadUserId(request);
    const rateLimitKey = `storage-upload:${sessionUserId ?? getClientIdentifier(request)}`;
    const rateLimit = await checkRateLimit(rateLimitKey, storageUploadRateLimiter);
    if (!rateLimit.success) {
      // rateLimitKey embeds the raw client IP — log only the hashed identifier.
      logger.warn("Storage upload rate limit exceeded", { tokenId, rateLimitLogId: rateLimitLogId(rateLimitKey) });
      return NextResponse.json({ error: tErrors.rateLimitExceeded }, { status: 429 });
    }

    // Validate the request-independent headers first so a bad request does
    // not burn the one-shot token; the claim below stays a single atomic
    // operation.
    const requestHeaderResponse = validateRequestHeaders(request, tErrors);
    if (requestHeaderResponse) return requestHeaderResponse;

    const signedUrl = await StorageService.claimSignedUrl(tokenId);

    if (!signedUrl) {
      logger.warn("Invalid or expired signed URL token", { tokenId });
      return NextResponse.json({ error: tErrors.file.invalidOrExpiredToken }, { status: 403 });
    }

    // Signed URLs must be bound to their uploader at creation time; an unbound
    // session is rejected so any holder of the token cannot write the file.
    if (!signedUrl.uploadedByUserId) {
      logger.warn("Signed URL session is not bound to an uploader", { tokenId });
      return NextResponse.json({ error: tErrors.file.invalidOrExpiredToken }, { status: 403 });
    }

    if (!sessionUserId || sessionUserId !== signedUrl.uploadedByUserId) {
      logger.warn("Signed URL user mismatch", {
        tokenId,
        signedUrlUserId: signedUrl.uploadedByUserId,
        sessionUserId,
      });
      return NextResponse.json({ error: tErrors.file.invalidOrExpiredToken }, { status: 403 });
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
    await streamToFile(request.body, absolutePath, signedUrl.contentHash, {
      maxSizeBytes: signedUrl.fileSize,
      contentType: signedUrl.contentType,
      hashMismatchMessage: tErrors.file.sha256HashMismatch,
      magicMismatchMessage: tErrors.file.invalidFileType,
      sizeExceededMessage: tErrors.file.contentLengthExceedsSize(signedUrl.fileSize.toString()),
    });
  } catch (error) {
    if (error instanceof UploadStreamError) {
      logger.warn("Upload stream rejected", { tokenId, status: error.status, error });
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("Failed to stream file to disk", { tokenId, error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : tErrors.file.failedToWriteFile },
      { status: 400 }
    );
  }

  return await finalizeUpload(signedUrl, absolutePath, tokenId, tErrors);
}
