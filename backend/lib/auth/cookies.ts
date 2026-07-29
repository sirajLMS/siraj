import type { ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies";
import { getStringEnv } from "@/backend/lib/env";
import { logger } from "@/backend/lib/logger";

export function setAuthCookies(
  cookies: ResponseCookies | undefined,
  sessionId: string,
  refreshToken: string,
  accessToken?: string
): void {
  if (!cookies) return;

  // Production is served exclusively over HTTPS, so the Secure flag must always
  // be set in production regardless of how ALLOWED_ORIGIN is configured. The
  // previous behavior (secure = NODE_ENV === "production" && ALLOWED_ORIGIN
  // starts with https://) shipped insecure cookies whenever an operator
  // copied .env.example (which defaults to http://localhost:3000) into a
  // production deployment without overriding ALLOWED_ORIGIN.
  const isProduction = process.env.NODE_ENV === "production";
  const isSecure = isProduction && process.env.AUTH_COOKIE_SECURE !== "false";
  if (isProduction) {
    const allowedOrigin = getStringEnv("ALLOWED_ORIGIN");
    if (allowedOrigin?.startsWith("http://")) {
      logger.warn(
        "[cookies] ALLOWED_ORIGIN starts with http:// in production — auth cookies will still be Secure, but CORS may be misconfigured",
        { allowedOrigin }
      );
    }
  }

  const options = {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  };

  cookies.set("session_id", sessionId, options);
  cookies.set("refresh_token", refreshToken, options);

  if (accessToken) {
    cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax" as const,
      maxAge: 60 * 15, // 15 minutes — matches JWT_ACCESS_TOKEN_EXPIRY
      path: "/",
    });
  }
}

const AUTH_COOKIE_NAMES = ["session_id", "refresh_token", "access_token"] as const;

/** Clear auth cookies with path `/` so deletion matches {@link setAuthCookies}. */
export function clearAuthCookies(cookies: ResponseCookies | undefined): void {
  if (!cookies) return;

  for (const name of AUTH_COOKIE_NAMES) {
    cookies.delete({ name, path: "/" });
  }
}
