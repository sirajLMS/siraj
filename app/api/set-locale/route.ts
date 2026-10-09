import { type NextRequest, NextResponse } from "next/server";
import { ALLOWED_ORIGINS, resolveTrustedOrigin } from "@/backend/lib";
import { getEnvironmentConfig } from "@/backend/lib/env";
import { apiRateLimiter, checkRateLimit, getClientIdentifier } from "@/backend/lib/ratelimit";
import { getServerTranslations } from "@/shared/locale";
import { isRelativeSafePath } from "@/shared/lib/safe-path";
import { locales } from "@/shared/locale/AppLocale";

const envConfig = getEnvironmentConfig();

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
  if (!raw || !isRelativeSafePath(raw) || raw.includes("://")) {
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
function resolveLocaleFromRequest(request: NextRequest): string {
  return request.headers.get("accept-language")?.split(",")[0]?.split("-")[0] ?? "ar";
}

export async function GET(request: NextRequest) {
  const locale = resolveLocaleFromRequest(request);
  const tErrors = getServerTranslations(locale).errorsTranslations;

  const ip = getClientIdentifier(request);
  const rateLimit = await checkRateLimit(`set-locale:${ip}`, apiRateLimiter);
  if (!rateLimit.success) {
    return NextResponse.json({ error: tErrors.rateLimitExceeded }, { status: 429 });
  }

  // Same origin guard as POST — the full-navigation redirect must not be
  // triggerable from a hostile origin.
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: tErrors.invalidOrigin }, { status: 403 });
  }

  const localeParam = request.nextUrl.searchParams.get("locale");
  if (!localeParam || !isAppLocale(localeParam)) {
    return NextResponse.json({ error: tErrors.invalidLocale }, { status: 400 });
  }

  const redirectPath = safeRedirectPath(request.nextUrl.searchParams.get("redirect"));
  const origin = resolveTrustedOrigin(request);
  const response = NextResponse.redirect(new URL(redirectPath, origin));
  applyLocaleCookie(response, localeParam);
  return response;
}

export async function POST(request: NextRequest) {
  const locale = resolveLocaleFromRequest(request);
  const tErrors = getServerTranslations(locale).errorsTranslations;

  const ip = getClientIdentifier(request);
  const rateLimit = await checkRateLimit(`set-locale:${ip}`, apiRateLimiter);
  if (!rateLimit.success) {
    return NextResponse.json({ error: tErrors.rateLimitExceeded }, { status: 429 });
  }

  try {
    if (!isAllowedOrigin(request)) {
      return NextResponse.json({ error: tErrors.invalidOrigin }, { status: 403 });
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
      return NextResponse.json({ error: tErrors.invalidLocale }, { status: 400 });
    }

    const response = NextResponse.json({ success: true, locale: body.locale });
    applyLocaleCookie(response, body.locale);
    return response;
  } catch {
    return NextResponse.json({ error: tErrors.failedToSetLocale }, { status: 500 });
  }
}
