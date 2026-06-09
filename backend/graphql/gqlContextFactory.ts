import { cookies, headers } from "next/headers";
import { extractTokenFromHeader, verifyToken } from "@/backend/lib/auth/jwt";
import logger from "@/backend/lib/logger";
import { type BaseContext, createContext } from "./gqlContext";

/**
 * Create GraphQL context from Next.js request
 * This extracts authentication information from headers and cookies
 */
export async function createGraphQLContext(): Promise<BaseContext> {
  const headersList = await headers();
  const cookieStore = await cookies();

  // Log cookie presence for debugging
  const allCookies = cookieStore.getAll();
  logger.debug("[GraphQL Context] Creating context", {
    cookieCount: allCookies.length,
    hasSessionId: !!cookieStore.get("session_id"),
    hasRefreshToken: !!cookieStore.get("refresh_token"),
    hasAuthHeader: !!headersList.get("authorization"),
  });

  // Extract access token from Authorization header
  const authHeader = headersList.get("authorization");
  const accessToken = extractTokenFromHeader(authHeader);

  // Extract refresh token from cookie or custom header
  const refreshToken = cookieStore.get("refresh_token")?.value || headersList.get("x-refresh-token") || undefined;

  // Extract session ID from cookie
  const sessionId = cookieStore.get("session_id")?.value || undefined;

  if (!refreshToken && !sessionId) {
    logger.debug("[GraphQL Context] No auth cookies found in request");
  }

  let userId: number | null = null;

  // Verify access token if present
  if (accessToken) {
    const payload = await verifyToken(accessToken);
    if (payload?.type === "access") {
      userId = payload.userId;
    }
  }

  // Create base context with user information
  const baseContext = await createContext({ userId });

  return {
    ...baseContext,
    refreshToken,
    sessionId,
    cookies: cookieStore,
  };
}
