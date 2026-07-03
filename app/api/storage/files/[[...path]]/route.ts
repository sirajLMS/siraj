import { createReadStream, statSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { type NextRequest, NextResponse } from "next/server";
import { StorageDbRepository } from "@/backend/db/repo/storage.repository";
import type * as StorageTypes from "@/backend/types";
import { TeacherRepository } from "@/backend/db/repo/teacher.repository";
import { ParentRepository } from "@/backend/db/repo/parent.repository";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { UserRepository } from "@/backend/db/repo";
import { extractTokenFromHeader, verifyToken } from "@/backend/lib/auth/jwt";
import logger from "@/backend/lib/logger";
import { extToMime } from "@/shared/utils/storage.utils";

const storagePath = process.env.LOCAL_STORAGE_PATH || "./storage/";

/**
 * Convert relative user path to secure absolute filesystem path
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

  return new NextResponse(stream as unknown as BodyInit, {
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
  const accessToken = extractTokenFromHeader(authHeader);
  const payload = accessToken ? await verifyToken(accessToken) : null;

  if (payload?.type !== "access") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await UserRepository.findById(payload.userId);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return { userId: payload.userId };
}

async function checkFileAccess(userId: string, usages: StorageTypes.FileUsageInfo[]): Promise<NextResponse | null> {
  if (usages.length === 0) return null;

  const userContext = await PermissionsService.getUserContext(userId);
  if (userContext.isSuperAdmin) return null;

  const hasAccess = await hasMatchingEntityAccess(userId, usages);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}

async function hasMatchingEntityAccess(userId: string, usages: StorageTypes.FileUsageInfo[]): Promise<boolean> {
  for (const usage of usages) {
    if (usage.referenceTable === "users" && usage.referenceId === userId) {
      return true;
    }
    if (usage.referenceTable === "teachers") {
      const teacher = await TeacherRepository.findByUserId(userId);
      if (teacher?.id === usage.referenceId) return true;
    }
    if (usage.referenceTable === "parents") {
      const parent = await ParentRepository.findByUserId(userId);
      if (parent?.id === usage.referenceId) return true;
    }
  }
  return false;
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
  return new NextResponse(stream as unknown as BodyInit, {
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

    // Allow unauthenticated access to files in public/ directory
    if (relativePath.startsWith("public/")) {
      const subPath = relativePath.substring("public/".length);
      const absolutePath = path.join(storagePath, "public", subPath);

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

    const usages = await StorageDbRepository.getFileUsages(relativePath);
    const accessDenied = await checkFileAccess(authResult.userId, usages);
    if (accessDenied) return accessDenied;

    let absolutePath: string;
    try {
      absolutePath = getAbsolutePath(relativePath);
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
