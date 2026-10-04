import fs from "node:fs/promises";
import { type NextRequest, NextResponse } from "next/server";
import { authenticateRequest, checkFileAccess } from "@/app/api/storage/files/[[...path]]/route.auth";
import { getRelativePath } from "@/app/api/storage/files/[[...path]]/route.helpers";
import { buildFileResponse } from "@/app/api/storage/files/[[...path]]/route.responses";
import { logger, resolveLocalStoragePath, resolvePublicStoragePath } from "@/backend/lib";
import { apiRateLimiter, checkRateLimit, getClientIdentifier, rateLimitLogId } from "@/backend/lib/ratelimit";
import { StorageService } from "@/backend/services";
import { getServerTranslations } from "@/shared/locale";

/**
 * Handle file downloads and streaming
 * GET /api/storage/files/[[...path]]
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const locale = request.headers.get("accept-language")?.split(",")[0]?.split("-")[0] ?? "ar";
  const tErrors = getServerTranslations(locale).errorsTranslations;

  try {
    // Rate limit downloads per client (IP fallback) before touching the
    // filesystem or running any auth/session lookups.
    const rateLimitKey = `storage-file:${getClientIdentifier(request)}`;
    const rateLimit = await checkRateLimit(rateLimitKey, apiRateLimiter);
    if (!rateLimit.success) {
      // rateLimitKey embeds the raw client IP — log only the hashed identifier.
      logger.warn("Storage file serving rate limit exceeded", { rateLimitLogId: rateLimitLogId(rateLimitKey) });
      return NextResponse.json({ error: tErrors.rateLimitExceeded }, { status: 429 });
    }

    const relativePath = await getRelativePath(params);

    if (!relativePath) {
      return NextResponse.json({ error: tErrors.file.filePathRequired }, { status: 400 });
    }

    if (!StorageService.validatePath(relativePath)) {
      logger.warn("Invalid file path detected in storage request", { path: relativePath });
      return NextResponse.json({ error: tErrors.file.invalidFilePath }, { status: 400 });
    }

    // Allow unauthenticated access to public files (public/ directory only).
    // User avatar uploads land under public/avatars/...; the raw `avatars/`
    // prefix is intentionally NOT exempt — nothing writes there anymore and
    // serving it unauthenticated would expose arbitrary user files.
    if (relativePath.startsWith("public/")) {
      let absolutePath: string;
      try {
        absolutePath = resolvePublicStoragePath(relativePath.substring("public/".length));
      } catch (error) {
        logger.warn("Path traversal attempt detected in public file request", { path: relativePath, error });
        return NextResponse.json({ error: tErrors.file.invalidFilePath }, { status: 400 });
      }

      try {
        await fs.access(absolutePath);
        return buildFileResponse(absolutePath, relativePath, request.headers.get("range"));
      } catch {
        logger.warn("Public file not found", { path: relativePath, absolutePath });
        return NextResponse.json({ error: tErrors.file.fileNotFound }, { status: 404 });
      }
    }

    // Require authentication for non-public files
    const authResult = await authenticateRequest(request, tErrors);
    if (authResult instanceof NextResponse) return authResult;

    const accessDenied = await checkFileAccess(authResult.userId, relativePath, locale);
    if (accessDenied) return accessDenied;

    let absolutePath: string;
    try {
      absolutePath = resolveLocalStoragePath(relativePath);
    } catch (error) {
      logger.warn("Path traversal attempt detected", { path: relativePath, error });
      return NextResponse.json({ error: tErrors.file.invalidFilePath }, { status: 400 });
    }

    try {
      await fs.access(absolutePath);
    } catch {
      logger.warn("File not found", { path: relativePath });
      return NextResponse.json({ error: tErrors.file.fileNotFound }, { status: 404 });
    }

    return buildFileResponse(absolutePath, relativePath, request.headers.get("range"));
  } catch (error) {
    logger.error("Unexpected error in file serving handler", error);
    return NextResponse.json({ error: tErrors.internalServerError }, { status: 500 });
  }
}
