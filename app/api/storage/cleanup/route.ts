import { type NextRequest, NextResponse } from "next/server";
import { SignedUrlRepository, UserRepository } from "@/backend/db/repo";
import { extractTokenFromHeader, verifyToken } from "@/backend/lib/auth/jwt";
import logger from "@/backend/lib/logger";

/**
 * Validates that the request is from an admin user
 */
async function authenticateAdmin(request: NextRequest): Promise<{ userId: string } | NextResponse> {
  const authHeader = request.headers.get("authorization");
  const accessToken = extractTokenFromHeader(authHeader);
  const payload = accessToken ? await verifyToken(accessToken) : null;

  if (payload?.type !== "access") {
    logger.warn("Unauthorized cleanup attempt - no valid token");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await UserRepository.findById(payload.userId);
  if (!user) {
    logger.warn("Unauthorized cleanup attempt - user not found", { userId: payload.userId });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail && user.email !== adminEmail) {
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
    const deletedCount = await SignedUrlRepository.deleteExpired();

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
