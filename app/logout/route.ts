import { type NextRequest, NextResponse } from "next/server";
import { clearAuthCookies } from "@/backend/lib/auth/cookies";
import { extractTokenFromHeader } from "@/backend/lib/auth/jwt";
import { getEnv, getEnvironmentConfig } from "@/backend/lib/env";
import { sanitizeIpAddress } from "@/backend/lib/ip-utils";
import { logger } from "@/backend/lib/logger";
import { getClientIdentifier } from "@/backend/lib/ratelimit";
import { SessionService } from "@/backend/services";

const LOGIN_PATH = "/login";

const envConfig = getEnvironmentConfig();
const ALLOWED_ORIGINS = new Set(
  [getEnv("NEXT_PUBLIC_BASE_URL", ""), envConfig.allowedOrigin, "http://localhost:3000"].filter(
    (v): v is string => typeof v === "string" && v.length > 0
  )
);

function resolveRequestOrigin(request: NextRequest): string {
  // Only honour Host / X-Forwarded-* when the candidate host is trusted — a
  // client-supplied Host header must never pick the redirect origin
  // (host-header injection / open redirect).
  const candidateHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (candidateHost) {
    const candidateHostName = candidateHost.split(":")[0];
    const isTrusted =
      candidateHost === request.nextUrl.host ||
      candidateHostName === request.nextUrl.hostname ||
      ALLOWED_ORIGINS.has(candidateHost) ||
      ALLOWED_ORIGINS.has(`http://${candidateHost}`) ||
      ALLOWED_ORIGINS.has(`https://${candidateHost}`);
    if (isTrusted) {
      const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
      return `${proto}://${candidateHost}`;
    }
  }
  return request.nextUrl.origin;
}

function getIpAddress(request: NextRequest): string {
  // Route through the shared ratelimit identifier chain + sanitizer so audit
  // logs do not persist raw, attacker-controlled header values verbatim.
  return sanitizeIpAddress(getClientIdentifier(request)) ?? "[IP_REDACTED]";
}

function getLocale(request: NextRequest): string {
  const localeCookie = request.cookies.get("NEXT_LOCALE")?.value;
  if (localeCookie === "ar" || localeCookie === "en") {
    return localeCookie;
  }
  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage?.includes("en")) return "en";
  return "ar";
}

async function handleLogout(request: NextRequest): Promise<NextResponse> {
  const sessionId = request.cookies.get("session_id")?.value ?? null;
  const accessToken =
    extractTokenFromHeader(request.headers.get("authorization")) ?? request.cookies.get("access_token")?.value ?? null;

  try {
    await SessionService.logoutUser({
      sessionId,
      accessToken,
      ipAddress: getIpAddress(request),
      locale: getLocale(request),
    });
  } catch (error) {
    logger.warn("Logout route failed to clear server session", {
      error: error instanceof Error ? error.constructor.name : String(error),
    });
  }

  const response = NextResponse.redirect(new URL(LOGIN_PATH, resolveRequestOrigin(request)));
  clearAuthCookies(response.cookies);
  return response;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleLogout(request);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleLogout(request);
}
