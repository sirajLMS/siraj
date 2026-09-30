import { type NextRequest, NextResponse } from "next/server";
import { resolveTrustedOrigin } from "@/backend/lib";
import { clearAuthCookies } from "@/backend/lib/auth/cookies";
import { extractTokenFromHeader } from "@/backend/lib/auth/jwt";
import { sanitizeIpAddress } from "@/backend/lib/ip-utils";
import { logger } from "@/backend/lib/logger";
import { getClientIdentifier } from "@/backend/lib/ratelimit";
import { SessionService } from "@/backend/services";

const LOGIN_PATH = "/login";

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
      refreshToken: request.cookies.get("refresh_token")?.value ?? null,
      ipAddress: getIpAddress(request),
      locale: getLocale(request),
    });
  } catch (error) {
    logger.warn("Logout route failed to clear server session", {
      error: error instanceof Error ? error.constructor.name : String(error),
    });
  }

  const response = NextResponse.redirect(new URL(LOGIN_PATH, resolveTrustedOrigin(request)));
  clearAuthCookies(response.cookies);
  return response;
}

/** Cross-site requests (third-party page, auto-submitted form) must not log the user out. */
function rejectCrossSite(request: NextRequest): NextResponse | null {
  // Absent, same-origin, and same-site values are all allowed.
  const secFetchSite = request.headers.get("sec-fetch-site");
  return secFetchSite === "cross-site" ? new NextResponse(null, { status: 403 }) : null;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  // A third-party page can trigger GET /logout via an img/link (CSRF-style logout attack).
  return rejectCrossSite(request) ?? handleLogout(request);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return rejectCrossSite(request) ?? handleLogout(request);
}
