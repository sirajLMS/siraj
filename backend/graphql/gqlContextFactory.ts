import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { cookies, headers } from "next/headers";
import { SessionRepository } from "@/backend/db/repo/shared";
import { type BaseContext, createContext } from "@/backend/graphql/gqlContext";
import { extractTokenFromHeader, verifyToken } from "@/backend/lib/auth/jwt";
import { getBooleanEnv } from "@/backend/lib/env";
import { logger } from "@/backend/lib/logger";
import { ImpersonationService, PermissionGroupSimulationService } from "@/backend/services";
import type { SessionSelectType } from "@/backend/types";

/**
 * R3-6: Fetch the session once and pass it to both resolver services so
 * `SessionRepository.findSessionById` is not called twice for the same
 * `rawSessionId` during a single context-creation pass.
 *
 * Immutability contract: the returned `SessionSelectType | null | undefined`
 * snapshot is shared read-only between `ImpersonationService.resolveAuthIdentityFromToken`
 * and `PermissionGroupSimulationService.resolveGroupSimulationFromToken`. Neither
 * service mutates the session object — they only read fields from it. If a future
 * service needs to modify the session (e.g. update payload), it must perform its
 * own `SessionRepository` write and must NOT mutate the preloaded snapshot in place.
 */
async function preloadSession(sessionId: string | undefined): Promise<SessionSelectType | null | undefined> {
  if (!sessionId) return undefined;
  return SessionRepository.findSessionById(sessionId);
}

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

  // R3-6: Fetch the session once and share it with both resolvers to avoid
  // a redundant second `findSessionById` Redis/DB read.
  const preloadedSession = await preloadSession(sessionId);

  const impersonationIdentity = await ImpersonationService.resolveAuthIdentityFromToken(
    payload,
    sessionId,
    preloadedSession
  );
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
    sessionId,
    preloadedSession
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

/**
 * Resolve the client IP from raw proxy forwarding headers (x-forwarded-for
 * leftmost entry, then x-real-ip). Callers MUST only invoke this behind an
 * explicitly trusted reverse proxy (`TRUSTED_PROXY=true`) — otherwise these
 * headers are client-spoofable and would allow rate-limit bucket rotation
 * (security review M2).
 */
function resolveTrustedProxyIp(headersList: Headers): string | null {
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    const ips = forwardedFor
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
    if (ips.length > 0 && isIP(ips[0]) > 0) {
      return ips[0];
    }
  }

  const realIp = headersList.get("x-real-ip");
  if (realIp) {
    const ip = realIp.trim();
    if (isIP(ip) > 0) {
      return ip;
    }
  }
  return null;
}

/**
 * Extracts the client IP from request headers. Only trusts platform-trusted
 * headers (x-vercel-forwarded-for on Vercel, cf-connecting-ip behind Cloudflare)
 * when the deployment is on that platform. Raw x-forwarded-for / x-real-ip are
 * honored only behind an explicit TRUSTED_PROXY=true reverse proxy (M2). Uses a
 * UA+Accept-Language fingerprint if no valid IP is found so clients with
 * different fingerprints are rate-limited separately.
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

  // Trusted reverse proxy opt-in (security review M2 — see resolveTrustedProxyIp).
  if (getBooleanEnv("TRUSTED_PROXY")) {
    const proxyIp = resolveTrustedProxyIp(headersList);
    if (proxyIp) {
      return proxyIp;
    }
  }

  // No valid IP header found — generate a fallback identifier from request
  // headers so clients with different fingerprints are rate-limited separately
  // rather than sharing a single bucket.
  const userAgent = headersList.get("user-agent") ?? "";
  const acceptLanguage = headersList.get("accept-language") ?? "";
  const fingerprint = createHash("sha256").update(`${userAgent}:${acceptLanguage}`).digest("hex").slice(0, 32);

  return `anon:${fingerprint}`;
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
