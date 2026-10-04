import { type NextRequest, NextResponse } from "next/server";
import { getServerUserContext } from "@/backend/lib";
import { extractTokenFromHeader, verifyToken } from "@/backend/lib/auth/jwt";
import { isAllowedMimeType } from "@/backend/lib/storage/mime-allowlist";
import type { ErrorsLabels } from "@/shared/locale/types";

/** Signed-URL session data required to validate and finalize one upload. */
export interface SignedUrlData {
  contentType: string;
  fileSize: bigint;
  contentHash: string;
  filePath: string;
  uploadedByUserId?: string | null;
}

export function resolveLocaleFromRequest(request: NextRequest): string {
  return request.headers.get("accept-language")?.split(",")[0]?.split("-")[0] ?? "ar";
}

export function validateHeaders(
  request: NextRequest,
  signedUrl: SignedUrlData,
  tErrors: ErrorsLabels
): NextResponse | null {
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
export function validateRequestHeaders(request: NextRequest, tErrors: ErrorsLabels): NextResponse | null {
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
 * Resolve the uploading user's ID from the request. Tries cookie-based
 * session first (via `getServerUserContext`), then falls back to the
 * `Authorization: Bearer <token>` header — mirroring the GraphQL context
 * factory's auth resolution so that both browser uploads (cookies) and
 * API/test uploads (Bearer token) are supported.
 */
export async function resolveUploadUserId(request: NextRequest): Promise<string | null> {
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
