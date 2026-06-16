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
 * Determine locale from cookies or headers
 */
function getLocale(headersList: Headers, cookieStore: Awaited<ReturnType<typeof cookies>>): string {
  // 1. Try cookie
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value;
  if (localeCookie && ["ar", "en"].includes(localeCookie)) {
    return localeCookie;
  }

  // 2. Try Accept-Language header
  const acceptLanguage = headersList.get("accept-language");
  if (acceptLanguage) {
    if (acceptLanguage.includes("ar")) return "ar";
    if (acceptLanguage.includes("en")) return "en";
  }

  // 3. Default
  return "ar";
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

  // Determine locale
  const locale = getLocale(headersList, cookieStore);

  // Get user identity and IP
  const userId = await getUserIdFromRequest(headersList);
  const ipAddress = getIpAddress(headersList);

  // Create base context with user information
  const baseContext = await createContext({ userId, locale });

  return {
    ...baseContext,
    refreshToken,
    sessionId,
    ipAddress,
    cookies: cookieStore,
    locale,
  };
}
