import { cookies } from "next/headers";
import { verifyToken } from "@/backend/lib/auth/jwt";
import { logger } from "@/backend/lib/logger";
import { PermissionsService, type UserPermissionContext } from "@/backend/services/auth/permissions.service";
import { SessionService } from "@/backend/services/auth/session.service";

export async function getServerUserContext(): Promise<{
  userId: string | null;
  context: UserPermissionContext | null;
}> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;
  const token = cookieStore.get("access_token")?.value;

  if (!sessionId || !token) {
    return { userId: null, context: null };
  }

  let session: Awaited<ReturnType<typeof SessionService.validateSession>>;
  try {
    session = await SessionService.validateSession(sessionId);
  } catch (error) {
    logger.error("Session validation system error", {
      error: error instanceof Error ? error.constructor.name : String(error),
    });
    throw error;
  }

  if (!session?.userId) {
    return { userId: null, context: null };
  }

  const payload = await verifyToken(token);
  // Intentionally validates access tokens only — not refresh tokens.
  // Server-side auth (SSR) should only use short-lived access tokens;
  // refresh tokens have their own dedicated flow via the refresh endpoint.
  if (payload?.type !== "access" || payload.userId !== session.userId) {
    return { userId: null, context: null };
  }

  const context = await PermissionsService.getUserContext(payload.userId);
  return { userId: payload.userId, context };
}
