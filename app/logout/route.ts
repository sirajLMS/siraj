import { type NextRequest, NextResponse } from "next/server";
import { clearAuthCookies } from "@/backend/lib/auth/cookies";
import { extractTokenFromHeader } from "@/backend/lib/auth/jwt";
import { sanitizeIpAddress } from "@/backend/lib/ip-utils";
import { logger } from "@/backend/lib/logger";
import { getClientIdentifier } from "@/backend/lib/ratelimit";
import { SessionService } from "@/backend/services";

const LOGIN_PATH = "/login";

function resolveRequestOrigin(request: NextRequest): string {
  // Prefer Host / X-Forwarded-* so we don't redirect to 0.0.0.0 when the
  // server listens on all interfaces but the user browsed via localhost.
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const protoHeader = request.headers.get("x-forwarded-proto");
  const proto = protoHeader ?? request.nextUrl.protocol.replace(":", "");
  return host ? `${proto}://${host}` : request.nextUrl.origin;
}

/**
 * Security: resolve client IP using platform-trusted header checks and
 * sanitize the result. Prevents IP header spoofing/injection in session logout audit logs.
 */
function getIpAddress(request: NextRequest): string {
  const clientIdentifier = getClientIdentifier(request);
  return sanitizeIpAddress(clientIdentifier) ?? "127.0.0.1";
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
