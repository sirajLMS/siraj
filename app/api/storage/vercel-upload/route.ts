import { del } from "@vercel/blob";
import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { type NextRequest, NextResponse } from "next/server";
import { extractTokenFromHeader, getStringEnv, logger, verifyToken } from "@/backend/lib";
import { checkRateLimit, storageUploadRateLimiter } from "@/backend/lib/ratelimit";
import { ALLOWED_MIME_TYPES, isImageContentType, verifyImageMagicBytes } from "@/backend/lib/storage";
import { SessionService, StorageService } from "@/backend/services";
import { isPublicStoragePath } from "@/backend/storage/disk/vercel/operations";
import { getServerTranslations } from "@/shared/locale";
import type { ErrorsLabels } from "@/shared/locale/types";

const MAGIC_HEADER_BYTES = 16;

export type VercelUploadUrlClientPlayload = {
  sessionId: string;
  fileSize: number;
  contentType: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isHandleUploadBody(value: unknown): value is HandleUploadBody {
  return isRecord(value) && typeof value.type === "string" && isRecord(value.payload);
}

function parseClientPayload(raw: string | null | undefined): VercelUploadUrlClientPlayload {
  const empty: VercelUploadUrlClientPlayload = {
    sessionId: "",
    fileSize: 0,
    contentType: "",
  };
  if (!raw) {
    return empty;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return empty;
    }
    return {
      sessionId: typeof parsed.sessionId === "string" ? parsed.sessionId : "",
      fileSize: typeof parsed.fileSize === "number" ? parsed.fileSize : 0,
      contentType: typeof parsed.contentType === "string" ? parsed.contentType : "",
    };
  } catch {
    return empty;
  }
}

function parseTokenPayload(raw: string): { sessionId?: string; contentType?: string } {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return {};
    }
    return {
      ...(typeof parsed.sessionId === "string" ? { sessionId: parsed.sessionId } : {}),
      ...(typeof parsed.contentType === "string" ? { contentType: parsed.contentType } : {}),
    };
  } catch {
    return {};
  }
}

async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  const accessToken = extractTokenFromHeader(authHeader) ?? request.cookies.get("access_token")?.value ?? null;

  if (accessToken) {
    const payload = await verifyToken(accessToken);
    if (payload?.type === "access") {
      return payload.userId;
    }
  }

  const sessionId = request.cookies.get("session_id")?.value;
  if (sessionId) {
    const session = await SessionService.validateSession(sessionId);
    if (session?.userId) {
      return session.userId;
    }
  }

  return null;
}

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
 * Fetch the first bytes of a completed blob and verify the magic-byte
 * signature for image content types. Returns true when the content is
 * acceptable or when verification is not possible for public paths (lenient);
 * for non-public paths verification failures are treated as definitive so the
 * caller deletes the blob.
 */
