import { type NextRequest, NextResponse } from "next/server";
import {
  getUserIdFromRequest,
  isHandleUploadBody,
  parseClientPayload,
} from "@/app/api/storage/vercel-upload/vercel-upload.helpers";
import type {
  UploadRequestContext,
  VercelUploadUrlClientPlayload,
} from "@/app/api/storage/vercel-upload/vercel-upload.types";
import { logger } from "@/backend/lib";
import { checkRateLimit, storageUploadRateLimiter } from "@/backend/lib/ratelimit";
import { StorageService } from "@/backend/services";
import type { ErrorsLabels } from "@/shared/locale/types";

async function validateUploadPayload(
  pathName: string,
  clientPayload: VercelUploadUrlClientPlayload,
  userId: string,
  tErrors: ErrorsLabels
): Promise<NextResponse | null> {
  if (!pathName) {
    logger.warn("Missing pathname in upload request", { userId });
    return NextResponse.json({ error: tErrors.file.missingPathname }, { status: 400 });
  }

  const { sessionId, fileSize, contentType } = clientPayload;
  if (!sessionId) {
    logger.warn("Missing upload session ID", { pathname: pathName });
    return NextResponse.json({ error: tErrors.file.missingUploadSessionId }, { status: 400 });
  }

  if (!fileSize || fileSize <= 0) {
    logger.warn("Invalid file size in upload request", {
      pathname: pathName,
      fileSize,
    });
    return NextResponse.json({ error: tErrors.file.invalidFileSize }, { status: 400 });
  }

  if (!contentType) {
    logger.warn("Missing content type in upload request", {
      pathname: pathName,
    });
    return NextResponse.json({ error: tErrors.file.missingContentType }, { status: 400 });
  }

  return null;
}

async function validateSession(sessionId: string, pathName: string, userId: string): Promise<NextResponse | null> {
  const result = await StorageService.validateSignedUrlSession(sessionId, pathName, undefined, userId);
  if (result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return null;
}

/**
 * Authenticate the upload request, apply the storage upload rate limit, and
 * parse the Vercel SDK body. Returns the resolved request context, or a ready
 * error response when any precondition fails.
 */
export async function resolveUploadRequest(
  request: NextRequest,
  tErrors: ErrorsLabels
): Promise<UploadRequestContext | NextResponse> {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    logger.warn("Unauthorized upload attempt");
    return NextResponse.json({ error: tErrors.file.authenticationRequired }, { status: 401 });
  }

  logger.info("🔍 [VERCEL UPLOAD] Request authenticated", {
    userId,
    authenticated: !!userId,
  });

  const rateLimit = await checkRateLimit(`storage-upload:${userId}`, storageUploadRateLimiter);
  if (!rateLimit.success) {
    logger.warn("Storage upload rate limit exceeded", { userId });
    return NextResponse.json({ error: tErrors.rateLimitExceeded }, { status: 429 });
  }

  const rawBody: unknown = await request.json();
  if (!isHandleUploadBody(rawBody)) {
    logger.warn("Invalid upload request body", { userId });
    return NextResponse.json({ error: tErrors.file.invalidUploadRequestBody }, { status: 400 });
  }

  if (rawBody.type !== "blob.generate-client-token") {
    throw new Error(tErrors.invalidEventType);
  }

  const clientPlayload = parseClientPayload(rawBody.payload.clientPayload);
  const pathName = rawBody.payload.pathname;

  const payloadValidationError = await validateUploadPayload(pathName, clientPlayload, userId, tErrors);
  if (payloadValidationError) {
    return payloadValidationError;
  }

  logger.info("🔍 [VERCEL UPLOAD] Received upload request", {
    pathname: pathName,
    type: clientPlayload.contentType,
    userId,
  });

  return { body: rawBody, clientPlayload, pathName, userId };
}

/**
 * Run the business validation chain for a resolved upload request: declared
 * file constraints, directory permissions, and the signed URL session.
 */
export async function validateUploadTarget(
  context: UploadRequestContext,
  locale: string
): Promise<NextResponse | null> {
  const { sessionId, fileSize, contentType } = context.clientPlayload;

  const validationError = StorageService.validateUpload(
    {
      path: context.pathName,
      size: fileSize,
      contentType,
    },
    locale
  );

  if (validationError) {
    logger.warn("Upload validation failed", {
      pathname: context.pathName,
      error: validationError,
    });
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const directoryPath = context.pathName.substring(0, context.pathName.lastIndexOf("/"));
  const directoryError = await StorageService.checkDirectoryUploadPermissions(directoryPath, locale);

  if (directoryError) {
    logger.warn("Uploads not allowed in directory", {
      pathname: context.pathName,
      directory: directoryPath,
    });
    return NextResponse.json({ error: directoryError }, { status: 403 });
  }

  return validateSession(sessionId, context.pathName, context.userId);
}
