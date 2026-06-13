import { cookies, headers } from "next/headers";
import { extractTokenFromHeader, verifyToken } from "@/backend/lib/auth/jwt";
import logger from "@/backend/lib/logger";
import { type BaseContext, createContext } from "./gqlContext";

/**
 * Extract user ID from authorization header
 */
async function getUserIdFromRequest(headersList: Headers): Promise<string | null> {
  const authHeader = headersList.get("authorization");
  const accessToken = extractTokenFromHeader(authHeader);

  if (!accessToken) return null;

  const payload = await verifyToken(accessToken);
  if (payload?.type === "access") {
    return payload.userId;
  }

  return null;
}

/**
 * Extract IP address from headers
 */
function getIpAddress(headersList: Headers): string {
  const forwardedFor = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");
  return realIp || forwardedFor?.split(",")[0]?.trim() || "unknown";
}

/**
 * Create GraphQL context from Next.js request
 * This extracts authentication information from headers and cookies
 */
export async function createGraphQLContext(): Promise<BaseContext> {
  const headersList = await headers();
  const cookieStore = await cookies();

  // Extract refresh token from cookie or custom header
  const refreshToken = cookieStore.get("refresh_token")?.value || headersList.get("x-refresh-token") || undefined;

  // Extract session ID from cookie
  const sessionId = cookieStore.get("session_id")?.value || undefined;

  if (!refreshToken && !sessionId) {
    logger.debug("[GraphQL Context] No auth cookies found in request");
  }

  // Get user identity and IP
  const userId = await getUserIdFromRequest(headersList);
  const ipAddress = getIpAddress(headersList);

  // Create base context with user information
  const baseContext = await createContext({ userId });

  return {
    ...baseContext,
    refreshToken,
    sessionId,
    ipAddress,
    cookies: cookieStore,
  };
}
