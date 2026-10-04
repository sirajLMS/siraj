import { type NextRequest, NextResponse } from "next/server";
import { extractTokenFromHeader, verifyToken } from "@/backend/lib";
import { SessionService, StorageService } from "@/backend/services";
import type { ErrorsLabels } from "@/shared/locale/types";

/**
 * Resolve the authenticated user for a storage request via bearer token or
 * session cookie, falling back to a 401 response when neither is valid.
 */
export async function authenticateRequest(
  request: NextRequest,
  tErrors: ErrorsLabels
): Promise<{ userId: string } | NextResponse> {
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

  return NextResponse.json({ error: tErrors.file.authenticationRequired }, { status: 401 });
}

/**
 * Enforce per-user access control for a non-public storage path, returning a
 * ready-to-send denial response or `null` when access is granted.
 */
export async function checkFileAccess(
  userId: string,
  relativePath: string,
  locale?: string
): Promise<NextResponse | null> {
  const accessResult = await StorageService.checkFileAccess(userId, relativePath, locale);
  if (accessResult) {
    return NextResponse.json({ error: accessResult.error }, { status: accessResult.status });
  }
  return null;
}
