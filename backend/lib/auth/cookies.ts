import type { ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies";
import { getStringEnv } from "@/backend/lib/env";

export function setAuthCookies(
  cookies: ResponseCookies | undefined,
  sessionId: string,
  refreshToken: string,
  accessToken?: string
): void {
  if (!cookies) return;

  const isSecure =
    process.env.NODE_ENV === "production" && (getStringEnv("ALLOWED_ORIGIN")?.startsWith("https://") ?? false);

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
