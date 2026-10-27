import fs from "node:fs/promises";
import path from "node:path";
import { type NextRequest, NextResponse } from "next/server";
import { finalizeUpload } from "@/app/api/storage/upload/[id]/upload-finalize.helpers";
import {
  resolveLocaleFromRequest,
  resolveUploadUserId,
  type SignedUrlData,
  validateHeaders,
  validateRequestHeaders,
} from "@/app/api/storage/upload/[id]/upload-request.helpers";
import { streamToFile, UploadStreamError } from "@/app/api/storage/upload/[id]/upload-stream.helpers";
import { logger, rateLimitLogId, resolveLocalStoragePath } from "@/backend/lib";
import { checkRateLimit, getClientIdentifier, storageUploadRateLimiter } from "@/backend/lib/ratelimit";
import { StorageService } from "@/backend/services";
import { getServerTranslations } from "@/shared/locale";
import type { ErrorsLabels } from "@/shared/locale/types";

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
    return NextResponse.json({ error: tErrors.file.failedToWriteFile }, { status: 500 });
  }

  return await finalizeUpload(signedUrl, absolutePath, tokenId, tErrors);
}
