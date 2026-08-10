import { type NextRequest, NextResponse } from "next/server";
import { getEnv, getEnvironmentConfig } from "@/backend/lib/env";
import { locales } from "@/shared/locale/AppLocale";

const envConfig = getEnvironmentConfig();
const ALLOWED_ORIGINS = new Set(
  [getEnv("NEXT_PUBLIC_BASE_URL", ""), envConfig.allowedOrigin, "http://localhost:3000"].filter(
    (v): v is string => typeof v === "string" && v.length > 0
  )
);

const LOCALE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

function isAppLocale(value: string): value is (typeof locales)[number] {
  return (locales as readonly string[]).includes(value);
}

function applyLocaleCookie(response: NextResponse, locale: string): void {
  // Keep flags aligned with proxy.ts — non-httpOnly so the cookie jar stays consistent
  // across first-visit (proxy) and explicit switch (this route).
  response.cookies.set("NEXT_LOCALE", locale, {
    path: "/",
    maxAge: LOCALE_MAX_AGE,
    sameSite: "lax",
    httpOnly: false,
    secure: envConfig.nodeEnv === "production",
  });
}

/** Only allow same-origin relative paths (block open redirects). */
function safeRedirectPath(raw: string | null, fallback = "/"): string {
  if (!raw?.startsWith("/") || raw.startsWith("//") || raw.includes("://")) {
    return fallback;
  }
  return raw;
}

function isAllowedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const sameOrigin = request.nextUrl.origin;
  // Same-origin fetch always sends Origin; also allow Sec-Fetch-Site: same-origin when Origin is absent.
  if (origin && (origin === sameOrigin || ALLOWED_ORIGINS.has(origin))) {
    return true;
  }
  if (!origin && request.headers.get("sec-fetch-site") === "same-origin") {
    return true;
  }
  return false;
}

/**
 * Full-navigation locale switch: sets NEXT_LOCALE then redirects.
 * Prefer this over fetch + location.reload() so the cookie is applied on the
 * same response that loads the next document.
 */
export async function GET(request: NextRequest) {
  const localeParam = request.nextUrl.searchParams.get("locale");
  if (!localeParam || !isAppLocale(localeParam)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }

  const redirectPath = safeRedirectPath(request.nextUrl.searchParams.get("redirect"));
  // Prefer Host / X-Forwarded-* so we don't redirect to 0.0.0.0 when the
  // server listens on all interfaces but the user browsed via localhost.
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const protoHeader = request.headers.get("x-forwarded-proto");
  const proto = protoHeader ?? request.nextUrl.protocol.replace(":", "");
  const origin = host ? `${proto}://${host}` : request.nextUrl.origin;
  const response = NextResponse.redirect(new URL(redirectPath, origin));
  applyLocaleCookie(response, localeParam);
  return response;
}

export async function POST(request: NextRequest) {
  try {
    if (!isAllowedOrigin(request)) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }

    // Security Note: This endpoint is intentionally public.
    // Locale updates do not expose sensitive data or actions.
    // Session-independent cookie (NEXT_LOCALE) is used for locale preference.

    const body: unknown = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      !("locale" in body) ||
      typeof body.locale !== "string" ||
      !isAppLocale(body.locale)
    ) {
      return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
    }

    const response = NextResponse.json({ success: true, locale: body.locale });
    applyLocaleCookie(response, body.locale);
    return response;
  } catch {
    return NextResponse.json({ error: "Failed to set locale" }, { status: 500 });
  }
}
