import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { type NextRequest, NextResponse } from "next/server";
import { SignedUrlRepository } from "@/backend/db";
import { extractTokenFromHeader, logger, verifyToken } from "@/backend/lib";
import { SessionService, StorageService } from "@/backend/services";

export type VercelUploadUrlClientPlayload = {
  sessionId: string;
  fileSize: number;
  contentType: string;
};

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
  userId: string
): Promise<NextResponse | null> {
  if (!pathName) {
    logger.warn("Missing pathname in upload request", { userId });
    return NextResponse.json({ error: "Missing pathname in upload request" }, { status: 400 });
  }

  const { sessionId, fileSize, contentType } = clientPayload;
  if (!sessionId) {
    logger.warn("Missing upload session ID", { pathname: pathName });
    return NextResponse.json({ error: "Missing upload session ID" }, { status: 400 });
  }

  if (!fileSize || fileSize <= 0) {
    logger.warn("Invalid file size in upload request", {
      pathname: pathName,
      fileSize,
    });
    return NextResponse.json({ error: "Invalid file size in upload request" }, { status: 400 });
  }

  if (!contentType) {
    logger.warn("Missing content type in upload request", {
      pathname: pathName,
    });
    return NextResponse.json({ error: "Missing content type in upload request" }, { status: 400 });
  }

  return null;
}

async function validateSession(sessionId: string, pathName: string): Promise<NextResponse | null> {
  const session = await SignedUrlRepository.getSignedUrlById(sessionId);

  if (!session) {
    logger.warn("Invalid upload session", {
      sessionId,
      pathname: pathName,
    });
    return NextResponse.json({ error: "Invalid upload session" }, { status: 403 });
  }

  if (session.used) {
    logger.warn("Upload session already used", {
      sessionId,
      pathname: pathName,
    });
    return NextResponse.json({ error: "Upload session already used" }, { status: 403 });
  }

  if (session.expiresAt < new Date()) {
    logger.warn("Upload session expired", {
      sessionId,
      pathname: pathName,
      expiresAt: session.expiresAt,
    });
    return NextResponse.json({ error: "Upload session expired" }, { status: 403 });
  }

  // Validate metadata matches
  if (session.filePath !== pathName) {
    logger.warn("File path mismatch", {
      sessionId,
      expectedPath: session.filePath,
      receivedPath: pathName,
    });
    return NextResponse.json({ error: "File path mismatch" }, { status: 400 });
  }

  logger.info("🔍 [VERCEL UPLOAD] Validated upload session", {
    sessionId,
    pathname: pathName,
    expiresAt: session.expiresAt,
  });

  return null;
}

/**
 * Handle Vercel Blob client SDK upload requests
 * POST /api/storage/vercel-upload
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Step 1: Authenticate the request
    const userId = await getUserIdFromRequest(request);

    // Require authentication for uploads
    if (!userId) {
      logger.warn("Unauthorized upload attempt");
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    logger.info("🔍 [VERCEL UPLOAD] Request authenticated", {
      userId,
      authenticated: !!userId,
    });

    // Step 2: Parse request body from Vercel SDK
    const body = (await request.json()) as HandleUploadBody;
    if (body.type !== "blob.generate-client-token") {
      throw new Error("InvalidEventType");
    }

    const clientPlayload: VercelUploadUrlClientPlayload = body.payload.clientPayload
      ? (JSON.parse(body.payload.clientPayload) as VercelUploadUrlClientPlayload)
      : ({} as VercelUploadUrlClientPlayload);
    const pathName = body.payload.pathname;

    const payloadValidationError: NextResponse | null = await validateUploadPayload(pathName, clientPlayload, userId);
    if (payloadValidationError) return payloadValidationError;

    const { sessionId, fileSize, contentType } = clientPlayload;

    logger.info("🔍 [VERCEL UPLOAD] Received upload request", {
      pathname: pathName,
      type: contentType,
      userId,
    });

    // Step 3: Validate upload request
    const validationError = StorageService.validateUpload({
      path: pathName,
      size: fileSize,
      contentType,
    });

    if (validationError) {
      logger.warn("Upload validation failed", {
        pathname: pathName,
        error: validationError,
      });
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Step 4: Check directory permissions
    const directoryPath = pathName.substring(0, pathName.lastIndexOf("/"));
    const directoryError = await StorageService.checkDirectoryUploadPermissions(directoryPath);

    if (directoryError) {
      logger.warn("Uploads not allowed in directory", {
        pathname: pathName,
        directory: directoryPath,
      });
      return NextResponse.json({ error: directoryError }, { status: 403 });
    }

    // Step 6: Validate existing session
    const sessionValidationError = await validateSession(sessionId, pathName);
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
          allowedContentTypes: [contentType],
          tokenPayload: JSON.stringify({
            sessionId,
            pathname: pathName,
            userId,
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
          const rawPayload = JSON.parse(tokenPayload || "{}") as {
            sessionId?: string;
          };
          const sessionId = rawPayload.sessionId;

          // Mark session as used
          if (sessionId) {
            await StorageService.claimSignedUrl(sessionId);
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

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
