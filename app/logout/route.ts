import { type NextRequest, NextResponse } from "next/server";
import { clearAuthCookies } from "@/backend/lib/auth/cookies";
import { extractTokenFromHeader } from "@/backend/lib/auth/jwt";
import { getBooleanEnv, getEnv, getEnvironmentConfig } from "@/backend/lib/env";
import { logger } from "@/backend/lib/logger";
import { SessionService } from "@/backend/services";

const LOGIN_PATH = "/login";

const envConfig = getEnvironmentConfig();
const ALLOWED_ORIGINS = new Set(
  [getEnv("NEXT_PUBLIC_BASE_URL", ""), envConfig.allowedOrigin, "http://localhost:3000"].filter(
    (v): v is string => typeof v === "string" && v.length > 0
  )
);

function resolveRequestOrigin(request: NextRequest): string {
  // Prefer Host / X-Forwarded-* only if TRUSTED_PROXY is set or host matches request.nextUrl.host / ALLOWED_ORIGINS.
  // Prevents Host header injection open redirects (security review).
  const candidateHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (candidateHost) {
    const candidateHostName = candidateHost.split(":")[0];
    const isTrusted =
      getBooleanEnv("TRUSTED_PROXY") ||
      candidateHost === request.nextUrl.host ||
      candidateHostName === request.nextUrl.hostname ||
      ALLOWED_ORIGINS.has(candidateHost) ||
      ALLOWED_ORIGINS.has(`http://${candidateHost}`) ||
      ALLOWED_ORIGINS.has(`https://${candidateHost}`);

    if (isTrusted) {
      const protoHeader = request.headers.get("x-forwarded-proto");
      const proto = protoHeader ?? request.nextUrl.protocol.replace(":", "");
      return `${proto}://${candidateHost}`;
    }
  }

  return request.nextUrl.origin;
}

function getIpAddress(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip");
  return realIp ?? forwardedFor ?? "127.0.0.1";
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
