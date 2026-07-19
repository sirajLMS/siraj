import { type NextRequest, NextResponse } from "next/server";
import { clearAuthCookies } from "@/backend/lib/auth/cookies";
import { extractTokenFromHeader } from "@/backend/lib/auth/jwt";
import { logger } from "@/backend/lib/logger";
import { SessionService } from "@/backend/services/auth/session.service";

const LOGIN_PATH = "/login";

function resolveRequestOrigin(request: NextRequest): string {
  // Prefer Host / X-Forwarded-* so we don't redirect to 0.0.0.0 when the
  // server listens on all interfaces but the user browsed via localhost.
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const protoHeader = request.headers.get("x-forwarded-proto");
  const proto = protoHeader ?? request.nextUrl.protocol.replace(":", "");
  return host ? `${proto}://${host}` : request.nextUrl.origin;
}

function getIpAddress(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip");
  return realIp || forwardedFor || "127.0.0.1";
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