async function hasValidMagicBytes(blobUrl: string, contentType: string, pathname: string): Promise<boolean> {
  if (!contentType || !isImageContentType(contentType)) {
    return true;
  }

  const isPublicPath = isPublicStoragePath(pathname);

  try {
    const token = getStringEnv("BLOB_READ_WRITE_TOKEN", "");
    const response = await fetch(blobUrl, {
      headers: {
        Range: `bytes=0-${MAGIC_HEADER_BYTES - 1}`,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok && response.status !== 206) {
      logger.error("Unable to fetch uploaded blob for magic-byte verification", {
        status: response.status,
        pathname,
        isPublicPath,
      });
      // Public paths stay lenient so a transient fetch failure cannot block
      // all public uploads; non-public blobs fail closed (deleted by caller).
      return isPublicPath;
    }

    const headerBytes = Buffer.from(await response.arrayBuffer());
    if (headerBytes.length === 0) {
      logger.error("Magic-byte verification received an empty blob body", { pathname, isPublicPath });
      return isPublicPath;
    }
    return verifyImageMagicBytes(contentType, headerBytes);
  } catch (error) {
    logger.error("Magic-byte verification of uploaded blob failed to run", { pathname, isPublicPath, error });
    return isPublicPath;
  }
}

/**
 * Handle Vercel Blob client SDK upload requests
 * POST /api/storage/vercel-upload
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const locale = request.headers.get("accept-language")?.split(",")[0]?.split("-")[0] ?? "ar";
  const tErrors = getServerTranslations(locale).errorsTranslations;

  try {
    // Step 1: Authenticate the request
    const userId = await getUserIdFromRequest(request);

    // Require authentication for uploads
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

    // Step 2: Parse request body from Vercel SDK
    const rawBody: unknown = await request.json();
    if (!isHandleUploadBody(rawBody)) {
      logger.warn("Invalid upload request body", { userId });
      return NextResponse.json({ error: tErrors.file.invalidUploadRequestBody }, { status: 400 });
    }
    const body: HandleUploadBody = rawBody;
    if (body.type !== "blob.generate-client-token") {
      throw new Error(tErrors.invalidEventType);
    }

    const clientPlayload = parseClientPayload(body.payload.clientPayload);
    const pathName = body.payload.pathname;

    const payloadValidationError: NextResponse | null = await validateUploadPayload(
      pathName,
      clientPlayload,
      userId,
      tErrors
    );
    if (payloadValidationError) return payloadValidationError;

    const { sessionId, fileSize, contentType } = clientPlayload;

    logger.info("🔍 [VERCEL UPLOAD] Received upload request", {
      pathname: pathName,
      type: contentType,
      userId,
    });

    // Step 3: Validate upload request
    const validationError = StorageService.validateUpload(
      {
        path: pathName,
        size: fileSize,
        contentType,
      },
      locale
    );

    if (validationError) {
      logger.warn("Upload validation failed", {
        pathname: pathName,
        error: validationError,
      });
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Step 4: Check directory permissions
    const directoryPath = pathName.substring(0, pathName.lastIndexOf("/"));
    const directoryError = await StorageService.checkDirectoryUploadPermissions(directoryPath, locale);

    if (directoryError) {
      logger.warn("Uploads not allowed in directory", {
        pathname: pathName,
        directory: directoryPath,
      });
      return NextResponse.json({ error: directoryError }, { status: 403 });
    }

    // Step 6: Validate existing session
    const sessionValidationError = await validateSession(sessionId, pathName, userId);
    if (sessionValidationError) return sessionValidationError;

    // Step 7: Use Vercel's handleUpload to generate upload URL
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: (_pathname: string, _clientPayload: string | null, _multipart: boolean) => {
        // Additional validation before token generation
        logger.info("🔍 [VERCEL UPLOAD] Generating token", {
          pathname: pathName,
        });

        // Return metadata to attach to the blob
        return Promise.resolve({
          allowOverwrite: false,
          // Server-side allowlist — never echo the client-supplied content type.
          allowedContentTypes: [...ALLOWED_MIME_TYPES],
          // Hard server-side cap on actually-uploaded bytes (client-reported
          // fileSize is attacker-controlled). Keep in sync with
          // MAX_FILE_SIZE_BYTES in backend/db/repo/storage/storage.repository.ts.
          maximumSizeInBytes: 100 * 1024 * 1024,
          tokenPayload: JSON.stringify({
            sessionId,
            pathname: pathName,
            userId,
            contentType,
          }),
        });
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This runs AFTER the upload completes
        logger.info("🔍 [VERCEL UPLOAD] Upload completed", {
          url: blob.url,
          pathname: blob.pathname,
        });

        try {
          // Parse token payload
          const rawPayload = parseTokenPayload(tokenPayload ?? "{}");
          const parsedSessionId = rawPayload.sessionId;

          // Reject blobs whose contents do not match the declared image type.
          if (!(await hasValidMagicBytes(blob.url, rawPayload.contentType ?? "", blob.pathname))) {
            logger.warn("Uploaded blob failed magic-byte verification; deleting", {
              pathname: blob.pathname,
              contentType: rawPayload.contentType,
            });

            const token = getStringEnv("BLOB_READ_WRITE_TOKEN", "");
            await del(blob.url, { token });
            return;
          }

          // The client SDK does not token-encode `access`, so a client could
          // still have published a non-public path. Enforce server-side: a
          // non-public blob that is anonymously readable is deleted.
          if (!isPublicStoragePath(blob.pathname)) {
            try {
              const probeResponse = await fetch(blob.url);
              if (probeResponse.ok) {
                logger.warn("Uploaded non-public blob is anonymously readable; deleting", {
                  pathname: blob.pathname,
                });

                const token = getStringEnv("BLOB_READ_WRITE_TOKEN", "");
                await del(blob.url, { token });
                return;
              }
            } catch (probeError) {
              // A failed probe must not break the completion callback.
              logger.warn("Anonymous-readability probe of uploaded blob failed", {
                pathname: blob.pathname,
                error: probeError instanceof Error ? probeError.message : String(probeError),
              });
            }
          }

          // Mark session as used
          if (parsedSessionId) {
            await StorageService.claimSignedUrl(parsedSessionId);
          }

          // Create file record in database
          await StorageService.createFile(blob.pathname);

          logger.info("✅ [VERCEL UPLOAD] File record created", {
            pathname: blob.pathname,
          });
        } catch (error) {
          logger.error("Failed to create file record after upload", {
            pathname: blob.pathname,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    logger.error("Unexpected error in Vercel upload handler", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json({ error: tErrors.internalServerError }, { status: 500 });
  }
}
