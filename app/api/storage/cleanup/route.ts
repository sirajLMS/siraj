import { type NextRequest, NextResponse } from "next/server";
import { extractTokenFromHeader, logger, verifyToken } from "@/backend/lib";
import { getEnvironmentConfig } from "@/backend/lib/env";
import { SessionService, StorageService } from "@/backend/services";

/**
 * Validates that the request is from an admin user
 */
async function authenticateAdmin(request: NextRequest): Promise<{ userId: string } | NextResponse> {
  const authHeader = request.headers.get("authorization");
  const accessToken = extractTokenFromHeader(authHeader) ?? request.cookies.get("access_token")?.value ?? null;
  let userId: string | null = null;

  if (accessToken) {
    const payload = await verifyToken(accessToken);
    if (payload?.type === "access") {
      userId = payload.userId;
    }
  }

  if (!userId) {
    const sessionId = request.cookies.get("session_id")?.value;
    if (sessionId) {
      const session = await SessionService.validateSession(sessionId);
      if (session?.userId) {
        userId = session.userId;
      }
    }
  }

  if (!userId) {
    logger.warn("Unauthorized cleanup attempt - no valid token or session");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await SessionService.getCurrentUserProfile(userId);
  if (!user) {
    logger.warn("Unauthorized cleanup attempt - user not found", { userId });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminEmail = getEnvironmentConfig().adminEmail;
  if (!adminEmail || user.email !== adminEmail) {
    logger.warn("Unauthorized cleanup attempt - non-admin user", { userId: user.id, email: user.email });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { userId: user.id };
}

/**
 * Manual cleanup endpoint for expired signed URLs
 * POST /api/storage/cleanup
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Delete expired signed URLs
    const deletedCount = await StorageService.cleanupExpiredSignedUrls();

    logger.info("Manual signed URL cleanup completed", {
      deletedCount,
      triggeredBy: authResult.userId,
    });

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} expired signed URLs`,
    });
  } catch (error) {
    logger.error("Failed to cleanup expired signed URLs", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
