import { createReadStream, statSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { type NextRequest, NextResponse } from "next/server";
import {
  extractTokenFromHeader,
  logger,
  resolveLocalStoragePath,
  resolvePublicStoragePath,
  verifyToken,
} from "@/backend/lib";
import { SessionService, StorageService } from "@/backend/services";
import { extToMime } from "@/shared/utils";

/**
 * Detect content type from file extension
 */
function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase().replace(".", "");
  return extToMime[ext] || "application/octet-stream";
}

/**
 * Parse range header
 */
function parseRange(rangeHeader: string, fileSize: number): { start: number; end: number } | null {
  const match = /bytes=(\d+)-(\d*)/.exec(rangeHeader);
  if (!match?.[1]) return null;

  const start = Number.parseInt(match[1], 10);
  const end = match[2] ? Number.parseInt(match[2], 10) : fileSize - 1;

  if (start >= fileSize || end >= fileSize || start > end) {
    return null;
  }

  return { start, end };
}

/**
 * Reconstruct relative file path from route params
 */
async function getRelativePath(params: Promise<{ path?: string[] }>): Promise<string | null> {
  const resolvedParams = await params;
  return resolvedParams.path ? resolvedParams.path.join("/") : null;
}

/**
 * Convert a Node.js ReadStream into a web ReadableStream for use as a Response body.
 */
function streamToReadableStream(stream: ReturnType<typeof createReadStream>): ReadableStream {
  return new ReadableStream({
    start(controller) {
      let streamError: unknown = null;
      stream.on("error", (error: unknown) => {
        streamError = error;
        controller.error(error);
      });
      stream.on("end", () => {
        if (!streamError) controller.close();
      });
      stream.on("data", (chunk: Buffer) => {
        if (!streamError) controller.enqueue(new Uint8Array(chunk));
      });
    },
    cancel() {
      stream.destroy();
    },
  });
}

/**
 * Options for generating a range response
 */
interface RangeResponseOptions {
  absolutePath: string;
  rangeHeader: string;
  fileSize: number;
  contentType: string;
  lastModified: string;
}

/**
 * Generate a partial content response for range requests
 */
function createRangeResponse(options: RangeResponseOptions): NextResponse {
  const { absolutePath, rangeHeader, fileSize, contentType, lastModified } = options;
  const range = parseRange(rangeHeader, fileSize);

  if (!range) {
    return new NextResponse(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${fileSize}` },
    });
  }

  const { start, end } = range;
  const chunkSize = end - start + 1;
  const stream = createReadStream(absolutePath, { start, end });
  const body = streamToReadableStream(stream);

  return new NextResponse(body, {
    status: 206,
    headers: {
      "Content-Type": contentType,
      "Content-Length": chunkSize.toString(),
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600",
      "Last-Modified": lastModified,
    },
  });
}

async function authenticateRequest(request: NextRequest): Promise<{ userId: string } | NextResponse> {
  const authHeader = request.headers.get("authorization");
  const accessToken = extractTokenFromHeader(authHeader) ?? request.cookies.get("access_token")?.value ?? null;
  const payload = accessToken ? await verifyToken(accessToken) : null;

  if (payload?.type === "access" && payload.userId) {
    return { userId: payload.userId };
  }

  const sessionId = request.cookies.get("session_id")?.value;
  if (sessionId) {
    const session = await SessionService.validateSession(sessionId);
    if (session?.userId) {
      return { userId: session.userId };
    }
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

async function checkFileAccess(userId: string, relativePath: string): Promise<NextResponse | null> {
  const accessResult = await StorageService.checkFileAccess(userId, relativePath);
  if (accessResult) {
    return NextResponse.json({ error: accessResult.error }, { status: accessResult.status });
  }
  return null;
}

function buildFileResponse(absolutePath: string, relativePath: string, rangeHeader: string | null): NextResponse {
  const stats = statSync(absolutePath);
  const fileSize = stats.size;
  const contentType = getContentType(relativePath);
  const lastModified = stats.mtime.toUTCString();

  if (rangeHeader) {
    return createRangeResponse({ absolutePath, rangeHeader, fileSize, contentType, lastModified });
  }

  const stream = createReadStream(absolutePath);
  const body = streamToReadableStream(stream);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": fileSize.toString(),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600",
      "Last-Modified": lastModified,
    },
  });
}

/**
 * Handle file downloads and streaming
 * GET /api/storage/files/[[...path]]
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  try {
    const relativePath = await getRelativePath(params);

    if (!relativePath) {
      return NextResponse.json({ error: "File path is required" }, { status: 400 });
    }

    // Allow unauthenticated access to public files (public/ or avatars/ directories)
    if (relativePath.startsWith("public/") || relativePath.startsWith("avatars/")) {
      let absolutePath: string;
      try {
        absolutePath = relativePath.startsWith("public/")
          ? resolvePublicStoragePath(relativePath.substring("public/".length))
          : resolveLocalStoragePath(relativePath);
      } catch (error) {
        logger.warn("Path traversal attempt detected in public file request", { path: relativePath, error });
        return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
      }

      try {
        await fs.access(absolutePath);
        return buildFileResponse(absolutePath, relativePath, request.headers.get("range"));
      } catch {
        logger.warn("Public file not found", { path: relativePath, absolutePath });
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }
    }

    // Require authentication for non-public files
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;

    const accessDenied = await checkFileAccess(authResult.userId, relativePath);
    if (accessDenied) return accessDenied;

    let absolutePath: string;
    try {
      absolutePath = resolveLocalStoragePath(relativePath);
    } catch (error) {
      logger.warn("Path traversal attempt detected", { path: relativePath, error });
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    try {
      await fs.access(absolutePath);
    } catch {
      logger.warn("File not found", { path: relativePath });
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return buildFileResponse(absolutePath, relativePath, request.headers.get("range"));
  } catch (error) {
    logger.error("Unexpected error in file serving handler", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
