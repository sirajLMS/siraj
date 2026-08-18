import { cookies, headers } from "next/headers";
import { type BaseContext, createContext } from "@/backend/graphql/gqlContext";
import { extractTokenFromHeader, verifyToken } from "@/backend/lib/auth/jwt";
import { logger } from "@/backend/lib/logger";
import { ImpersonationService, PermissionGroupSimulationService } from "@/backend/services";

async function resolveAuthFromRequest(
  headersList: Headers,
  sessionId: string | undefined,
  accessTokenCookie: string | undefined
): Promise<{
  effectiveUserId: string | null;
  actorUserId?: string;
  isImpersonating: boolean;
  realUserId?: string;
  isSimulatingGroup: boolean;
  simulatedGroupSlug?: string;
}> {
  const authHeader = headersList.get("authorization");
  const accessToken = extractTokenFromHeader(authHeader) ?? accessTokenCookie ?? null;
  if (!accessToken) {
    return { effectiveUserId: null, isImpersonating: false, isSimulatingGroup: false };
  }

  const payload = await verifyToken(accessToken);
  if (payload?.type !== "access") {
    return { effectiveUserId: null, isImpersonating: false, isSimulatingGroup: false };
  }

  const impersonationIdentity = await ImpersonationService.resolveAuthIdentityFromToken(payload, sessionId);
  if (!impersonationIdentity) {
    return { effectiveUserId: null, isImpersonating: false, isSimulatingGroup: false };
  }

  if (impersonationIdentity.isImpersonating) {
    return {
      effectiveUserId: impersonationIdentity.effectiveUserId,
      actorUserId: impersonationIdentity.actorUserId,
      isImpersonating: true,
      realUserId: impersonationIdentity.actorUserId,
      isSimulatingGroup: false,
    };
  }

  const groupSimulationIdentity = await PermissionGroupSimulationService.resolveGroupSimulationFromToken(
    payload,
    sessionId
  );
  if (!groupSimulationIdentity) {
    return { effectiveUserId: null, isImpersonating: false, isSimulatingGroup: false };
  }

  // Ensure we never return an empty string as userId
  const realUserId = groupSimulationIdentity.realUserId;
  if (!realUserId) {
    return { effectiveUserId: null, isImpersonating: false, isSimulatingGroup: false };
  }

  return {
    effectiveUserId: realUserId,
    isImpersonating: false,
    realUserId,
    isSimulatingGroup: groupSimulationIdentity.isSimulatingGroup,
    simulatedGroupSlug: groupSimulationIdentity.simulatedGroupSlug,
  };
}

const IPV4_REGEX = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
const IPV6_REGEX = /^[0-9a-fA-F:]+$/;

/**
 * Extracts the client IP from request headers. Only trusts platform-trusted
 * headers (x-vercel-forwarded-for on Vercel, cf-connecting-ip behind Cloudflare)
 * when the deployment is on that platform. Falls back to x-forwarded-for (first
 * entry) and x-real-ip. Defaults to 127.0.0.1 if no valid IP is found.
 */
function getIpAddress(headersList: Headers): string {
  const isOnVercel = process.env.VERCEL === "1";
  const isBehindCloudflare = process.env.CLOUDFLARE === "1";

  if (isOnVercel) {
    const vercelIp = headersList.get("x-vercel-forwarded-for");
    if (vercelIp) {
      return vercelIp.trim();
    }
  }

  if (isBehindCloudflare) {
    const cfConnectingIp = headersList.get("cf-connecting-ip");
    if (cfConnectingIp) {
      return cfConnectingIp.trim();
    }
  }

  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    const ips = forwardedFor
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
    if (ips.length > 0) {
      const ip = ips[0];
      if (IPV4_REGEX.test(ip) || IPV6_REGEX.test(ip)) {
        return ip;
      }
    }
  }

  const realIp = headersList.get("x-real-ip");
  if (realIp) {
    const ip = realIp.trim();
    if (IPV4_REGEX.test(ip) || IPV6_REGEX.test(ip)) {
      return ip;
    }
  }

  return "127.0.0.1";
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

  // Extract refresh token from httpOnly cookie only (never from headers — prevents XSS token theft)
  const refreshToken = cookieStore.get("refresh_token")?.value ?? undefined;

  // Extract session ID from cookie
  const sessionId = cookieStore.get("session_id")?.value ?? undefined;
  const accessTokenCookie = cookieStore.get("access_token")?.value ?? undefined;

  if (!refreshToken && !sessionId) {
    logger.debug("[GraphQL Context] No auth cookies found in request");
  }

  // Determine locale
  const locale = getLocale(headersList, cookieStore);

  // Get user identity and IP
  const auth = await resolveAuthFromRequest(headersList, sessionId, accessTokenCookie);
  const ipAddress = getIpAddress(headersList);

  // Create base context with user information
  const baseContext = await createContext({
    userId: auth.effectiveUserId,
    actorUserId: auth.actorUserId,
    isImpersonating: auth.isImpersonating,
    realUserId: auth.realUserId,
    isSimulatingGroup: auth.isSimulatingGroup,
    simulatedGroupSlug: auth.simulatedGroupSlug,
    locale,
  });

  return {
    ...baseContext,
    refreshToken,
    sessionId,
    ipAddress,
    cookies: cookieStore,
    locale,
  };
}
