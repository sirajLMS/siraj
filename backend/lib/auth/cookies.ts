import type { ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies";

export function setAuthCookies(
  cookies: ResponseCookies | undefined,
  sessionId: string,
  refreshToken: string,
  accessToken?: string
): void {
  if (!cookies) return;

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  };

  cookies.set("session_id", sessionId, options);
  cookies.set("refresh_token", refreshToken, options);

  if (accessToken) {
    cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      maxAge: 60 * 15, // 15 minutes — matches JWT_ACCESS_TOKEN_EXPIRY
      path: "/",
    });
  }
}
